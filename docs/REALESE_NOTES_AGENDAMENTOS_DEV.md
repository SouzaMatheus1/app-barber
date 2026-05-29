# 🛠️ Release Notes - Técnico para Desenvolvedores (v2.0)

Esta documentação detalha as mudanças arquiteturais, estruturais e de segurança introduzidas no sistema com a migração para **Multi-Tenant (SaaS)** e a implementação dos módulos de Assinaturas e Custos.

---

## 1. Arquitetura Multi-Tenant & Isolamento de Dados

A arquitetura do sistema foi migrada de *Single-Tenant* (instalações isoladas) para um modelo **SaaS Multi-Tenant** compartilhado (uma instância única de API e Banco de Dados atendendo múltiplos locatários com isolamento estrito).

### Injeção de Contexto Assíncrono (`AsyncLocalStorage`)
Para evitar vazamentos de dados entre inquilinos (*cross-tenant data leakage*) sob requisições concorrentes, adotamos o `AsyncLocalStorage` do Node.js:
- **`tenantContext.ts`**: Cria um storage isolado para armazenar o `empresaId` durante o ciclo de vida de cada requisição.
- **Middleware de Autenticação (`auth.ts`)**: Decodifica o JWT enviado (seja do portal ou administrativo), extrai o `empresaId` criptograficamente assinado e inicia a execução da rota com `tenantStorage.run()`.

### Middleware Global do Prisma (`prisma.ts`)
Implementamos uma extensão global no Prisma Client (`$allOperations`) que intercepta todas as operações de banco de dados nos modelos definidos em `TENANT_MODELS`:
- **Operações de Leitura (`findMany`, `findFirst`, etc.)**: Injeta automaticamente a cláusula `where: { empresaId: currentTenantId }` em tempo de execução.
- **Operações de Escrita (`create`, `createMany`)**: Injeta de forma invisível o `empresaId` nos dados a serem inseridos.
- **Operações Baseadas em ID (`update`, `delete`, `findUnique`)**: Realiza um pré-check de contagem no modelo garantindo que o registro com o ID fornecido pertence à empresa do contexto atual antes de executar a modificação. Caso contrário, joga um erro de permissão.

---

## 2. Refatoração de Banco de Dados (`schema.prisma`)

Foram aplicadas modificações profundas no banco de dados através de migrations atômicas (`Prisma Migrate`):
1. **Model `Empresa` (Nova Raiz)**: Substituiu o antigo modelo "Barbearia", generalizando a plataforma white-label.
2. **Model `TipoEmpresa`**: Permite classificar o tipo de negócio (ex: Barbearia, Salão, Clínica).
3. **Model `Plano` e `Assinatura`**: Suporte para recorrências contratuais.
4. **Model `CreditoAssinatura`**: Rastreabilidade e decremento automático de créditos.
5. **Model `CategoriaCusto` e `FechamentoCaixa`**: Tabelas de apoio contábil.
6. **Injeção de FK**: A coluna `empresaId` foi adicionada a todas as tabelas transacionais (`Profissional`, `Cliente`, `Transacao`, `ItemCatalogo`, `Assinatura`, `FechamentoCaixa`, `CategoriaCusto`, `ItemTransacao`, `CreditoAssinatura`, `Agendamento`).

---

## 3. Segurança de Rede, CORS & Sessão

### Configuração de CORS Restrita (`server.ts`)
Substituímos o CORS padrão (`*`) por um validador de whitelist dinâmico que carrega as origens aceitas em produção via variáveis de ambiente:
```typescript
const allowedOrigins = [
  process.env.ADMIN_FRONTEND_URL,
  process.env.PORTAL_FRONTEND_URL
].filter(Boolean) as string[];
```
Caso a requisição não venha de uma dessas origens (e o ambiente seja de produção), ela é rejeitada na camada HTTP do Express.

### Interceptor Axios & Tratamento de Expirados (`api.ts`)
- **Separação de Storage**: B2B e PWA rodam em subdomínios diferentes. O Axios foi simplificado para ler a chave do cookie correto baseado no caminho da URL atual (lendo `'portal_token'` para o PWA ou `'token'` para a aplicação administrativa).
- **Tratamento de status 401**: Adicionado interceptor de resposta que monitora tokens expirados e redireciona dinamicamente:
  - No PWA: Redireciona para o login do cliente `/portal/${slug}/login` (extraindo o slug da URL atual).
  - No Admin: Redireciona para `/login`.

---

## 4. Script de Migração ETL (`scripts/migrate-b-to-a.ts`)

Desenvolvemos um script robô em TypeScript de alta performance para converter bancos legados para o novo modelo consolidado:
- Realiza o processamento de tabelas respeitando a ordem de chaves estrangeiras.
- Utiliza a técnica de *offsetting* (salto de IDs incrementando $100.000$ nas chaves primárias e estrangeiras) para unificar registros sem colisão matemática no banco unificado.
- Utiliza mapeamento em memória (`Map`) para manter o vínculo entre os IDs originais e os novos IDs gerados.

---

## 5. Módulo de Temas Dinâmicos (Stub)
O módulo de White-label foi pausado temporariamente para estabilização do MVP:
- O controlador `TemaController` atua como um *stub*, retornando uma paleta de cores global padrão.
- As variáveis CSS no DOM Root (`frontend/src/index.css`) garantem o theming do site de forma centralizada e leve.

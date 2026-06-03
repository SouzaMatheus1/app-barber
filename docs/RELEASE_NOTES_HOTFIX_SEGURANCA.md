# 📝 Release Notes - Hotfix de Segurança e Infraestrutura Global (`hotfix/seguranca-infra`)

Este documento consolida as alterações estruturais de segurança aplicadas no backend do projeto **Lambda M** para mitigar vulnerabilidades e garantir conformidade com políticas de segurança de produção.

---

## 1. Segurança e Isolamento Multi-tenant (Prisma)
- **Guardião de Tenant Ativo (Fail-Safe):** Adicionada uma validação de segurança no middleware `$extends` do Prisma. Se uma consulta for feita em um modelo com escopo de tenant (`TENANT_MODELS`) sem que um `empresaId` esteja configurado no contexto (`tenantStorage`), a operação é imediatamente abortada com um erro descritivo. Isso impede vazamento ou consulta acidental de dados globais.
- **Scoping por Chaves Únicas Secundárias:** Ajustada a validação de acesso restrito nas operações baseadas em chaves exclusivas (`findUnique`, `update`, `delete`). Agora, consultas por campos como `email` (na busca de profissionais) também são validadas contra o `empresaId` ativo para impedir acesso a registros de outros tenants.
- **Refinamento do Filtro de Registro Único:** Ajustada a validação de operações únicas para realizar uma checagem em duas etapas. O sistema verifica se o registro pesquisado existe globalmente no banco antes de aplicar a restrição de tenant. Se não existir, a query prossegue normalmente (permitindo que o Prisma retorne `null` ou lance erro nativo de registro não encontrado), evitando erros de "Acesso Restrito" em validações de novos cadastros (como checagem de e-mail de profissional).
- **systemPrisma Exportado:** O cliente base do Prisma foi exportado sob o nome `systemPrisma` para permitir consultas globais controladas e legítimas (como a busca de profissionais por e-mail no login).

## 2. Ajustes de Lógica do Negócio (Back-End)
- **Login Seguro:** Refatorado o método `login` em `AuthService.ts` para usar o `systemPrisma` de forma explícita na busca inicial por e-mail (antes do estabelecimento do contexto do tenant).
- **Fechamento de Caixa Concorrente:** Adicionada a injeção do filtro `empresaId` na transação do fechamento de caixa (`TransacaoService.ts`), corrigindo uma brecha crítica que unificava transações de múltiplos tenants.
- **Prevenção de Clientes Duplicados:** Implementada checagem no `ClienteService.ts` que impede a criação ou edição de clientes com telefones já utilizados por outros clientes ativos do mesmo tenant.

## 3. Proteções de Infraestrutura (Server Express)
- **Cabeçalhos de Segurança (Helmet):** Integrado o middleware `helmet` no servidor Express, injetando cabeçalhos de segurança fundamentais como CSP (Content Security Policy), HSTS (HTTP Strict Transport Security), X-Frame-Options, e mitigação de XSS.
- **Prevenção de Ataques brute-force (Rate Limiting) & CORS:** Configurado o `express-rate-limit` ajustando a ordem de middlewares para que o `cors` seja executado antes dos limitadores, evitando erros de *Cross-Origin bloqueado* na resposta 429. Em ambiente de desenvolvimento local, a taxa limite foi flexibilizada para 10.000 requisições gerais (1.000 para autenticação) a fim de impedir o bloqueio de desenvolvedores e suítes de teste.
  - *Produção:* Limite geral de 100 requisições por 15 minutos; 15 para login.
  - *Desenvolvimento:* Limite geral de 10.000 requisições por 15 minutos; 1.000 para login.
- **Limitação de Payload JSON:** Definido o limite máximo de tamanho de payload para requisições JSON em `10kb` para mitigar ataques de negação de serviço (DoS) por payloads de tamanho excessivo.
- **Verificação de Chave de Assinatura (JWT):** O servidor agora valida a presença da variável de ambiente `JWT_SECRET` na inicialização e encerra imediatamente o processo com erro fatal caso ela não esteja configurada no `.env`.
- **Tratamento Seguro de Exceções:** Atualizado o `errorHandler.ts` para ocultar stack traces e detalhes técnicos (como erros SQL ou do Prisma) em ambientes de produção (`NODE_ENV === 'production'`), exibindo uma mensagem genérica de erro interno.

## 4. Ajustes de Interface do Usuário (Front-End)
- **Correção da Aba de Relatórios de Assinatura:** Ajustada a renderização em `Assinaturas.tsx` para que a tabela de assinantes seja totalmente omitida quando a aba ativa for a de relatórios (`activeTab === 'relatorios'`), solucionando a sobreposição de blocos visuais.
- **Tratamento de Alertas Específicos:** Atualizada a página de clientes (`Clientes.tsx`) para capturar e exibir mensagens de erro personalizadas enviadas pelo backend (como avisos de duplicação de telefone) em vez de exibir alertas genéricos.

## 5. Testes de Integração & Unidade
- **Ajustes de Mocking:** Corrigidos os mocks das chamadas ao Prisma nos testes para cobrir o uso do `systemPrisma` e as queries com `findFirst`.
- **Alinhamento de Soft-Delete:** Atualizados os testes de deleção de catálogo (`itemCatalogo.test.ts`) e clientes (`cliente.test.ts`) para validar a chamada ao método `update` com `{ ativo: false }` (soft-delete implementado nos serviços) em vez do método `delete` destrutivo do banco.
- **Resultados:** 100% dos testes da suíte Jest (39 testes em 7 arquivos) passando com sucesso, incluindo os novos cenários de validação de telefones exclusivos.

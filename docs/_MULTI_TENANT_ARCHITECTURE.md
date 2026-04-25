# Migração: SaaS Genérico (B2B Multi-Tenant)

Este documento descreve a transição arquitetural adotada no sistema para evoluí-lo de um modelo engessado para barbearias em uma **Plataforma B2B Genérica** (capaz de atender clínicas, pet shops, estúdios, oficinas, etc.) operando múltiplas empresas simultaneamente de forma isolada, centralizada e econômica. Tudo acomodado em apenas **1 Banco de Dados Unificado (Aiven - MySQL)** e **1 API Backend Node.js**.

## 1. Visão Arquitetural

A implementação multi-tenant foi projetada sob os seguintes pilares:
- **Identificação Dinâmica via JWT:** O usuário faz Login no site e o backend embute na chave de sessão daquele usuário qual é o id da Empresa dele (`empresaId`). 
- **Row-Level Security (RLS) via Middleware:** Usamos uma interceptação nativa (Extension Global) do Prisma (`src/database/prisma.ts`). De forma que toda vez que um desenvolvedor escrever `prisma.cliente.findMany()`, a query será magicamente modificada em tempo de execução injetando os filtros daquela respectiva Empresa, garantindo que um cliente jamais acesse os dados de um lojista vizinho.

## 2. Refatorações no Banco de Dados (`schema.prisma`)

As seguintes modificações foram implementadas na base:
1. **Model `TipoEmpresa`**: Sub-entidade criada para permitir que o sistema classifique clientes B2B (Ex: ID 1 = Barbearia, ID 2 = Mecânica).
2. **Model `Empresa`**: A nova tabela raiz universal arquitetada para representar o locatário real do sistema no lugar da antiga tabela "Barbearia". 
3. **Coluna `empresaId`**: Foi injetada como Foreign Key de Segurança em absolutamente todas as tabelas transacionais: `Profissional`, `Cliente`, `Transacao`, `ItemCatalogo`, `Plano` e `Assinatura`. 
4. **Casos Globais:** Algumas tabelas atuam apenas como dicionário comum compartilhado e são agnósticas (não recebem o ID da Empresa), como por exemplo: `MetodoPagamento`, `Perfil`, `TipoItem`, `TipoTransacao`.

## 3. Segurança Baseada no App (Contexto Assíncrono)

Para impedir o vazamento ou intersecção de dados (Cross-Tenant Leak) em requisições simultâneas:
- Foi aplicada a biblioteca embutida do core do Node.js: `AsyncLocalStorage` (`tenantContext.ts`).
- No instante da validação da Rota (`auth.ts`), se a rota for protegida e o token for válido, a sessão isola a Requisição Web atual colocando o ID da Empresa em uma variável aérea intocável.
- A Engine de extensão (`$allOperations` no `prisma.ts`) captura esse número no exato instante antes da query ir pro banco, blindando automaticamente qualquer operação não restrita com o `where: { empresaId: X }` e injetando na criação com `data: { empresaId: X }`.

## 4. O Script de Migração Final (ETL)

A conversão dos antigos bancos isolados baseados no ambiente antigo para a Nuvem Central do SaaS utiliza a estratégia de Offsetting (Salto Numérico) nas IDs Primárias.
- Para evitar colisões matemáticas entre Instâncias separadas quando unidas em uma só base, foi arquitetado o `scripts/migrate.ts`.
- O Robô lê a Fonte de Dados original (ex: Banco da Empresa 2 isolado) e chuta pacotes de cópia para o banco Master. No meio do trajeto, ele faz `ID + 100.000` em toda chave primária e Foreign Key do relacionamento forçando eles a assumirem o vínculo de `empresaId = 2`.
- Isso garante 0.00% de perda ou intersecção na integridade do histórico contábil herdado dos clientes.

## 5. Tema Dinâmico (White-label)

Para suportar o atendimento a diferentes nichos e identidades corporativas, foi implementada uma estrutura de **Tema Dinâmico** baseada no conceito White-label:
- **Banco de Dados**: Criado o model `Tema` atrelado em relação 1:1 com a `Empresa`. Ele armazena as escolhas estéticas como `corPrimaria`, `corFundo` e `logoUrl`.
- **Backend (API)**: O sistema expõe as configurações visuais de uma empresa a partir de seu `slug` através de endpoints públicos. Isso garante que a customização carregue _antes_ mesmo de existir uma sessão de login (útil para portais de clientes).
- **Frontend (Injeção de CSS)**: As cores fixas foram substituídas por variáveis semânticas CSS (`var(--color-primary)`, etc.). Um Hook customizado (`useTheme.ts`) intercepta o ciclo de vida inicial do React, busca a paleta baseada no domínio/slug e injeta os valores na folha de estilos (DOM Root).

*(Documentação técnica arquivada no controle de versões sob a branch `feature/multi-tenant`)*

# 🛠️ Multi-Tenant & Financeiro: Technical Release Notes (v2.0)

Essa atualização transforma a arquitetura do sistema de *Single-Tenant* (uma instalação por barbearia) para **Multi-Tenant (SaaS)**, permitindo que várias empresas compartilhem o mesmo banco de dados com segurança total. Além disso, foram adicionados módulos financeiros completos.

## O que foi atualizado:

1. **Arquitetura Multi-Tenant Base (`empresaId`)**
   - **O que é:** Todas as tabelas transacionais e de domínio (`Profissional`, `Cliente`, `Transacao`, `ItemCatalogo`, `Assinatura`, `CreditoAssinatura`, `ItemTransacao`, etc.) receberam a coluna `empresaId`.
   - **Como usar:** O desenvolvedor não precisa fazer filtros manuais de `empresaId` na Controller. Foi implementado o Middleware Prisma no `src/database/prisma.ts` que utiliza o `tenantContext.ts` (AsyncLocalStorage) para injetar e filtrar o `empresaId` de forma invisível em todas as queries baseadas na lista `TENANT_MODELS`.

2. **Script de Migração ETL (`scripts/migrate-b-to-a.ts`)**
   - **O que é:** Um robô de injeção desenvolvido em TypeScript para sugar dados de bancos legados (Single-Tenant) e injetá-los no Banco Master preservando a integridade das *Foreign Keys* usando dicionários em memória (`Map`).
   - **Como usar:** Executar `npx tsx scripts/migrate-b-to-a.ts` com as variáveis `.env` (`DATABASE_URL_A` e `DATABASE_URL_B`) configuradas.

3. **Módulos de Assinatura e Fluxo de Caixa**
   - **O que é:** Criação das tabelas `Assinatura`, `Plano`, `FechamentoCaixa`, e `CategoriaCusto`. Criação de abas no Dashboard (`FluxoCaixaTab.tsx` e `VendasTab.tsx`).
   - **Como usar:** Os endpoints já estão mapeados nas novas controllers (`AssinaturaController`, `CategoriaCustoController`, `FinanceiroController`).

4. **Prisma Migrations para Deploy de Produção**
   - **O que é:** Dois arquivos SQL atômicos (`init_multi_tenant_base` e `add_tenant_constraints`) gerados utilizando o *Prisma Migrate*. Projetados para rodar nativamente via CLI sem estourar os limites de RAM da droplet de Produção.
   - **Como usar:** Rodar `npx prisma migrate deploy` na esteira de CI/CD ou no servidor.

5. **Módulo de Temas Dinâmicos (Pausado)**
   - **O que é:** Hook `useTheme.ts` e `TemaController` para alterar variáveis CSS baseado no ID da Empresa.
   - **Aviso:** No momento, os controllers de tema estão temporariamente em formato estático (mock) para garantir estabilidade do lançamento SaaS.

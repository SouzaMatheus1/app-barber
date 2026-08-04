# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão Geral

Monorepo SaaS B2B multi-tenant (originalmente uma barbearia, hoje genérico para barbearias, pet shops, lava-rápidos, etc. — ver "Multiverticalidade" abaixo). Duas aplicações independentes:

- `backend/`: Node.js + Express 5 + Prisma (MySQL/MariaDB via `@prisma/adapter-mariadb`).
- `frontend/`: React 19 + Vite + TailwindCSS v4.

Documentação detalhada já existe em `docs/` (`1_SYSTEM_OVERVIEW.md`, `3_DATABASE_SCHEMA.md`, `4_API_REFERENCE.md`, `5_FRONTEND_ARCHITECTURE.md`, `ARCHITECTURE.md`, `_MULTI_TENANT_ARCHITECTURE.md`, `TESTING.md`, `CONVENTIONS.md`) — consulte-os para detalhes que não estejam aqui.

## Comandos

### Raiz do monorepo
```bash
npm run dev:back     # roda o backend (equivalente a cd backend && npm run dev)
npm run dev:front    # roda o frontend
npm run dev:all:lin  # roda os dois em paralelo (Linux/macOS)
```

### Backend (`cd backend`)
```bash
npm run dev                 # ts-node-dev, hot-reload
npm run build                # prisma generate && tsc
npm test                     # roda toda a suíte Jest
npx jest --watch             # modo observação
npx jest src/__tests__/transacao.test.ts   # um arquivo específico
npx jest -t "nome do teste"  # um teste específico por nome
npx prisma generate          # regenerar client após alterar schema.prisma
npx prisma db push           # sincronizar schema local sem migration
npx prisma migrate dev       # criar nova migration
```
Testes ficam em `src/__tests__/*.test.ts`, executam com `ts-jest`/`testEnvironment: node`, e não dependem de banco real — Prisma é mockado.

### Frontend (`cd frontend`)
```bash
npm run dev        # Vite dev server
npm run build       # tsc -b && vite build
npm run lint         # ESLint
npm test             # Vitest (headless)
npm run test:ui      # Vitest com UI
npx vitest run src/pages/Transacoes/__tests__/Transacoes.test.tsx   # um arquivo
npx vitest run -t "nome do teste"                                    # um teste por nome
```
Testes usam Vitest + React Testing Library + jsdom, colocados em `__tests__/` ao lado do código testado. Serviços de API são mockados.

## Arquitetura Multi-Tenant (crítico, ler antes de tocar em queries)

O banco é **Shared Database / Shared Schema**: todas as empresas (tenants) compartilham as mesmas tabelas MySQL. Isolamento é 100% responsabilidade da camada de aplicação, via três peças que trabalham juntas:

1. **`backend/src/middleware/auth.ts`** (`isAuth`): decodifica o JWT, extrai `empresaId` do payload e chama `tenantStorage.run({ empresaId }, next)` — isso abre um contexto `AsyncLocalStorage` que dura todo o ciclo de vida da requisição.
2. **`backend/src/database/tenantContext.ts`**: define esse `tenantStorage` (`AsyncLocalStorage<{ empresaId }>`).
3. **`backend/src/database/prisma.ts`**: exporta um `PrismaClient` estendido (`$extends` com `$allOperations`) que, para todo modelo listado em `TENANT_MODELS`, injeta automaticamente `empresaId` no `where` (leituras/updates/deletes em massa) ou no `data` (creates). Se não houver `empresaId` no contexto async, a extensão **lança erro** em vez de deixar a query passar sem filtro — é o guard-rail contra vazamento cross-tenant.

**Regra de ouro:** nunca filtre `empresaId` manualmente nas controllers/services para modelos de `TENANT_MODELS` — a extensão já faz isso. Ao criar um novo modelo com dados por-tenant, adicione seu nome em `TENANT_MODELS` (`backend/src/database/prisma.ts`) e a coluna `empresaId` no `schema.prisma`. Modelos globais/dicionário (`MetodoPagamento`, `Perfil`, `TipoItem`, `TipoTransacao`, `TipoEmpresa`, `TipoAtivo`, etc.) **não** entram nessa lista e não levam `empresaId`.

Sempre que uma rota depende de contexto de tenant, ela precisa passar por `isAuth` primeiro (ver `backend/src/routes/routes.ts`) — sem isso, `tenantStorage.getStore()` volta vazio e a query falha por design.

### Rotas públicas (sem `isAuth`)
`POST /login`, `GET /temas/empresa/:slug`, e as rotas do Portal do Cliente (`/portal/:slug/...`) — o Portal usa um fluxo de auth paralelo (`PortalAuthController`, `PortalAuthContext.tsx`, `PortalPrivateRoute.tsx`) separado do painel administrativo.

## Fluxo de camadas no Backend

`routes.ts` → `Controller` (validação de payload + resposta HTTP) → `Service` (regra de negócio) → `Prisma` (extensão de tenant aplicada automaticamente) → MySQL.

- Nunca exponha o Prisma Client diretamente em controllers.
- Erros de negócio usam a classe `AppError` (`backend/src/utils/AppError.ts`): `throw new AppError("mensagem", statusCode)`. O `errorHandler.ts` (middleware global) captura e formata como `{ status: "error", message }`.
- Lógica financeira pesada (rateio, dedução de créditos de assinatura, cálculos proporcionais) fica **sempre** no backend, nunca no frontend — o front consome valores já computados (ex.: `valorProporcional` retornado por `AssinaturaService.ts`).

## Multiverticalidade (Ativos)

O sistema evoluiu de "só barbearia" para atender múltiplos segmentos de negócio via os modelos `TipoEmpresa`, `TipoAtivo`, `TipoEmpresaAtivo` e `Ativo` (com especializações `AtivoVeiculo` e `AtivoAnimal`, cada uma com seu próprio lookup — `CategoriaVeiculo`, `EspecieAnimal`). Um `Ativo` pertence a um `Cliente` e pode estar vinculado a uma `Transacao`.

No frontend, `frontend/src/utils/labelsPorSegmento.ts` centraliza a troca de vocabulário conforme o segmento da empresa logada (ex.: "Barbeiro" vira "Profissional" para pet shops ou "Lavador" para lava-rápidos) — ao adicionar textos que mencionem profissionais/serviços na UI, prefira usar essas funções (`getLabelPorSegmento`, `getIconePorSegmento`) em vez de strings fixas. `frontend/src/hooks/useAtivosDoCliente.ts` busca os ativos do cliente atual.

## Convenções de nomenclatura

- **Domínio em Português:** modelos de banco, controllers, services, rotas de API e páginas do frontend usam nomes em português (`Agendamento`, `/profissionais`, `AssinaturaController`).
- **Infra/UI genérica em Inglês:** componentes reutilizáveis em `components/ui/`, configs de build e nomenclatura técnica geral.
- TypeScript em modo `strict` nos dois projetos; evite `any` (e `as any`) em código de regra de negócio novo — reserve para pontos onde a tipagem do Prisma/drivers externos realmente inviabiliza a tipagem direta.

## Estrutura do Frontend

- `src/pages/`: uma pasta por entidade de negócio (`Transacoes/`, `Clientes/`, `Agenda/`, `Assinaturas/`, `Custos/`, `Portal/...`), cada uma com seu `__tests__/`.
- `src/services/`: um wrapper Axios por recurso REST (`TransacaoService.ts`, `AssinaturaService.ts`, etc.), todos passando por `services/api.ts`, que injeta o token JWT no header `Authorization` via interceptor.
- `src/contexts/`: `AuthContext.tsx` (painel admin) e `PortalAuthContext.tsx` (portal do cliente) — são sessões e tokens **separados**.
- Sem gerenciador de estado global (Redux/Zustand); estado fica em `useState`/`useEffect` no nível do componente. Cálculos de negócio complexos vêm prontos do backend — o frontend só renderiza.
- Identidade visual: fundo escuro (`#121212`), destaque dourado (`#D4AF37`/`#C9A84C`), TailwindCSS v4, ícones via `lucide-react`. Tema dinâmico por empresa está **pausado** (`TemaController` é um stub que sempre devolve a paleta padrão) — não assuma que `useTheme.ts` lê configuração real por tenant.

## Erros e Autenticação no Frontend

- Erros de rede e respostas `401` devem limpar todo estado local relevante e redirecionar para o login (ver `PrivateRoute.tsx`/`PortalPrivateRoute.tsx` e os respectivos Contexts).
- Nunca faça contas de faturamento/crédito no frontend — se o dado não vier pronto da API, o correto é expor no backend (Service correspondente), não replicar a lógica na UI.

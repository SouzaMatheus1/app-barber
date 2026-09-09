# 📝 Release Notes - Técnico para Desenvolvedores (Changelog para Cliente Final)

Este documento descreve a implementação técnica do **Changelog segmentado por vertical**, feature desenvolvida na branch `feature/changelog-cliente`. Trata-se de um mural de novidades voltado aos donos de tenant (barbearia, pet shop, lava-rápido etc.), exibido dentro do painel administrativo — **não** é o changelog técnico de desenvolvedor (que continua sendo convenção de commit + arquivos como este, fora do sistema).

---

## 1. Modelagem no Banco de Dados (`schema.prisma`)

- **Model `ChangelogEntry`**: tabela global (não é `TENANT_MODELS`, não leva `empresaId`) com `titulo`, `descricao`, `publicadoEm` e `tipoEmpresaId` opcional. Quando `tipoEmpresaId` é `null`, a entrada é visível para **todos** os segmentos; quando preenchido, só aparece para tenants daquele `TipoEmpresa`.
- **Coluna `Empresa.changelogVisualizadoEm`**: rastreia por **tenant** (não por usuário individual) a última vez que o changelog foi visualizado — suficiente dado o padrão de login único diário já observado no produto.
- Migration `20260829205736_adiciona_changelog` gerada e aplicada (aditiva: uma tabela nova + uma coluna nullable, sem risco para dados existentes).

## 2. Segurança: Admin de Plataforma vs. Admin de Tenant (`middleware/auth.ts`)

Ponto crítico levantado antes da implementação: o `isAdmin` existente identifica o admin **de um tenant específico** (`perfil === 'ADMIN'`), não o dono do SaaS. Se reaproveitado para a criação de changelog, qualquer admin de barbearia poderia publicar mensagens para todos os outros tenants.

Como não existia nenhum mecanismo de admin de plataforma no projeto (confirmado via busca por `isPlatformAdmin`/`isSuperAdmin`/`SUPER_ADMIN`), foi criado um novo middleware:

- **`isPlatformAdmin`**: compara o `empresaId` do token com a variável de ambiente `PLATFORM_EMPRESA_ID`. Não exige query extra (o `empresaId` já vem no JWT) e é completamente independente do `isAdmin` de tenant.
- **Débito técnico assumido conscientemente**: essa comparação por `empresaId` fixo não distingue *qual* profissional está logado — qualquer `ADMIN` da empresa apontada por `PLATFORM_EMPRESA_ID` herda poder de plataforma. Por isso a recomendação operacional é usar uma **empresa dedicada exclusiva**, sem nenhuma equipe real de tenant vinculada (ver seção 6). Um mecanismo de papel de plataforma mais robusto (ex.: campo `isPlatformAdmin` no `Profissional`) fica marcado como melhoria futura caso surjam múltiplos operadores.

## 3. Back-End (`ChangelogService.ts`, `ChangelogController.ts`, `routes.ts`)

- **`criar(dados)`**: cria a entrada (`titulo`, `descricao`, `tipoEmpresaId?`). Protegida pela rota `POST /admin/changelog`.
- **`listarParaTenant()`**: resolve o `tipoEmpresaId` do tenant autenticado via `tenantStorage` + `Empresa`, e filtra `ChangelogEntry` por `tipoEmpresaId IS NULL OR tipoEmpresaId = <do tenant>`, ordenado por `publicadoEm DESC`.
- **`contarNaoLidas()`**: compara `Empresa.changelogVisualizadoEm` contra as entradas relevantes; se nunca visualizado (`null`), todas contam como não lidas.
- **`marcarComoVisualizado()`**: atualiza `Empresa.changelogVisualizadoEm` para `now()`.
- **Rotas**:
  ```
  POST /admin/changelog            isAuth + isPlatformAdmin
  GET  /changelog                  isAuth
  GET  /changelog/nao-lidas        isAuth
  POST /changelog/marcar-visualizado  isAuth
  ```

## 4. Front-End (`ChangelogSino.tsx`, `services/ChangelogService.ts`)

- **`ChangelogSino`**: componente de sino com badge, integrado tanto no header mobile (`Layout.tsx`) quanto no header do `Sidebar.tsx` (visível permanentemente no desktop). Busca `GET /changelog/nao-lidas` ao montar.
- Ao clicar, abre um painel reaproveitando o padrão visual do modal de gerenciamento de Ativos (`Clientes.tsx`: `fixed inset-0` + `bg-[var(--color-surface)]` + `rounded-xl`), lista `GET /changelog` e formata `publicadoEm` com `dayjs().locale('pt-br').fromNow()` (ex.: "há 2 dias") sem alterar o locale global do `dayjs` usado em outras telas.
- Ao abrir o painel, chama `POST /changelog/marcar-visualizado` e zera o contador local.
- Não há UI de criação no painel admin — a criação é uma ação de plataforma, feita fora do fluxo normal do tenant.

## 5. Testes

- **Backend** (`src/__tests__/changelog.test.ts`, 8 testes): segmentação por `tipoEmpresaId` (inclui e exclui corretamente por segmento), contagem de não lidas antes/depois de `marcarComoVisualizado`, e proteção de rota (`403` para tenant comum e para admin de tenant; `201` só para o token de plataforma).
- **Frontend** (`ChangelogSino.test.tsx`, 4 testes): badge exibido/ocultado conforme contagem, listagem + marcação como visualizado ao abrir, fechamento do painel. Testes de `Layout.test.tsx`/`Sidebar.test.tsx` ajustados para mockar `ChangelogService` e não depender mais de índice posicional de botão.
- `npm test` passa sem regressão em ambos os projetos (backend: 21 suítes/148 testes; frontend: 27 suítes/100 testes). `tsc --noEmit` (backend) e `tsc -b` (frontend) limpos.

## 6. Pendência de Configuração (ação manual, fora do código)

A rota `POST /admin/changelog` fica **inacessível para todo mundo** até `PLATFORM_EMPRESA_ID` ser configurado. Passos para habilitar:

1. Criar uma `Empresa` dedicada (sem clientes/transações reais — só existe para dar um login isolado de plataforma).
2. Criar um `Profissional` vinculado a ela, com `perfil = ADMIN`.
3. Definir `PLATFORM_EMPRESA_ID="<id da empresa dedicada>"` em `backend/.env`.
4. Logar com esse profissional para obter um token válido para `POST /admin/changelog`.

Recomendado usar uma empresa exclusiva (não uma das barbearias/lava-rápidos reais) para evitar que qualquer `ADMIN` de um tenant real herde acidentalmente poder de plataforma (ver seção 2).

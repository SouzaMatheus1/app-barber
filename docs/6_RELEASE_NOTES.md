# 📝 Release Notes & Atualizações V1 (First update)

Este documento centraliza todas as refatorações estruturais, adições e correções de _bugs_ implementadas nesta versão focado no controle de Transações, Caixa Diário e Tratamento de Erros da aplicação.

---

## 1. Banco de Dados e Modelagem (Prisma)
- **Tabela `MetodoPagamento` adicionada:** A forma como as transações rastreiam dinheiros mudou. Foi adicionada uma entidade própria no Prisma para PIX, Dinheiro, Débito e Crédito em vez de apenas hardcoding, atrelando de forma relacional os caixas registrados à forma escolhida (`formaPagamentoId`).
- **Nova Coluna de Estoque:** `quantidade` acoplado ao `ItemCatalogo` para futuro rastreio no back-end.
- **Seeding Automático Aperfeiçoado:** O arquivo original `backend/prisma/seed.ts` agora garante formalmente os `IDs` específicos das formas de pagamento (1 para PIX, 2 para C. Crédito, etc.) para que nenhuma base de dados recém implementada falhe ao receber chamadas da UI.

## 2. Front-End (Dashboard e Páginas)
- **Correção Geral no Bug do Fuso Horário (UTC/GMT):** 
  - Solucionado o _glitch_ crítico no fluxo do `Dashboard.tsx` que transportava todas as transações realizadas à noite para o referencial de "amanhã" nas chaves de consultas da API. Agora todos os referencais pegam explicitamente de `getFullYear` e baseiam a requisição ao escopo local (América/São_Paulo).
- **Roteamento Inteligente do Botão "Ver todas":**
  - Adicionado suporte por injeção de estado `location.state` ao React Router para saltar da home da aplicação direto para o modo aba _Histórico_ ao acessar a página geral de `Transacoes.tsx`, reservando a adição de `Nova Transação` só para quem vier do menu lateral.

## 3. Back-End e Infraestrutura
- **Criação da Camada Root de Erros (`AppError`):** 
  - Implementação do novo padrão e _Middleware Global_ (`errorHandler.ts` anexado no `server.ts`) para interrupções seguras ao invés de derrubar o Node por erros sem tratamento. 
  - Substituto para instâncias brutas de `throw new Error()` que permitiam vazamento de _stack trace_ inseguro nas requests HTTP de produção.
- **Acoplamento do `.gitignore` Reestruturado:**
  - Foi removida a exceção problemática de `docs/*.md` que estava invisibilizando esta brilhante docstack de versionamento global para seus companheiros de time/comunidade de devs. Arquivo `seed.ts` foi confirmado ser corretamente verificado pelo Git e preservado de sumir do pipeline de novos repositórios locais.

---
**⚠️ Notas de Débito Técnico (Testes Automatizados)**
Devido às grandes mudanças nas funções do Prisma envolvendo os perfis de profissionais e os métodos, alguns dos testes isolados unitários em Jest (na pasta `src/__tests__`) relatam falha no processo nativo para _mocks_. Se desejar implementar rotina contínua de CD/CI, um próximo ciclo de desenvolvimento deve ser alocado com a prioridade voltada unicamente para re-escrever e atualizar o mocking dos testes `auth.test.ts`. 

# Documentação de Testes Automatizados

Este projeto possui uma robusta suíte de testes automatizados para garantir a estabilidade das aplicações Backend e Frontend, abrangendo praticamente todos os domínios do sistema.

## Backend (Node.js + Express)

A infraestrutura de testes da API valida as regras de negócios e os endpoints através de testes unitários e de integração, garantindo o correto funcionamento sem a necessidade de um banco de dados real rodando.

- **Tecnologias:** Jest, ts-jest, Supertest.
- **Abordagem:** As chamadas ao banco de dados (Prisma) e serviços externos são simuladas (mockadas).
- **Cobertura Principal:** 
  - **Autenticação (`auth`)**: Regras da rota `/login`, emissão de JWT, e bloqueio de acessos com credenciais inválidas (Status 401).
  - **Caixa (`caixa`)**: Abertura, fechamento e validações transacionais do fluxo de caixa.
  - **Clientes (`cliente`)**: Criação, listagem e gestão do perfil de clientes.
  - **Comissões (`comissao`)**: Lógica de cálculo e distribuição de comissões para profissionais.
  - **Catálogo (`itemCatalogo`)**: Gestão de serviços, produtos e controle de estoque/preço.
  - **Profissionais (`profissional`)**: Cadastro, atualização e listagem da equipe do salão.
  - **Transações (`transacao`)**: Registro de novas transações, relacionamentos entre profissional/cliente e validação de catálogo.

### Como executar os testes

```bash
cd backend

# Executar todos os testes
npm test

# Executar testes em modo observação (watch)
npx jest --watch
```

---

## Frontend (React + Vite)

Para a interface, utilizamos uma abordagem moderna e veloz, totalmente integrada ao ecossistema do Vite, testando o comportamento visual, a renderização dos componentes e as interações do usuário.

- **Tecnologias:** Vitest, React Testing Library, jsdom.
- **Abordagem:** Simulação de interações e renderização do DOM (Document Object Model), com serviços da API mockados.
- **Cobertura Principal:**
  - **Login (`Login`)**: Renderização correta da tela (inputs/botões presentes), interações com formulários e redirecionamento da rota baseada no processo de autenticação.
  - **Rotas Protegidas (`PrivateRoute`)**: Verificação do sistema de bloqueio e liberação de conteúdo da aplicação com base na presença de token JWT.
  - **Dashboard (`Dashboard`)**: Validação da exibição correta das métricas diárias, tickets médios e as últimas transações registradas.
  - **Catálogo (`Catalogo`)**: Renderização da listagem de itens ativos/inativos e formulário de edição e criação de itens do catálogo.
  - **Clientes (`Clientes`)**: Gestão e visualização de dados e métricas dos clientes.
  - **Comissões (`Comissoes`)**: Visualização correta dos relatórios de pagamentos dos profissionais baseados nas transações atreladas e status quitados.
  - **Profissionais (`Profissionais`)**: Controle e renderização da exibição do perfil dos barbeiros / profissionais da barbearia.
  - **Transações (`Transacoes`)**: Testes da tabela de histórico de movimentação do caixa e registros de cortes.

### Como executar os testes

```bash
cd frontend

# Executar de forma única no terminal (modo headless)
npm test

# Executar com interface gráfica e interativa no navegador (UI)
npm run test:ui
```

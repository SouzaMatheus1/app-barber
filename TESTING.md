# Documentação de Testes Automatizados

Este projeto possui uma suíte de testes automatizados para garantir a estabilidade das aplicações Backend e Frontend.

## Backend (Node.js + Express)

A infraestrutura de testes da API valida as regras de negócios e os endpoints sem a necessidade de um banco de dados real rodando.

- **Tecnologias:** Jest, ts-jest, Supertest.
- **Abordagem:** As chamadas ao banco de dados (Prisma) são simuladas (mockadas).
- **Cobertura Principal:** 
  - Regras de autenticação e rota `/login`.
  - Recebimento de Token JWT em conexões de sucesso (Status 200).
  - Bloqueio de acessos com credenciais inválidas ou incompletas (Status 401).

### Como executar os testes

```bash
cd backend
npm test
```

---

## Frontend (React + Vite)

Para a interface, utilizamos uma abordagem moderna e veloz, totalmente integrada ao ecossistema do Vite, testando o comportamento visual e as interações do usuário.

- **Tecnologias:** Vitest, React Testing Library, jsdom.
- **Abordagem:** Simulação de interações e renderização do DOM (Document Object Model).
- **Cobertura Principal:**
  - Renderização correta da tela de Login (inputs e botões presentes).
  - Interação com os formulários (digitação e clique de submissão).
  - Verificação de sucesso (redirecionamento da rota) e falhas do serviço de autenticação.

### Como executar os testes

```bash
cd frontend

# Executar no terminal
npm test

# Executar com interface gráfica no navegador (UI)
npm run test:ui
```

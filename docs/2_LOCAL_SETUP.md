# Configuração do Ambiente Local (Local Setup)

Este guia orienta engenheiros na configuração, instalação e execução independente dos microsserviços (Frontend e Backend) no ambiente de desenvolvimento local.

## Pré-requisitos
- Node.js (v18 ou superior).
- Um servidor MySQL / MariaDB (podendo ser hospedado via Docker, XAMPP ou nativo).
- Gerenciador de pacotes npm.

---

## 1. Configurando o Backend

1. **Dependências:** Acesse o diretório `/backend` e baixe os pacotes:
   ```bash
   cd backend
   npm install
   ```

2. **Variáveis de Ambiente:** Clone o `.env.example` e renomeie para `.env`.
   ```env
   # Porta em que a API vai expor os serviços
   PORT=8080
   
   # Assinatura (salt) usada na criptografia do Token de Autenticação
   JWT_SECRET="SEGREDO_ALTAMENTE_CONFIDENCIAL_AQUI"
   
   # Configurações brutas do Banco
   DATABASE_HOST="localhost"
   DATABASE_USER="admin"
   DATABASE_PASSWORD="admin_password"
   DATABASE_NAME="defaultdb"
   DATABASE_PORT=3306
   
   # A URL final de conexão parseada pelo Prisma
   DATABASE_URL="mysql://admin:admin_password@localhost:3306/defaultdb"
   ```

3. **Subindo o Prisma / Banco:**
   Rode os comandos de criação de schema e gere os tipados Typescript do Prisma.
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Rodando a Aplicação:**
   ```bash
   npm run dev
   ```

---

## 2. Configurando o Frontend

1. **Dependências:** Acesse o diretório `/frontend` e instale os pacotes:
   ```bash
   cd frontend
   npm install
   ```

2. **Variáveis de Ambiente:** Crie o arquivo `.env` seguindo a estrutura proposta do repositório:
   ```env
   # Local Server Port
   PORT=5173
   
   # URI base do Express Servindo a aplicação
   VITE_API_URL=http://localhost:8080
   ```

3. **Rodando a Aplicação:**
   ```bash
   npm run dev
   ```
   > [!TIP]
   > Certifique-se de que o backend está funcionando acessando a rota de Ping: `http://localhost:8080/ping`.

---

## 3. Execução Unificada a Partir da Raiz

Caso prefira não abrir múltiplos terminais navegando para `backend/` e `frontend/`, o projeto possui atalhos configurados no `package.json` da raiz. Você pode executar ambos os ambientes abrindo dois terminais diretamente na raiz da aplicação:

**Para rodar o Backend:**
```bash
npm run dev:back
```

**Para rodar o Frontend:**
```bash
npm run dev:front
```

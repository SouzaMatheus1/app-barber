# Documentation Plan: Barbershop SaaS System

## Roadmap

This roadmap outlines the systematic approach to documenting the Barbershop SaaS System. The objective is to provide developers with a clear understanding of the architecture, setup process, and business logic.

### Step 1: System Overview (High-level architecture)
- **Objective:** Describe the high-level architecture of the system.
- **Sections to Write:**
  - Tech Stack presentation (React, Node.js + Express, Prisma, MySQL).
  - Client-Server interaction model.
  - Deployment and Infrastructure Overview (if applicable).
  - Mermaid Diagram: High-level architectural data flow.
    ```mermaid
    graph TD
    Client[Frontend PWA/Web] -->|HTTP REST| API[Backend Node.js/Express]
    API -->|Prisma Client| Database[(MySQL DB)]
    ```

### Step 2: Local Setup & Environment Variables
- **Objective:** Guide new developers on how to run both frontend and backend locally.
- **Sections to Write:**
  - Prerequisites (Node.js version, MySQL usage/Docker).
  - `.env` template definitions for Backend (`DATABASE_URL`, `JWT_SECRET`, etc.) and Frontend (`VITE_API_URL`).
  - Scripts execution (e.g., `npm run dev`, `prisma db push`, `prisma generate`).
  - Guidelines on setting up a local admin account.

### Step 3: Database ERD and Schema explanation
- **Objective:** Provide a deep dive into the Relational Model.
- **Sections to Write:**
  - Core Entity definitions (`Profissional`, `Cliente`, `Transacao`, `Assinatura`, `ItemCatalogo`).
  - Subscription & Credits Logic: Explain the relationship between `Plano`, `Assinatura`, and `CreditoAssinatura`, and how transactions consume these credits.
  - Mermaid Diagram: Entity-Relationship Diagram (ERD).
    ```mermaid
    erDiagram
      CLIENTE ||--o{ ASSINATURA : tem
      CLIENTE ||--o{ TRANSACAO : realiza
      ASSINATURA ||--|{ CREDITO_ASSINATURA : possui
      TRANSACAO ||--|{ ITEM_TRANSACAO : contem
      ITEM_CATALOGO ||--o{ ITEM_TRANSACAO : referenciado
      PROFISSIONAL ||--o{ TRANSACAO : atende
    ```

### Step 4: API Reference (Endpoints, Payloads, and Responses)
- **Objective:** Document the RESTful API routes, required payloads, and responses.
- **Sections to Write:**
  - Authentication Endpoints (`/login`).
  - Professional & Client Management (`/profissionais`, `/clientes`).
  - Transactions processing (`POST /transacoes` - Detailed walkthrough of the payload containing `itens`, `usouCreditoAssinatura`).
  - Subscriptions (`/planos`, `/assinaturas`).
  - Error Response Standards (format of `400 Bad Request` or `500 Server Error` responses used in the controllers).

### Step 5: Frontend Component Library and Layout patterns
- **Objective:** Describe the React/Vite implementation and styling strategy.
- **Sections to Write:**
  - Directory Structure (`pages`, `services`, `components`).
  - Routing strategy (`react-router-dom`).
  - State Management: Explain how the app relies heavily on component-level state (`useState`, `useEffect`) and service classes for API calls.
  - UI Standards: TailwindCSS usage and Lucide-react for icon aesthetics.

## Identified Architectural Patterns
- **Backend:** 
  - **Controller-Service Architecture:** Clear separation where routers pass requests to controllers, and controllers delegate business logic/database operations to Services.
  - **Data Access Layer:** Uses Prisma as the ORM, abstracting MySQL interactions.
- **Frontend:**
  - **Service/API Gateway Pattern:** Uses object wrappers (e.g., `TransacaoService`, `ClienteService`) around Axios instances to standardize data fetching.
  - **Fat Components:** Specific pages (like `Transacoes.tsx`) act as thick containers that handle state, business logic (e.g., proportionate credit cost calculation), and UI rendering.

## Missing Comments & "Dark Spots" Requiring Immediate Clarification
1. **Frontend `Transacoes.tsx` Complexity:** 
   - The method of distributing partial/proportional values for items consumed through subscriptions (`getValorProporcional`) lacks inline documentation. It recalculates financial logic on the client-side which must be perfectly synced with the backend.
   - Hardcoded utility functions like `resolveItemTipo` containing regex/substring checks (`cabelo`, `degrad`) inside the UI layer.
2. **Backend Transaction Ledger Logic:**
   - In `TransacaoService.ts`, the logic for deducting `CreditoAssinatura` across `prisma.$transaction` lacks comprehensive comments outlining the "Why" (e.g., why proportional values are used for ledger tracking vs full price).
3. **Error Handling Mechanism:**
   - Error messages are thrown as generic `Error` instances in services and caught as `400 Bad Request` in controllers. A standardized Custom Error Class (with specific HTTP status codes attached) is missing.
4. **Environment Constraints:**
   - No `.env.example` found. The exact system dependencies (like JWT expiry timers or specific port usages) are undocumented.

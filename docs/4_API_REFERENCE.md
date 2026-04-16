# Referência da API (API Reference)

Este guia cobre as principais portas lógicas RESTful expostas pelo framework Express, detalhando payloads obrigatórios, segurança e métodos de erro instalados.

## Segurança e Padrões Globais

Todas as chamadas (exceto `/login` e rotas base de `/ping`) exigem Cabeçalho HTTP `Authorization` contendo um JSON Web Token do tipo Bearer:
`Authorization: Bearer <seu_token_aqui>`

### Tratamento Global de Exceções

Implementamos um Middleware catch-all (`errorHandler.ts`) desenhado para trabalhar com a infraestrutura Express v5 nativa. Quando falhas assíncronas acontecem em qualquer Controller, eles são canalizados por esse Gateway. 

**Exemplo Prático de Erro Restrito (`400 Bad Request`):**
A API invoca internamente a class Custom: `throw new AppError("O cliente não possui créditos válidos", 400);` 
O Express entrega ao consumidor exatamente isso:
```json
{
  "status": "error",
  "message": "O cliente não possui créditos válidos"
}
```

---

## Principais Endpoints Mapeados

### 1. Autenticação e Profissionais
*   `POST /login`
    **Payload**: `{ "email": "dev", "senha": "123" }`
    **Response**: Devolve o Bearer JWT e *userData* associada.

*   `GET /profissionais` | `POST /profissionais` 
    *   Gestores do salão. Necessário header de autenticação.

### 2. Transações e Faturamento
*   `GET /transacoes`
    Retorna todo o registro das movimentações, com mapeamento completo das junções em banco (`tipo`, `profissional`, `cliente`, array populado em `itens`).

*   `POST /transacoes`
    Registra um serviço na barbearia. É nela que os cálculos ACID ocorrem.
    **Exemplo Payload Requisitado:**
    ```json
    {
      "tipoTransacaoId": 1,
      "descricao": "Atendimento: João Silva",
      "profissionalId": 2,
      "clienteId": 9,
      "formaPagamentoId": 1,
      "itens": [
        { "itemId": 1, "quantidade": 1, "usouCreditoAssinatura": true }
      ]
    }
    ```
    > [!WARNING]
    > Ao sinalizar `"usouCreditoAssinatura": true`, a API efetuará uma análise matemática deduzindo *uma cota* do cliente em sua assinatura ativa. Se não houver contrato ativo ou saldo, um `AppError` limpo com status `400` cancela automaticamente todo o lote antes de impactar os caixas.

### 3. Clientes e Protocolo de Assinaturas
*   `GET /assinaturas/cliente/:clienteId/ativa`
    Devolve a assinatura do cliente vigente sem filtros brutos.
    **Resposta Injetada Modificada:**
    Este endpoint computa on-the-fly (`AssinaturaService.ts`) um key valioso extra chamado `valorProporcional`. Assim evita distorções matemáticas no Frontend.
    ```json
    {
       "id": 16,
       "planoId": 2,
       "status": "ATIVA",
       "valorProporcional": 25.50,
       "plano": { ... },
       "creditos": [ ... ]
    }
    ```

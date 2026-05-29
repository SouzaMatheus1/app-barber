# 📅 Release Notes - Técnico para Desenvolvedores (Agendamentos V2)

Esta documentação descreve as implementações técnicas do **Módulo de Agendamentos V2** na branch `feature/agendamentos-v2`, incluindo o motor de agendamentos com isolamento de transação, geração de disponibilidade, integração com o Clube de Assinaturas e o fluxo de autenticação do portal do cliente.

---

## 1. Modelagem no Banco de Dados (`schema.prisma`)

- **Model `Agendamento`**: Armazena as sessões reservadas, contendo `dataHoraInicio`, `dataHoraFim`, `clienteId`, `profissionalId`, `observacao`, `status` (`CONFIRMADO`, `EM_ANDAMENTO`, `CONCLUIDO`, `CANCELADO`, `INDISPONIVEL`) e o vínculo multi-tenant `empresaId`.
- **Relacionamento N:N**: Mapeado de forma implícita entre `Agendamento` e `ItemCatalogo` (serviços agendados).

---

## 2. Motor de Agendamentos & Concorrência (`AgendamentoService.ts`)

### Prevenção de Conflito de Horário (Overbooking / Double Booking)
Para garantir que dois clientes não reservem o mesmo profissional no mesmo período sob condições de alta concorrência:
- A operação de criação é envelopada em uma transação de banco de dados (`prisma.$transaction`).
- O nível de isolamento é definido como `RepeatableRead` para travar leituras e escritas concorrentes.
- Verifica-se a existência de conflitos na faixa de tempo:
  ```typescript
  const overbooking = await tx.agendamento.findFirst({
      where: {
          profissionalId,
          status: { in: ['CONFIRMADO', 'EM_ANDAMENTO', 'INDISPONIVEL'] },
          AND: [
              { dataHoraInicio: { lt: datetimeFim } },
              { dataHoraFim: { gt: datetimeInicio } }
          ]
      }
  });
  ```

### Integração com Clube de Assinaturas & Créditos
- **Consumo de Créditos**: Se a opção `usarCreditos` for enviada, o motor localiza a assinatura ativa do cliente, valida se há saldo suficiente para cada serviço agendado na tabela `CreditoAssinatura` e realiza o decremento do saldo.
- **Estorno Automático**: Caso um agendamento seja marcado como `CANCELADO`, o sistema verifica se ele foi criado utilizando créditos da assinatura (marcado na observação). Se sim, ele realiza o estorno incrementando o saldo do serviço de volta à assinatura ativa do cliente de forma transacional.

### Geração Dinâmica de Slots de Disponibilidade (`getDisponibilidade`)
- Mapeia o dia selecionado (faixa padrão de atendimento das 08h00 às 20h00) em blocos de 15 minutos.
- Subtrai a duração total necessária para os serviços selecionados.
- Elimina os slots que colidem com agendamentos existentes ativos (`CONFIRMADO`, `EM_ANDAMENTO`, `INDISPONIVEL`) do profissional específico e desconsidera horários retroativos.
- Restrição de antecedência mínima de 30 minutos em agendamentos feitos através do portal do cliente.

---

## 3. Fluxo de Autenticação e Rotas do Portal (PWA)

- **`PortalAuthController.ts`**: Adicionados endpoints de login e cadastro dedicados a clientes finais. O JWT gerado inclui `{ id, empresaId, isPortal: true }`.
- **`PortalPrivateRoute.tsx`**: Middleware de rota privada no frontend que direciona clientes sem token ativo no `localStorage` de volta para a rota `/portal/:slug/login`.
- **Axios Request Interceptor**: Identifica o contexto da rota (/portal) e anexa de forma transparente o token correto (`portal_token` ou `token`).
- **Axios Response Interceptor**: Monitora respostas com status `401` e limpa as credenciais locais corretas, redirecionando o cliente para a tela de autenticação adequada ao seu subdomínio.

---

## 4. Interface do Portal de Agendamento (`PortalAgendar.tsx`)

Implementamos um fluxo guiado passo a passo para o agendamento de serviços:
1. **Seleção de Profissional**.
2. **Seleção de Serviços** (calculando o tempo e valor acumulado em tempo real).
3. **Seleção de Data e Hora** com listagem dinâmica de slots vagos.
4. **Forma de Cobrança**: Permite que o cliente opte por agendar usando o saldo de créditos da assinatura ativa ou pagar presencialmente/avulso.

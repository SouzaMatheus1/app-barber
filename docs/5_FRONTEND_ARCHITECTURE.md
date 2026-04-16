# Arquitetura do Frontend (React & Vite)

Este documento centraliza as estratégias de consumo visual da interface pelo usuário. O módulo isola todas as responsabilidades estritas à UI/UX.

## Estrutura de Diretórios Básica

*   `src/pages/`: Ponto de entrada das visões primárias, organizadas por entidades de negócio (ex: `/Transacoes`, `/Clientes`). Possuem forte acoplamento com lógicas dinâmicas de renderização condicional.
*   `src/services/`: Camada API-Gateway no Front. Agrupa wrappers para cada serviço REST que faz pontes assíncronas (Axios) para o Backend. Ex: `TransacaoService.ts`, `AssinaturaService.ts`.
*   `src/components/`: Armazena toda as micro-peças estagnadas recicláveis por reatividade de props.

## Gerenciamento de Estado & Comunicações

* A aplicação não faz uso de gerenciadores globais complexos como Redux ou Zustand.
* O roteamento obedece fluxos isolados no `react-router-dom`.
* O Estado é preservado majoritariamente em **Component-Level Methods**, utilizando farta estruturação do hook `useState` acoplado a reatividades do `useEffect`.

> [!TIP]
> **Boas Práticas Implementadas:** Dados computacionais complexos são entregues mastigados pelo Backend (como a propriedade recém criada `valorProporcional`). O Front deve engolir isso e repassar puramente à montagem da interface, ao invés de calcular contabilidade on-the-fly local.

## Padrões de Interface Humana e Identidade Visual

Toda reestilização gráfica da barbearia se apoia fortemente no **TailwindCSS 4**. 

1. **Aesthetics (Visual Excellence):**
   Cores bases respeitam um palete premium: Contrastes fortes (`#121212` backgrounds), dourados pontuais acendidos (`#D4AF37`) sugerindo luxo clássico alinhado ao nicho, e superfícies que respiram modernidade com design responsivo (`flex`, `grid`, `col-span`).
2. **Icons:**
   Utilitários vetoriais do pacote `lucide-react` para peso levíssimo.
3. **Animações (Micro-animations):**
   Utiliza transitions padrão em Tailwind para *renders* passivos, focando em UX satisfatório ao preencher modais e pop-ups sem pesagem extra ao DOM.

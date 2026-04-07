# Documentação de Refatoração: Arquitetura Multi-tenant SaaS

Este documento detalha as alterações feitas para converter a aplicação em uma plataforma SaaS multi-tenant, garantindo isolamento de dados e suporte a múltiplos estabelecimentos (Barbearias).

## 1. Alterações no Banco de Dados (Prisma)

### Novos Modelos e Enums
- **Barbearia**: Criada tabela central com `id`, `nome`, `cnpj`, `descricao`, `status` e `criadoEm`.
- **Enums Nativos**: Removidas tabelas de lookup e substituídas por Enums nativos do banco de dados:
  - `Perfil`: `SUPER_ADMIN` (Gestor do sistema), `TENANT_ADMIN` (Gestor da Barbearia), `BARBEIRO` (Usuário operacional).
  - `TipoItem`: `SERVICO`, `PRODUTO`.
  - `TipoTransacao`: `ENTRADA`, `SAIDA`.

### Campos Obligatórios de Isolamento
Adicionado o campo `barbeariaId: Int` (FK para `Barbearia`) em todos os modelos principais:
- `Profissional`
- `Cliente`
- `ItemCatalogo`
- `Transacao`
- `Plano`
- `Assinatura`

## 2. Autenticação e Autorização

### JWT Payload
O token gerado no login agora contém:
- `id`: ID do usuário.
- `perfil`: Perfil (Enum).
- `barbeariaId`: ID da barbearia à qual o usuário pertence.

### Middlewares
- **isAuth**: Extrai o `barbeariaId` e injeta em `res.locals.user`.
- **isTenantAdmin**: Garante que a rota só seja acessada por administradores daquela barbearia (ou super admins).
- **isSuperAdmin**: Restringe o acesso apenas a gestores do ecossistema.

## 3. Refatoração de Serviços e Controllers

Todos os serviços foram atualizados para receber o `barbeariaId` e aplicá-lo em todas as cláusulas `where` das queries Prisma.

### Exemplos de Isolação:
- **Leitura**: `prisma.cliente.findMany({ where: { barbeariaId } })` - Garante que o usuário nunca veja clientes de outra barbearia.
- **Escrita**: `prisma.cliente.create({ data: { ..., barbeariaId } })` - Vincula novos registros automaticamente.
- **Edição/Exclusão**: Antes de qualquer alteração, é feita uma verificação `findFirst({ where: { id, barbeariaId } })` para impedir que um usuário edite registros de terceiros manipulando IDs na URL.

## 4. Gestão de Tenants (Super Admin)
Implementado o `TenancyController` e `TenancyService` para gerir o ecossistema:
- `POST /tenants`: Permite ao Super Admin criar uma nova Barbearia e seu primeiro usuário Administrador em um único fluxo transacional.

## 5. Migração de Dados (Legado)
Foi executado um script de migração (`backend/prisma/migration-script.ts`) que realizou:
1. Criação da barbearia inicial ("Barbearia Matriz").
2. Conversão de IDs de tabelas antigas para os novos campos Enum.
3. Vínculo de todos os registros (Profissionais, Clientes, Transações, etc.) à Barbearia 1.
4. Limpeza do banco de dados (exclusão de colunas e tabelas legadas).

---
**Nota de Segurança**: O isolamento foi implementado de forma "estrita", o que significa que mesmo erros lógicos no frontend não resultarão em vazamento de dados entre empresas, pois o backend valida a permissão através do `barbeariaId` assinado no JWT.

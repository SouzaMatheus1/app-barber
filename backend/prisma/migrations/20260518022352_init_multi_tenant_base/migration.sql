-- DropForeignKey
ALTER TABLE `Transacao` DROP FOREIGN KEY `Transacao_profissionalId_fkey`;

-- AlterTable
ALTER TABLE `Assinatura` ADD COLUMN `dataProximoVencimento` DATETIME(3) NULL,
    ADD COLUMN `dataUltimoPagamento` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Plano` ADD COLUMN `frequencia` ENUM('SEMANAL', 'QUINZENAL', 'MENSAL') NOT NULL DEFAULT 'MENSAL';

-- AlterTable
ALTER TABLE `Transacao` ADD COLUMN `categoriaCustoId` INTEGER NULL,
    MODIFY `profissionalId` INTEGER NULL;

-- CreateTable
CREATE TABLE `TipoEmpresa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `TipoEmpresa_descricao_key`(`descricao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Empresa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nomeFantasia` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `tipoEmpresaId` INTEGER NOT NULL DEFAULT 1,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Empresa_slug_key`(`slug`),
    INDEX `Empresa_tipoEmpresaId_idx`(`tipoEmpresaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CategoriaCusto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FechamentoCaixa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `data` DATE NOT NULL,
    `saldoInicial` DECIMAL(10, 2) NOT NULL,
    `receitas` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `despesas` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `saldoFinal` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Transacao_categoriaCustoId_idx` ON `Transacao`(`categoriaCustoId`);

-- AddForeignKey
ALTER TABLE `Empresa` ADD CONSTRAINT `Empresa_tipoEmpresaId_fkey` FOREIGN KEY (`tipoEmpresaId`) REFERENCES `TipoEmpresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transacao` ADD CONSTRAINT `Transacao_profissionalId_fkey` FOREIGN KEY (`profissionalId`) REFERENCES `Profissional`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transacao` ADD CONSTRAINT `Transacao_categoriaCustoId_fkey` FOREIGN KEY (`categoriaCustoId`) REFERENCES `CategoriaCusto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Assinatura` RENAME INDEX `Assinatura_clienteId_fkey` TO `Assinatura_clienteId_idx`;

-- RenameIndex
ALTER TABLE `Assinatura` RENAME INDEX `Assinatura_planoId_fkey` TO `Assinatura_planoId_idx`;

-- RenameIndex
ALTER TABLE `CreditoAssinatura` RENAME INDEX `CreditoAssinatura_assinaturaId_fkey` TO `CreditoAssinatura_assinaturaId_idx`;

-- RenameIndex
ALTER TABLE `CreditoAssinatura` RENAME INDEX `CreditoAssinatura_itemId_fkey` TO `CreditoAssinatura_itemId_idx`;

-- RenameIndex
ALTER TABLE `ItemCatalogo` RENAME INDEX `ItemCatalogo_tipoItemId_fkey` TO `ItemCatalogo_tipoItemId_idx`;

-- RenameIndex
ALTER TABLE `ItemPlano` RENAME INDEX `ItemPlano_itemId_fkey` TO `ItemPlano_itemId_idx`;

-- RenameIndex
ALTER TABLE `ItemPlano` RENAME INDEX `ItemPlano_planoId_fkey` TO `ItemPlano_planoId_idx`;

-- RenameIndex
ALTER TABLE `ItemTransacao` RENAME INDEX `ItemTransacao_itemId_fkey` TO `ItemTransacao_itemId_idx`;

-- RenameIndex
ALTER TABLE `ItemTransacao` RENAME INDEX `ItemTransacao_transacaoId_fkey` TO `ItemTransacao_transacaoId_idx`;

-- RenameIndex
ALTER TABLE `Profissional` RENAME INDEX `Profissional_perfilId_fkey` TO `Profissional_perfilId_idx`;

-- RenameIndex
ALTER TABLE `Transacao` RENAME INDEX `Transacao_clienteId_fkey` TO `Transacao_clienteId_idx`;

-- RenameIndex
ALTER TABLE `Transacao` RENAME INDEX `Transacao_formaPagamentoId_fkey` TO `Transacao_formaPagamentoId_idx`;

-- RenameIndex
ALTER TABLE `Transacao` RENAME INDEX `Transacao_profissionalId_fkey` TO `Transacao_profissionalId_idx`;

-- RenameIndex
ALTER TABLE `Transacao` RENAME INDEX `Transacao_tipoTransacaoId_fkey` TO `Transacao_tipoTransacaoId_idx`;

-- [SEED MANUAL] Popula o Tenant Master 
INSERT IGNORE INTO TipoEmpresa (id, descricao) VALUES (1, 'Barbearia');
INSERT IGNORE INTO Empresa (id, nomeFantasia, slug, tipoEmpresaId, criadoEm) 
VALUES (1, 'Barbearia Matriz', 'barbearia-matriz', 1, NOW());

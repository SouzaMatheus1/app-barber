-- AlterTable
ALTER TABLE `itemcatalogo` ADD COLUMN `quantidade` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `transacao` ADD COLUMN `formaPagamentoId` INTEGER NULL;

-- CreateTable
CREATE TABLE `MetodoPagamento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `MetodoPagamento_descricao_key`(`descricao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Transacao_formaPagamentoId_fkey` ON `Transacao`(`formaPagamentoId`);

-- AddForeignKey
ALTER TABLE `Transacao` ADD CONSTRAINT `Transacao_formaPagamentoId_fkey` FOREIGN KEY (`formaPagamentoId`) REFERENCES `MetodoPagamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

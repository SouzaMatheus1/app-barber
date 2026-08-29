-- AlterTable
ALTER TABLE `Transacao` ADD COLUMN `desconto` DECIMAL(10, 2) NULL,
    ADD COLUMN `descricaoExtra` VARCHAR(191) NULL,
    ADD COLUMN `tipoDesconto` ENUM('PERCENTUAL', 'FIXO') NULL,
    ADD COLUMN `valorExtra` DECIMAL(10, 2) NULL;

-- CreateTable
CREATE TABLE `CustoRecorrente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empresaId` INTEGER NOT NULL DEFAULT 1,
    `descricao` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `diaVencimento` INTEGER NOT NULL,
    `categoriaCustoId` INTEGER NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `dataUltimoPagamento` DATETIME(3) NULL,
    `dataProximoVencimento` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CustoRecorrente_empresaId_idx`(`empresaId`),
    INDEX `CustoRecorrente_categoriaCustoId_idx`(`categoriaCustoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CustoRecorrente` ADD CONSTRAINT `CustoRecorrente_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustoRecorrente` ADD CONSTRAINT `CustoRecorrente_categoriaCustoId_fkey` FOREIGN KEY (`categoriaCustoId`) REFERENCES `CategoriaCusto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

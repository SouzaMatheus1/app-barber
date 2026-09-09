-- AlterTable
ALTER TABLE `Empresa` ADD COLUMN `changelogVisualizadoEm` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `ChangelogEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `publicadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipoEmpresaId` INTEGER NULL,

    INDEX `ChangelogEntry_publicadoEm_idx`(`publicadoEm`),
    INDEX `ChangelogEntry_tipoEmpresaId_idx`(`tipoEmpresaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChangelogEntry` ADD CONSTRAINT `ChangelogEntry_tipoEmpresaId_fkey` FOREIGN KEY (`tipoEmpresaId`) REFERENCES `TipoEmpresa`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

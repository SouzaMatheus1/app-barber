-- CreateTable
CREATE TABLE `TemaPadrao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipoEmpresaId` INTEGER NOT NULL,
    `corPrimaria` VARCHAR(191) NOT NULL,
    `corSecundaria` VARCHAR(191) NOT NULL,
    `corFundo` VARCHAR(191) NOT NULL,
    `corSuperficie` VARCHAR(191) NOT NULL,
    `corTexto` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `faviconUrl` VARCHAR(191) NULL,

    UNIQUE INDEX `TemaPadrao_tipoEmpresaId_key`(`tipoEmpresaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TemaEmpresa` (
    `empresaId` INTEGER NOT NULL,
    `corPrimaria` VARCHAR(191) NULL,
    `corSecundaria` VARCHAR(191) NULL,
    `corFundo` VARCHAR(191) NULL,
    `corSuperficie` VARCHAR(191) NULL,
    `corTexto` VARCHAR(191) NULL,
    `logoUrl` VARCHAR(191) NULL,
    `faviconUrl` VARCHAR(191) NULL,

    PRIMARY KEY (`empresaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TemaPadrao` ADD CONSTRAINT `TemaPadrao_tipoEmpresaId_fkey` FOREIGN KEY (`tipoEmpresaId`) REFERENCES `TipoEmpresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TemaEmpresa` ADD CONSTRAINT `TemaEmpresa_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

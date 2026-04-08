-- AlterTable
ALTER TABLE `ItemTransacao` ADD COLUMN `usouCreditoAssinatura` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `Plano` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `valorMensal` DECIMAL(10, 2) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemPlano` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `planoId` INTEGER NOT NULL,
    `itemId` INTEGER NOT NULL,
    `quantidade` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Assinatura` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('ATIVA', 'INATIVA') NOT NULL DEFAULT 'ATIVA',
    `diaVencimento` INTEGER NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clienteId` INTEGER NOT NULL,
    `planoId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CreditoAssinatura` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assinaturaId` INTEGER NOT NULL,
    `itemId` INTEGER NOT NULL,
    `quantidadeRestante` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ItemPlano` ADD CONSTRAINT `ItemPlano_planoId_fkey` FOREIGN KEY (`planoId`) REFERENCES `Plano`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemPlano` ADD CONSTRAINT `ItemPlano_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `ItemCatalogo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assinatura` ADD CONSTRAINT `Assinatura_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assinatura` ADD CONSTRAINT `Assinatura_planoId_fkey` FOREIGN KEY (`planoId`) REFERENCES `Plano`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditoAssinatura` ADD CONSTRAINT `CreditoAssinatura_assinaturaId_fkey` FOREIGN KEY (`assinaturaId`) REFERENCES `Assinatura`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditoAssinatura` ADD CONSTRAINT `CreditoAssinatura_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `ItemCatalogo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

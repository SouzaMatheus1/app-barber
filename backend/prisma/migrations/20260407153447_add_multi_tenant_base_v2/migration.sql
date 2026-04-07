-- AlterTable
ALTER TABLE `Cliente` ADD COLUMN `barbeariaId` INTEGER NULL;

-- AlterTable
ALTER TABLE `ItemCatalogo` ADD COLUMN `barbeariaId` INTEGER NULL,
    ADD COLUMN `tipoNovo` ENUM('SERVICO', 'PRODUTO') NULL;

-- AlterTable
ALTER TABLE `ItemTransacao` ADD COLUMN `usouCreditoAssinatura` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Profissional` ADD COLUMN `barbeariaId` INTEGER NULL,
    ADD COLUMN `perfilNovo` ENUM('SUPER_ADMIN', 'TENANT_ADMIN', 'BARBEIRO') NULL DEFAULT 'BARBEIRO';

-- AlterTable
ALTER TABLE `Transacao` ADD COLUMN `barbeariaId` INTEGER NULL,
    ADD COLUMN `tipoNovo` ENUM('ENTRADA', 'SAIDA') NULL;

-- CreateTable
CREATE TABLE `Barbearia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NULL,
    `descricao` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ATIVO',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Barbearia_cnpj_key`(`cnpj`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Plano` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `valorMensal` DECIMAL(10, 2) NOT NULL,
    `qtCortes` INTEGER NOT NULL DEFAULT 0,
    `qtBarbas` INTEGER NOT NULL DEFAULT 0,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `barbeariaId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Assinatura` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('ATIVA', 'INATIVA') NOT NULL DEFAULT 'ATIVA',
    `diaVencimento` INTEGER NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creditosCorte` INTEGER NOT NULL DEFAULT 0,
    `creditosBarba` INTEGER NOT NULL DEFAULT 0,
    `clienteId` INTEGER NOT NULL,
    `planoId` INTEGER NOT NULL,
    `barbeariaId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Profissional` ADD CONSTRAINT `Profissional_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `Barbearia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cliente` ADD CONSTRAINT `Cliente_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `Barbearia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemCatalogo` ADD CONSTRAINT `ItemCatalogo_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `Barbearia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transacao` ADD CONSTRAINT `Transacao_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `Barbearia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Plano` ADD CONSTRAINT `Plano_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `Barbearia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assinatura` ADD CONSTRAINT `Assinatura_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assinatura` ADD CONSTRAINT `Assinatura_planoId_fkey` FOREIGN KEY (`planoId`) REFERENCES `Plano`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assinatura` ADD CONSTRAINT `Assinatura_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `Barbearia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

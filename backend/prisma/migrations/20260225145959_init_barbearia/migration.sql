-- CreateTable
CREATE TABLE `Profissional` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `perfil` ENUM('ADMIN', 'BARBEIRO') NOT NULL DEFAULT 'BARBEIRO',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Profissional_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cliente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemCatalogo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `tipo` ENUM('SERVICO', 'PRODUTO') NOT NULL,
    `preco` DECIMAL(10, 2) NOT NULL,
    `comissao` DECIMAL(5, 2) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('ENTRADA', 'SAIDA') NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `valorTotal` DECIMAL(10, 2) NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `profissionalId` INTEGER NULL,
    `clienteId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemTransacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transacaoId` INTEGER NOT NULL,
    `itemId` INTEGER NOT NULL,
    `quantidade` INTEGER NOT NULL DEFAULT 1,
    `precoUnitario` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Transacao` ADD CONSTRAINT `Transacao_profissionalId_fkey` FOREIGN KEY (`profissionalId`) REFERENCES `Profissional`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transacao` ADD CONSTRAINT `Transacao_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemTransacao` ADD CONSTRAINT `ItemTransacao_transacaoId_fkey` FOREIGN KEY (`transacaoId`) REFERENCES `Transacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemTransacao` ADD CONSTRAINT `ItemTransacao_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `ItemCatalogo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

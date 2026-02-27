/*
  Warnings:

  - You are about to drop the column `tipo` on the `ItemCatalogo` table. All the data in the column will be lost.
  - You are about to drop the column `perfil` on the `Profissional` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `Transacao` table. All the data in the column will be lost.
  - Added the required column `tipoItemId` to the `ItemCatalogo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoTransacaoId` to the `Transacao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ItemCatalogo` DROP COLUMN `tipo`,
    ADD COLUMN `tipoItemId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Profissional` DROP COLUMN `perfil`,
    ADD COLUMN `perfilId` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `Transacao` DROP COLUMN `tipo`,
    ADD COLUMN `tipoTransacaoId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Perfil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Perfil_descricao_key`(`descricao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `TipoItem_descricao_key`(`descricao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoTransacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `TipoTransacao_descricao_key`(`descricao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Profissional` ADD CONSTRAINT `Profissional_perfilId_fkey` FOREIGN KEY (`perfilId`) REFERENCES `Perfil`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemCatalogo` ADD CONSTRAINT `ItemCatalogo_tipoItemId_fkey` FOREIGN KEY (`tipoItemId`) REFERENCES `TipoItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transacao` ADD CONSTRAINT `Transacao_tipoTransacaoId_fkey` FOREIGN KEY (`tipoTransacaoId`) REFERENCES `TipoTransacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

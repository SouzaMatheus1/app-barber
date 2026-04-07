/*
  Warnings:

  - You are about to drop the column `tipoItemId` on the `ItemCatalogo` table. All the data in the column will be lost.
  - You are about to drop the column `tipoNovo` on the `ItemCatalogo` table. All the data in the column will be lost.
  - You are about to drop the column `perfilId` on the `Profissional` table. All the data in the column will be lost.
  - You are about to drop the column `perfilNovo` on the `Profissional` table. All the data in the column will be lost.
  - You are about to drop the column `tipoNovo` on the `Transacao` table. All the data in the column will be lost.
  - You are about to drop the column `tipoTransacaoId` on the `Transacao` table. All the data in the column will be lost.
  - You are about to drop the `Perfil` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TipoItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TipoTransacao` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `barbeariaId` on table `Assinatura` required. This step will fail if there are existing NULL values in that column.
  - Made the column `barbeariaId` on table `Cliente` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `tipo` to the `ItemCatalogo` table without a default value. This is not possible if the table is not empty.
  - Made the column `barbeariaId` on table `ItemCatalogo` required. This step will fail if there are existing NULL values in that column.
  - Made the column `barbeariaId` on table `Plano` required. This step will fail if there are existing NULL values in that column.
  - Made the column `barbeariaId` on table `Profissional` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `tipo` to the `Transacao` table without a default value. This is not possible if the table is not empty.
  - Made the column `barbeariaId` on table `Transacao` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Assinatura` DROP FOREIGN KEY `Assinatura_barbeariaId_fkey`;

-- DropForeignKey
ALTER TABLE `Cliente` DROP FOREIGN KEY `Cliente_barbeariaId_fkey`;

-- DropForeignKey
ALTER TABLE `ItemCatalogo` DROP FOREIGN KEY `ItemCatalogo_barbeariaId_fkey`;

-- DropForeignKey
ALTER TABLE `ItemCatalogo` DROP FOREIGN KEY `ItemCatalogo_tipoItemId_fkey`;

-- DropForeignKey
ALTER TABLE `Plano` DROP FOREIGN KEY `Plano_barbeariaId_fkey`;

-- DropForeignKey
ALTER TABLE `Profissional` DROP FOREIGN KEY `Profissional_barbeariaId_fkey`;

-- DropForeignKey
ALTER TABLE `Profissional` DROP FOREIGN KEY `Profissional_perfilId_fkey`;

-- DropForeignKey
ALTER TABLE `Transacao` DROP FOREIGN KEY `Transacao_barbeariaId_fkey`;

-- DropForeignKey
ALTER TABLE `Transacao` DROP FOREIGN KEY `Transacao_tipoTransacaoId_fkey`;

-- DropIndex
DROP INDEX `Assinatura_barbeariaId_fkey` ON `Assinatura`;

-- DropIndex
DROP INDEX `Cliente_barbeariaId_fkey` ON `Cliente`;

-- DropIndex
DROP INDEX `ItemCatalogo_barbeariaId_fkey` ON `ItemCatalogo`;

-- DropIndex
DROP INDEX `ItemCatalogo_tipoItemId_fkey` ON `ItemCatalogo`;

-- DropIndex
DROP INDEX `Plano_barbeariaId_fkey` ON `Plano`;

-- DropIndex
DROP INDEX `Profissional_barbeariaId_fkey` ON `Profissional`;

-- DropIndex
DROP INDEX `Profissional_perfilId_fkey` ON `Profissional`;

-- DropIndex
DROP INDEX `Transacao_barbeariaId_fkey` ON `Transacao`;

-- DropIndex
DROP INDEX `Transacao_tipoTransacaoId_fkey` ON `Transacao`;

-- AlterTable
ALTER TABLE `Assinatura` MODIFY `barbeariaId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Cliente` MODIFY `barbeariaId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `ItemCatalogo` DROP COLUMN `tipoItemId`,
    DROP COLUMN `tipoNovo`,
    ADD COLUMN `tipo` ENUM('SERVICO', 'PRODUTO') NOT NULL,
    MODIFY `barbeariaId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Plano` MODIFY `barbeariaId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Profissional` DROP COLUMN `perfilId`,
    DROP COLUMN `perfilNovo`,
    ADD COLUMN `perfil` ENUM('SUPER_ADMIN', 'TENANT_ADMIN', 'BARBEIRO') NOT NULL DEFAULT 'BARBEIRO',
    MODIFY `barbeariaId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Transacao` DROP COLUMN `tipoNovo`,
    DROP COLUMN `tipoTransacaoId`,
    ADD COLUMN `tipo` ENUM('ENTRADA', 'SAIDA') NOT NULL,
    MODIFY `barbeariaId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `Perfil`;

-- DropTable
DROP TABLE `TipoItem`;

-- DropTable
DROP TABLE `TipoTransacao`;

-- AddForeignKey
ALTER TABLE `Profissional` ADD CONSTRAINT `Profissional_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `Barbearia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cliente` ADD CONSTRAINT `Cliente_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `Barbearia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemCatalogo` ADD CONSTRAINT `ItemCatalogo_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `Barbearia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transacao` ADD CONSTRAINT `Transacao_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `Barbearia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Plano` ADD CONSTRAINT `Plano_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `Barbearia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assinatura` ADD CONSTRAINT `Assinatura_barbeariaId_fkey` FOREIGN KEY (`barbeariaId`) REFERENCES `Barbearia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

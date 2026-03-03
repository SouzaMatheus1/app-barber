/*
  Warnings:

  - Made the column `profissionalId` on table `Transacao` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Transacao` DROP FOREIGN KEY `Transacao_profissionalId_fkey`;

-- DropIndex
DROP INDEX `Transacao_profissionalId_fkey` ON `Transacao`;

-- AlterTable
ALTER TABLE `Transacao` MODIFY `profissionalId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Transacao` ADD CONSTRAINT `Transacao_profissionalId_fkey` FOREIGN KEY (`profissionalId`) REFERENCES `Profissional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `Transacao` ADD COLUMN `ativoId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Transacao_ativoId_idx` ON `Transacao`(`ativoId`);

-- AddForeignKey
ALTER TABLE `Transacao` ADD CONSTRAINT `Transacao_ativoId_fkey` FOREIGN KEY (`ativoId`) REFERENCES `Ativo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

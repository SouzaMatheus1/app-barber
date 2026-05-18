-- AlterTable
ALTER TABLE `Assinatura` ADD COLUMN `empresaId` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `CategoriaCusto` ADD COLUMN `empresaId` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `Cliente` ADD COLUMN `empresaId` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `CreditoAssinatura` ADD COLUMN `empresaId` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `FechamentoCaixa` ADD COLUMN `empresaId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `ItemCatalogo` ADD COLUMN `empresaId` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `ItemTransacao` ADD COLUMN `empresaId` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `Plano` ADD COLUMN `empresaId` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `Profissional` ADD COLUMN `empresaId` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `Transacao` ADD COLUMN `empresaId` INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX `Assinatura_empresaId_idx` ON `Assinatura`(`empresaId`);

-- CreateIndex
CREATE INDEX `CategoriaCusto_empresaId_idx` ON `CategoriaCusto`(`empresaId`);

-- CreateIndex
CREATE INDEX `Cliente_empresaId_idx` ON `Cliente`(`empresaId`);

-- CreateIndex
CREATE INDEX `CreditoAssinatura_empresaId_idx` ON `CreditoAssinatura`(`empresaId`);

-- CreateIndex
CREATE INDEX `FechamentoCaixa_empresaId_idx` ON `FechamentoCaixa`(`empresaId`);

-- CreateIndex
CREATE UNIQUE INDEX `FechamentoCaixa_empresaId_data_key` ON `FechamentoCaixa`(`empresaId`, `data`);

-- CreateIndex
CREATE INDEX `ItemCatalogo_empresaId_idx` ON `ItemCatalogo`(`empresaId`);

-- CreateIndex
CREATE INDEX `ItemTransacao_empresaId_idx` ON `ItemTransacao`(`empresaId`);

-- CreateIndex
CREATE INDEX `Plano_empresaId_idx` ON `Plano`(`empresaId`);

-- CreateIndex
CREATE INDEX `Profissional_empresaId_idx` ON `Profissional`(`empresaId`);

-- CreateIndex
CREATE INDEX `Transacao_empresaId_idx` ON `Transacao`(`empresaId`);

-- CreateIndex
CREATE INDEX `Transacao_empresaId_data_idx` ON `Transacao`(`empresaId`, `data`);

-- AddForeignKey
ALTER TABLE `Profissional` ADD CONSTRAINT `Profissional_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cliente` ADD CONSTRAINT `Cliente_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemCatalogo` ADD CONSTRAINT `ItemCatalogo_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transacao` ADD CONSTRAINT `Transacao_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CategoriaCusto` ADD CONSTRAINT `CategoriaCusto_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemTransacao` ADD CONSTRAINT `ItemTransacao_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Plano` ADD CONSTRAINT `Plano_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assinatura` ADD CONSTRAINT `Assinatura_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditoAssinatura` ADD CONSTRAINT `CreditoAssinatura_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FechamentoCaixa` ADD CONSTRAINT `FechamentoCaixa_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


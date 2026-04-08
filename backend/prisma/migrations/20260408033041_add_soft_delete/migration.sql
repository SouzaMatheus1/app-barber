-- AlterTable
ALTER TABLE `Cliente` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `ItemCatalogo` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Profissional` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;

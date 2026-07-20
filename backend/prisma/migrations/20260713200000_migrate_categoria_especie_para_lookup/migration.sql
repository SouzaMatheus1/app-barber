-- CreateTable CategoriaVeiculo
CREATE TABLE `CategoriaVeiculo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(191) NOT NULL,
    UNIQUE INDEX `CategoriaVeiculo_descricao_key`(`descricao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable EspecieAnimal
CREATE TABLE `EspecieAnimal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(191) NOT NULL,
    UNIQUE INDEX `EspecieAnimal_descricao_key`(`descricao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Populate lookup tables
INSERT INTO `CategoriaVeiculo` (`descricao`) VALUES ('CARRO'), ('MOTO'), ('CAMINHAO');
INSERT INTO `EspecieAnimal` (`descricao`) VALUES ('CACHORRO'), ('GATO'), ('AVE'), ('OUTROS');

-- Clear existing asset data to prevent constraint/default failures
UPDATE `Agendamento` SET `ativoId` = NULL;
DELETE FROM `AtivoAnimal`;
DELETE FROM `AtivoVeiculo`;
DELETE FROM `Ativo`;

-- AlterTable AtivoVeiculo
ALTER TABLE `AtivoVeiculo` DROP COLUMN `categoria`,
    ADD COLUMN `categoriaId` INTEGER NOT NULL;

-- AlterTable AtivoAnimal
ALTER TABLE `AtivoAnimal` DROP COLUMN `especie`,
    ADD COLUMN `especieId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `AtivoVeiculo_categoriaId_idx` ON `AtivoVeiculo`(`categoriaId`);

-- CreateIndex
CREATE INDEX `AtivoAnimal_especieId_idx` ON `AtivoAnimal`(`especieId`);

-- AddForeignKey
ALTER TABLE `AtivoVeiculo` ADD CONSTRAINT `AtivoVeiculo_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `CategoriaVeiculo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtivoAnimal` ADD CONSTRAINT `AtivoAnimal_especieId_fkey` FOREIGN KEY (`especieId`) REFERENCES `EspecieAnimal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

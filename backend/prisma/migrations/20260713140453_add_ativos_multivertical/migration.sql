-- AlterTable
ALTER TABLE `Agendamento` ADD COLUMN `ativoId` INTEGER NULL;

-- CreateTable
CREATE TABLE `TipoAtivo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chave` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `TipoAtivo_chave_key`(`chave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoEmpresaAtivo` (
    `tipoEmpresaId` INTEGER NOT NULL,
    `tipoAtivoId` INTEGER NOT NULL,

    PRIMARY KEY (`tipoEmpresaId`, `tipoAtivoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ativo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empresaId` INTEGER NOT NULL DEFAULT 1,
    `clienteId` INTEGER NOT NULL,
    `tipoAtivoId` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Ativo_empresaId_idx`(`empresaId`),
    INDEX `Ativo_clienteId_idx`(`clienteId`),
    INDEX `Ativo_tipoAtivoId_idx`(`tipoAtivoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtivoVeiculo` (
    `ativoId` INTEGER NOT NULL,
    `modelo` VARCHAR(191) NOT NULL,
    `ano` INTEGER NULL,
    `cor` VARCHAR(191) NULL,
    `placa` VARCHAR(191) NULL,

    PRIMARY KEY (`ativoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AtivoAnimal` (
    `ativoId` INTEGER NOT NULL,
    `especie` VARCHAR(191) NOT NULL,
    `raca` VARCHAR(191) NULL,
    `porte` VARCHAR(191) NULL,

    PRIMARY KEY (`ativoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Agendamento_ativoId_idx` ON `Agendamento`(`ativoId`);

-- AddForeignKey
ALTER TABLE `Agendamento` ADD CONSTRAINT `Agendamento_ativoId_fkey` FOREIGN KEY (`ativoId`) REFERENCES `Ativo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TipoEmpresaAtivo` ADD CONSTRAINT `TipoEmpresaAtivo_tipoEmpresaId_fkey` FOREIGN KEY (`tipoEmpresaId`) REFERENCES `TipoEmpresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TipoEmpresaAtivo` ADD CONSTRAINT `TipoEmpresaAtivo_tipoAtivoId_fkey` FOREIGN KEY (`tipoAtivoId`) REFERENCES `TipoAtivo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ativo` ADD CONSTRAINT `Ativo_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ativo` ADD CONSTRAINT `Ativo_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ativo` ADD CONSTRAINT `Ativo_tipoAtivoId_fkey` FOREIGN KEY (`tipoAtivoId`) REFERENCES `TipoAtivo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtivoVeiculo` ADD CONSTRAINT `AtivoVeiculo_ativoId_fkey` FOREIGN KEY (`ativoId`) REFERENCES `Ativo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AtivoAnimal` ADD CONSTRAINT `AtivoAnimal_ativoId_fkey` FOREIGN KEY (`ativoId`) REFERENCES `Ativo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Seeds para Ativos
INSERT IGNORE INTO TipoAtivo (id, chave, descricao) VALUES (1, 'veiculo', 'Veículo');
INSERT IGNORE INTO TipoAtivo (id, chave, descricao) VALUES (2, 'animal', 'Animal de Estimação');

INSERT IGNORE INTO TipoEmpresa (id, descricao) VALUES (2, 'Lava Rápido');
INSERT IGNORE INTO TipoEmpresa (id, descricao) VALUES (3, 'Pet Shop');

INSERT IGNORE INTO TipoEmpresaAtivo (tipoEmpresaId, tipoAtivoId) VALUES (2, 1);
INSERT IGNORE INTO TipoEmpresaAtivo (tipoEmpresaId, tipoAtivoId) VALUES (3, 2);


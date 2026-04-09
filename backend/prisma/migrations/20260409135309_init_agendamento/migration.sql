-- AlterTable
ALTER TABLE `itemcatalogo` ADD COLUMN `duracaoMinutos` INTEGER NOT NULL DEFAULT 30;

-- CreateTable
CREATE TABLE `Agendamento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataHoraInicio` DATETIME(3) NOT NULL,
    `dataHoraFim` DATETIME(3) NOT NULL,
    `clienteId` INTEGER NULL,
    `profissionalId` INTEGER NOT NULL,
    `status` ENUM('CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO', 'NO_SHOW', 'INDISPONIVEL') NOT NULL DEFAULT 'CONFIRMADO',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `observacao` VARCHAR(191) NULL,

    INDEX `Agendamento_clienteId_idx`(`clienteId`),
    INDEX `Agendamento_profissionalId_idx`(`profissionalId`),
    INDEX `Agendamento_dataHoraInicio_dataHoraFim_idx`(`dataHoraInicio`, `dataHoraFim`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServicoAgendamento` (
    `agendamentoId` INTEGER NOT NULL,
    `itemId` INTEGER NOT NULL,

    PRIMARY KEY (`agendamentoId`, `itemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Agendamento` ADD CONSTRAINT `Agendamento_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agendamento` ADD CONSTRAINT `Agendamento_profissionalId_fkey` FOREIGN KEY (`profissionalId`) REFERENCES `Profissional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServicoAgendamento` ADD CONSTRAINT `ServicoAgendamento_agendamentoId_fkey` FOREIGN KEY (`agendamentoId`) REFERENCES `Agendamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServicoAgendamento` ADD CONSTRAINT `ServicoAgendamento_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `ItemCatalogo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

import { PeticaoController } from '../../src/peticao/controller/peticao.controller';
import { PeticaoService } from '../../src/peticao/service/peticao.service';
import { NotFoundException } from '@nestjs/common';

const makePeticaoResponse = () => ({
  id: 1,
  caminhoArquivo: 'path/to/file.pdf',
  resumo: 'Resumo da petição',
  createdAt: new Date(),
  usuarioId: 1,
});

describe('PeticaoController - Historico', () => {
  let controller: PeticaoController;
  let service: Partial<PeticaoService>;

  beforeEach(() => {
    service = {
      findHistoricoByPeticao: jest.fn(),
    };
    controller = new PeticaoController(service as PeticaoService);
  });

  describe('findHistoricoByPeticao', () => {
    it('should return a petition with its suggested precedents', async () => {
      const response = {
        ...makePeticaoResponse(),
        precedentesSugeridos: [{ id: 1, descricao: 'Precedente 1' }],
      };

      (service.findHistoricoByPeticao as jest.Mock).mockResolvedValueOnce(response);

      const req = { user: { id: 1 } };
      const result = await controller.findHistoricoByPeticao(1, req);

      expect(result).toEqual(response);
      expect(service.findHistoricoByPeticao).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException if petition is not found', async () => {
      (service.findHistoricoByPeticao as jest.Mock).mockRejectedValueOnce(
        new NotFoundException('Petição não encontrada'),
      );

      const req = { user: { id: 1 } };
      await expect(controller.findHistoricoByPeticao(999, req)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

import { PrecedenteSugeridoController } from '../../src/precedents/controller/precedente-sugerido.controller';
import { PrecedenteSugeridoService } from '../../src/precedents/service/precedente_sugerido.service';
import { NotFoundException } from '@nestjs/common';

describe('PrecedenteSugeridoController - Historico', () => {
  let controller: PrecedenteSugeridoController;
  let service: Partial<PrecedenteSugeridoService>;

  beforeEach(() => {
    service = {
      findByPeticao: jest.fn(),
    };
    controller = new PrecedenteSugeridoController(service as PrecedenteSugeridoService);
  });

  describe('findByPeticao', () => {
    it('should return precedents for a given petition', async () => {
      const precedents = [{ id: 1, descricao: 'Precedente 1' }];
      (service.findByPeticao as jest.Mock).mockResolvedValueOnce(precedents);

      const result = await controller.findByPeticao(1);

      expect(result).toEqual(precedents);
      expect(service.findByPeticao).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if no precedents are found', async () => {
      (service.findByPeticao as jest.Mock).mockRejectedValueOnce(
        new NotFoundException('Precedentes não encontrados'),
      );

      await expect(controller.findByPeticao(999)).rejects.toThrow(NotFoundException);
    });
  });
});
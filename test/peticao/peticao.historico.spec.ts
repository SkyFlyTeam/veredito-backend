import { NotFoundException } from '@nestjs/common';

import { PeticaoController } from '../../src/peticao/controller/peticao.controller';
import { PeticaoService } from '../../src/peticao/service/peticao.service';

import { PrecedenteSugeridoController } from '../../src/precedents/controller/precedente-sugerido.controller';
import { PrecedenteSugeridoService } from '../../src/precedents/service/precedente_sugerido.service';

describe('PeticaoController - Histórico do Usuário', () => {
  let controller: PeticaoController;
  let service: Partial<PeticaoService>;

  beforeEach(() => {
    service = {
      findHistoricoByUsuario: jest.fn(),
      findOne: jest.fn(),
    };

    controller = new PeticaoController(
      service as PeticaoService,
      null as any,
      null as any,
    );
  });

  describe('findMine', () => {
    it('should return petitions for authenticated user', async () => {
      const response = [
        {
          id: 1,
          caminhoArquivo: 'path/to/file.pdf',
          resumo: 'Resumo da petição',
          createdAt: new Date(),
          usuarioId: 1,
        },
      ];

      (service.findHistoricoByUsuario as jest.Mock)
        .mockResolvedValueOnce(response);

      const req = {
        user: {
          id: 1,
        },
      };

      const result = await controller.findMine(req);

      expect(result).toEqual(response);

      expect(service.findHistoricoByUsuario).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if no petitions are found', async () => {
      (service.findHistoricoByUsuario as jest.Mock)
        .mockRejectedValueOnce(
          new NotFoundException(
            'Nenhuma petição encontrada',
          ),
        );

      const req = {
        user: {
          id: 1,
        },
      };

      await expect(
        controller.findMine(req),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return petition by ID', async () => {
      const response = {
        id: 1,
        caminhoArquivo: 'path/to/file.pdf',
        resumo: 'Resumo da petição',
        createdAt: new Date(),
        usuarioId: 1,
      };

      (service.findOne as jest.Mock)
        .mockResolvedValueOnce(response);

      const result = await controller.findOne(1);

      expect(result).toEqual(response);

      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if petition is not found', async () => {
      (service.findOne as jest.Mock)
        .mockRejectedValueOnce(
          new NotFoundException(
            'Petição com ID 999 não encontrada',
          ),
        );

      await expect(
        controller.findOne(999),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

describe('PrecedenteSugeridoController - por-peticao/:peticaoId', () => {
  let controller: PrecedenteSugeridoController;
  let service: Partial<PrecedenteSugeridoService>;

  beforeEach(() => {
    service = {
      findByPeticao: jest.fn(),
    };

    controller = new PrecedenteSugeridoController(
      service as PrecedenteSugeridoService,
    );
  });

  describe('findByPeticao', () => {
    it('should return precedents for a petition ID', async () => {
      const precedentes = [
        {
          id: 1,
          descricao: 'Precedente 1',
        },
      ];

      (service.findByPeticao as jest.Mock)
        .mockResolvedValueOnce(precedentes);

      const result =
        await controller.findByPeticao(1);

      expect(result).toEqual(precedentes);

      expect(
        service.findByPeticao,
      ).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if no precedents are found', async () => {
      (service.findByPeticao as jest.Mock)
        .mockRejectedValueOnce(
          new NotFoundException(
            'Nenhum precedente encontrado',
          ),
        );

      await expect(
        controller.findByPeticao(999),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { PeticaoController } from './peticao.controller';
import { PeticaoService } from '../service/peticao.service';
import { PeticaoResponseDTO } from '../dto/peticao-response.dto';

describe('PeticaoController', () => {
  let controller: PeticaoController;
  let service: PeticaoService;

  const mockPeticaoResponse: PeticaoResponseDTO = {
    id: 1,
    caminhoArquivo: 'path/to/file.pdf',
    resumo: 'Resumo da petição',
    createdAt: new Date(),
    usuarioId: 1,
  };

  const mockPeticaoService = {
    findAll: jest.fn().mockResolvedValue([mockPeticaoResponse]),
    findOne: jest.fn().mockResolvedValue(mockPeticaoResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PeticaoController],
      providers: [
        {
          provide: PeticaoService,
          useValue: mockPeticaoService,
        },
      ],
    }).compile();

    controller = module.get<PeticaoController>(PeticaoController);
    service = module.get<PeticaoService>(PeticaoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of petitions', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockPeticaoResponse]);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return an empty array if no petitions found', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([]);
      const result = await controller.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single petition', async () => {
      const result = await controller.findOne(1);
      expect(result).toEqual(mockPeticaoResponse);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });
});

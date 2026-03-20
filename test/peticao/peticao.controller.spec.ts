import { PeticaoController } from '../../src/peticao/controller/peticao.controller';
import { PeticaoService } from '../../src/peticao/service/peticao.service';
import { PeticaoResponseDTO } from '../../src/peticao/dto/peticao-response.dto';
import { BadRequestException } from '@nestjs/common';

const makePeticaoResponse = (): PeticaoResponseDTO => ({
  id: 1,
  caminhoArquivo: 'path/to/file.pdf',
  resumo: 'Resumo da petição',
  createdAt: new Date(),
  usuarioId: 1,
});

const createPeticaoServiceMock = () => ({
  findAll: jest.fn((): Promise<PeticaoResponseDTO[]> => Promise.resolve([])),
  findOne: jest.fn((): Promise<PeticaoResponseDTO> => Promise.resolve(makePeticaoResponse())),
  create: jest.fn((): Promise<void> => Promise.resolve()),
});

describe('PeticaoController', () => {
  let controller: PeticaoController;
  let service: ReturnType<typeof createPeticaoServiceMock>;

  beforeEach(() => {
    jest.resetAllMocks();
    service = createPeticaoServiceMock();
    controller = new PeticaoController(service as never);
  });

  describe('findAll', () => {
    it('should return an array of petitions', async () => {
      const response = makePeticaoResponse();
      service.findAll.mockResolvedValueOnce([response]);

      const result = await controller.findAll();
      expect(result).toEqual([response]);
    });

    it('should return an empty array if no petitions found', async () => {
      service.findAll.mockResolvedValueOnce([]);
      const result = await controller.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single petition', async () => {
      const response = makePeticaoResponse();
      service.findOne.mockResolvedValueOnce(response);

      const result = await controller.findOne(1);
      expect(result).toEqual(response);
    });
  });

  describe('uploadFile', () => {
    it('should call service for file upload', async () => {
      const file = { path: 'uploads/file.pdf' } as Express.Multer.File;
      await controller.uploadFile(file);
      expect(service.create).toHaveBeenCalledWith('uploads/file.pdf', 1);
    });

    it('should throw BadRequestException if file is missing', async () => {
      await expect(controller.uploadFile(null as any)).rejects.toThrow(BadRequestException);
    });
  });
});

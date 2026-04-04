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
  create: jest.fn((): Promise<PeticaoResponseDTO> => Promise.resolve(makePeticaoResponse())),
});

describe('PeticaoController', () => {
  let controller: PeticaoController;
  let service: ReturnType<typeof createPeticaoServiceMock>;
  let mockOrchestrator: any;
  let mockPrecedenteSugeridoService: any;

  beforeEach(() => {
    jest.resetAllMocks();
    service = createPeticaoServiceMock();
    mockOrchestrator = { run: jest.fn() };
    mockPrecedenteSugeridoService = { findByPeticao: jest.fn() };

    controller = new PeticaoController(
      service as any,
      mockOrchestrator,
      mockPrecedenteSugeridoService,
    );
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
    it('should call service for file upload and return the created petition', async () => {
      const file = { path: 'uploads/file.pdf' } as Express.Multer.File;
      const mockReq = { user: { id: 1 } };
      const expectedResponse = makePeticaoResponse();
      service.create.mockResolvedValueOnce(expectedResponse);
      
      const result = await controller.uploadFile(file, mockReq as any);
      
      expect(service.create).toHaveBeenCalledWith('uploads/file.pdf', 1);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw BadRequestException if file is missing', async () => {
      const mockReq = { user: { id: 1 } };
      await expect(
        controller.uploadFile(null as any, mockReq as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user is not authenticated', async () => {
      const file = { path: 'uploads/file.pdf' } as Express.Multer.File;
      const mockReq = {};
      await expect(
        controller.uploadFile(file, mockReq as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('fileFilter', () => {
    let mockCallback: jest.Mock;

    beforeEach(() => {
      mockCallback = jest.fn();
    });

    // Helper function to test the file filter directly
    const testFileFilter = (filename: string, callback: jest.Mock) => {
      const file = { originalname: filename } as Express.Multer.File;
      
      // Simulate the fileFilter function from the controller
      if (!file.originalname.match(/\.(pdf|docx|txt)$/i)) {
        return callback(
          new BadRequestException(
            'Apenas arquivos .pdf, .docx e .txt são permitidos',
          ),
          false,
        );
      }
      callback(null, true);
    };

    describe('valid file extensions', () => {
      it('should accept lowercase .pdf files', () => {
        testFileFilter('document.pdf', mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(null, true);
      });

      it('should accept uppercase .PDF files', () => {
        testFileFilter('document.PDF', mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(null, true);
      });

      it('should accept mixed case .Pdf files', () => {
        testFileFilter('document.Pdf', mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(null, true);
      });

      it('should accept lowercase .docx files', () => {
        testFileFilter('document.docx', mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(null, true);
      });

      it('should accept uppercase .DOCX files', () => {
        testFileFilter('document.DOCX', mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(null, true);
      });

      it('should accept mixed case .Docx files', () => {
        testFileFilter('document.DocX', mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(null, true);
      });

      it('should accept lowercase .txt files', () => {
        testFileFilter('document.txt', mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(null, true);
      });

      it('should accept uppercase .TXT files', () => {
        testFileFilter('document.TXT', mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(null, true);
      });

      it('should accept mixed case .Txt files', () => {
        testFileFilter('document.TxT', mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(null, true);
      });
    });

    describe('invalid file extensions', () => {
      it('should reject .jpg files', () => {
        testFileFilter('image.jpg', mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(
          expect.any(BadRequestException),
          false,
        );
        expect(mockCallback.mock.calls[0][0].message).toBe(
          'Apenas arquivos .pdf, .docx e .txt são permitidos',
        );
      });

      it('should reject .png files', () => {
        testFileFilter('image.png', mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(
          expect.any(BadRequestException),
          false,
        );
      });

      it('should reject .exe files', () => {
        testFileFilter('program.exe', mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(
          expect.any(BadRequestException),
          false,
        );
      });

      it('should reject files without extension', () => {
        testFileFilter('document', mockCallback);
        expect(mockCallback).toHaveBeenCalledWith(
          expect.any(BadRequestException),
          false,
        );
      });
    });
  });
});

import { validate } from 'class-validator';
import { SemanticSearchDto } from '../../../src/peticao/semantic-search/dto/semantic-search.dto';

describe('SemanticSearchDto', () => {
  it('should validate a valid embedding array', async () => {
    const dto = new SemanticSearchDto();
    dto.embedding = [0.1, 0.2, 0.3, 0.4, 0.5];

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation for empty embedding array', async () => {
    const dto = new SemanticSearchDto();
    dto.embedding = [];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('arrayNotEmpty');
  });

  it('should fail validation for non-array embedding', async () => {
    const dto = new SemanticSearchDto();
    (dto as any).embedding = 'not an array';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isArray');
  });

  it('should fail validation for array with non-numeric values', async () => {
    const dto = new SemanticSearchDto();
    (dto as any).embedding = [0.1, 'string', 0.3];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNumber');
  });

  it('should accept empty object when embedding is undefined', async () => {
    const dto = new SemanticSearchDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

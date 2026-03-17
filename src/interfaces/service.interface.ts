import DTOInterface from './dto.interface';
import EntityInterface from './entity.interface';

export default interface ServiceInterface {
  create(dto: DTOInterface): Promise<EntityInterface>;
  findAll(): Promise<EntityInterface[]>;
  findOne(id: string): Promise<EntityInterface | null>;
  update(id: string, dto: DTOInterface): Promise<EntityInterface>;
  delete(id: string): Promise<EntityInterface>;
}

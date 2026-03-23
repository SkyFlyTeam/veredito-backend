import DTOInterface from './dto.interface';
import EntityInterface from './entity.interface';

export default interface ServiceInterface {
  create(dto: DTOInterface): Promise<EntityInterface>;
  findAll(): Promise<EntityInterface[]>;
  findOne(id: string | number): Promise<EntityInterface | null>;
  update(id: string | number, dto: DTOInterface): Promise<EntityInterface>;
  delete(id: string | number): Promise<EntityInterface>;
}

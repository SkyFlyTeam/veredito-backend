import { DataSource, Repository } from 'typeorm';
import { EspeciePrecedenteEntity } from '../entity/especie_precedente.entity';

export default class EspeciePrecedenteRepository extends Repository<EspeciePrecedenteEntity> {
  constructor(private dataSource: DataSource) {
    super(EspeciePrecedenteEntity, dataSource.createEntityManager());
  }
}

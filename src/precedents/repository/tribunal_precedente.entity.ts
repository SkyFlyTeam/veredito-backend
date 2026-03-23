import { DataSource, Repository } from 'typeorm';
import { TribunalPrecedenteEntity } from '../entity/tribunal_precedente.entity';

export default class TribunalPrecedenteRepository extends Repository<TribunalPrecedenteEntity> {
  constructor(private dataSource: DataSource) {
    super(TribunalPrecedenteEntity, dataSource.createEntityManager());
  }
}

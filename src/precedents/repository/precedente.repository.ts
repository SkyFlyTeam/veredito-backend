import { DataSource, Repository } from 'typeorm';
import PrecedenteEntity from '../entity/precedente.entity';

export default class PrecedenteRepository extends Repository<PrecedenteEntity> {
  constructor(private dataSource: DataSource) {
    super(PrecedenteEntity, dataSource.createEntityManager());
  }
}

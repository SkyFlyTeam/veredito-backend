import { DataSource, Repository } from 'typeorm';
import { StatusPrecedenteEntity } from '../entity/status_precedente.entity';

export default class StatusPrecedenteRepository extends Repository<StatusPrecedenteEntity> {
  constructor(private dataSource: DataSource) {
    super(StatusPrecedenteEntity, dataSource.createEntityManager());
  }
}

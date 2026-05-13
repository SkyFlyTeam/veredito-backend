import { DataSource, Repository } from 'typeorm';
import PecaEntity from '../entity/peca.entity';

export default class PecaRepository extends Repository<PecaEntity> {
  constructor(private dataSource: DataSource) {
    super(PecaEntity, dataSource.createEntityManager());
  }
}

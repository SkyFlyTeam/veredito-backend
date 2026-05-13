import { DataSource, Repository } from 'typeorm';
import TipoPecaEntity from '../entity/tipo_peca.entity';

export default class TipoPecaRepository extends Repository<TipoPecaEntity> {
  constructor(private dataSource: DataSource) {
    super(TipoPecaEntity, dataSource.createEntityManager());
  }
}

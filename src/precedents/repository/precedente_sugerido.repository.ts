import { DataSource, Repository } from 'typeorm';
import { PrecedenteSugeridoEntity } from '../entity/precedente_sugerido.entity';

export default class PrecedenteSugeridoRepository extends Repository<PrecedenteSugeridoEntity> {
  constructor(private dataSource: DataSource) {
    super(PrecedenteSugeridoEntity, dataSource.createEntityManager());
  }
}

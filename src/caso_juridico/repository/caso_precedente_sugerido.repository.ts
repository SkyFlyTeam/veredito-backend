import { DataSource, Repository } from 'typeorm';
import { CasoPrecedenteSugeridoEntity } from '../entity/caso_precedente_sugerido.entity';

export default class CasoPrecedenteSugeridoRepository extends Repository<CasoPrecedenteSugeridoEntity> {
  constructor(private dataSource: DataSource) {
    super(CasoPrecedenteSugeridoEntity, dataSource.createEntityManager());
  }
}

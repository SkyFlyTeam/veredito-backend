import { DataSource, Repository } from 'typeorm';
import { CasoJuridicoEntity } from '../entity/caso_juridico.entity';

export default class CasoJuridicoRepository extends Repository<CasoJuridicoEntity> {
  constructor(private dataSource: DataSource) {
    super(CasoJuridicoEntity, dataSource.createEntityManager());
  }
}

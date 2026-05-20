import { DataSource, Repository } from 'typeorm';
import { SecoesPeticaoEntity } from '../entity/secoes_peticao.entity';

export default class SecoesPeticaoRepository extends Repository<SecoesPeticaoEntity> {
  constructor(private dataSource: DataSource) {
    super(SecoesPeticaoEntity, dataSource.createEntityManager());
  }
}

import { DataSource, Repository } from 'typeorm';
import ProcessoJuridicoEntity from '../entity/processo_juridico.entity';

export default class ProcessoJuridicoRepository extends Repository<ProcessoJuridicoEntity> {
  constructor(private dataSource: DataSource) {
    super(ProcessoJuridicoEntity, dataSource.createEntityManager());
  }
}

import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';

export class UserRepository extends Repository<UserEntity> {
  constructor(private dataSource: DataSource) {
    super(UserEntity, dataSource.createEntityManager());
  }

  findByEmail(email: string) {
    return this.findOne({ where: { email } });
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export default class TrocarNomeStatus1774799357733 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'UPDATE status_precedente SET nome = \'acórdão publicado\' WHERE id = 10',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'UPDATE status_precedente SET nome = \'acórdão publicado\' WHERE id = 10',
    );
  }
}

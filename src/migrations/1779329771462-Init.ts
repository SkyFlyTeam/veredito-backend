import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1779329771462 implements MigrationInterface {
    name = 'Init1779329771462'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "processo_juridico" ADD "pedidos" text`);
        await queryRunner.query(`ALTER TABLE "processo_juridico" ADD "fundamentos" text`);
        await queryRunner.query(`ALTER TABLE "processo_juridico" ADD "fatos" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "processo_juridico" DROP COLUMN "fatos"`);
        await queryRunner.query(`ALTER TABLE "processo_juridico" DROP COLUMN "fundamentos"`);
        await queryRunner.query(`ALTER TABLE "processo_juridico" DROP COLUMN "pedidos"`);
    }

}

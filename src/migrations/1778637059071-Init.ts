import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1778637059071 implements MigrationInterface {
    name = 'Init1778637059071'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" DROP COLUMN "created_at"`);
    }

}

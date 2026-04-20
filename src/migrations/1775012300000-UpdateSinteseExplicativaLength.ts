import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSinteseExplicativaLength1775012300000 implements MigrationInterface {
    name = 'UpdateSinteseExplicativaLength1775012300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ALTER COLUMN "sintese_explicativa" TYPE character varying(1000)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ALTER COLUMN "sintese_explicativa" TYPE character varying(500)`);
    }

}

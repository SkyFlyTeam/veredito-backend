import { MigrationInterface, QueryRunner } from "typeorm";

export class IncreaseSecoesPeticaoTituloLength1779413000000 implements MigrationInterface {
    name = 'IncreaseSecoesPeticaoTituloLength1779413000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "secoes_peticao" ALTER COLUMN "titulo" TYPE character varying(150)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "secoes_peticao" ALTER COLUMN "titulo" TYPE character varying(50)`);
    }

}

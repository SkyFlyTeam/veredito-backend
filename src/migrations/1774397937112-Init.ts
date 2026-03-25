import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1774397937112 implements MigrationInterface {
    name = 'Init1774397937112'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "precedente" DROP COLUMN "numero_registro"`);
        await queryRunner.query(`ALTER TABLE "precedente" ADD "numero_registro" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "precedente" DROP COLUMN "tese"`);
        await queryRunner.query(`ALTER TABLE "precedente" ADD "tese" text`);
        await queryRunner.query(`ALTER TABLE "precedente" ALTER COLUMN "tese_vetor" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "precedente" ALTER COLUMN "questao_vetor" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "precedente" ALTER COLUMN "questao_vetor" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "precedente" ALTER COLUMN "tese_vetor" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "precedente" DROP COLUMN "tese"`);
        await queryRunner.query(`ALTER TABLE "precedente" ADD "tese" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "precedente" DROP COLUMN "numero_registro"`);
        await queryRunner.query(`ALTER TABLE "precedente" ADD "numero_registro" integer NOT NULL`);

    }

}

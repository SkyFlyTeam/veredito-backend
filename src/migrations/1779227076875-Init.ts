import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1779227076875 implements MigrationInterface {
    name = 'Init1779227076875'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "secoes_peticao" ("id" SERIAL NOT NULL, "titulo" character varying(50) NOT NULL, "conteudo" text NOT NULL, CONSTRAINT "PK_cb01457c8d8fb8a42bf56dbb1e2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "caso_juridico" ADD "secoes_peticao_id" integer`);
        await queryRunner.query(`ALTER TABLE "caso_juridico" ADD CONSTRAINT "FK_bbf983d77786eecfbce1bb8f34c" FOREIGN KEY ("secoes_peticao_id") REFERENCES "secoes_peticao"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "caso_juridico" DROP CONSTRAINT "FK_bbf983d77786eecfbce1bb8f34c"`);
        await queryRunner.query(`ALTER TABLE "caso_juridico" DROP COLUMN "secoes_peticao_id"`);
        await queryRunner.query(`DROP TABLE "secoes_peticao"`);
    }

}

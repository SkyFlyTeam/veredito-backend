import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1773841127239 implements MigrationInterface {
    name = 'Init1773841127239'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "peticao" ("id" SERIAL NOT NULL, "caminho_arquivo" character varying NOT NULL, "resumo" character varying, "tese_vetor" character varying, "questao_vetor" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "usuario_id" integer NOT NULL, CONSTRAINT "PK_b305f34cad35c4193b9bd816e5b" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "peticao"`);
    }

}

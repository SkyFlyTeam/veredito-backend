import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1779227076875 implements MigrationInterface {
    name = 'Init1779227076875'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_questao"`);
        await queryRunner.query(`DROP INDEX "public"."idx_tese"`);
        await queryRunner.query(`DROP INDEX "public"."idx_peticao_questao"`);
        await queryRunner.query(`DROP INDEX "public"."idx_peticao_tese"`);
        await queryRunner.query(`CREATE TABLE "secoes_peticao" ("id" SERIAL NOT NULL, "titulo" character varying(50) NOT NULL, "conteudo" text NOT NULL, CONSTRAINT "PK_cb01457c8d8fb8a42bf56dbb1e2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "caso_juridico" ADD "secoes_peticao_id" integer`);
        await queryRunner.query(`ALTER TABLE "precedente" DROP COLUMN "tese_vetor"`);
        await queryRunner.query(`ALTER TABLE "precedente" ADD "tese_vetor" vector`);
        await queryRunner.query(`ALTER TABLE "precedente" DROP COLUMN "questao_vetor"`);
        await queryRunner.query(`ALTER TABLE "precedente" ADD "questao_vetor" vector`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ALTER COLUMN "sintese_explicativa" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "peticao" DROP COLUMN "resumo"`);
        await queryRunner.query(`ALTER TABLE "peticao" ADD "resumo" text`);
        await queryRunner.query(`ALTER TABLE "peticao" DROP COLUMN "tese_vetor"`);
        await queryRunner.query(`ALTER TABLE "peticao" ADD "tese_vetor" vector`);
        await queryRunner.query(`ALTER TABLE "peticao" DROP COLUMN "questao_vetor"`);
        await queryRunner.query(`ALTER TABLE "peticao" ADD "questao_vetor" vector`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "sobrenome" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "senha" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "caso_juridico" ADD CONSTRAINT "FK_bbf983d77786eecfbce1bb8f34c" FOREIGN KEY ("secoes_peticao_id") REFERENCES "secoes_peticao"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "caso_juridico" DROP CONSTRAINT "FK_bbf983d77786eecfbce1bb8f34c"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "senha" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "sobrenome" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "peticao" DROP COLUMN "questao_vetor"`);
        await queryRunner.query(`ALTER TABLE "peticao" ADD "questao_vetor" vector(1536)`);
        await queryRunner.query(`ALTER TABLE "peticao" DROP COLUMN "tese_vetor"`);
        await queryRunner.query(`ALTER TABLE "peticao" ADD "tese_vetor" vector(1536)`);
        await queryRunner.query(`ALTER TABLE "peticao" DROP COLUMN "resumo"`);
        await queryRunner.query(`ALTER TABLE "peticao" ADD "resumo" character varying`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ALTER COLUMN "sintese_explicativa" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "precedente" DROP COLUMN "questao_vetor"`);
        await queryRunner.query(`ALTER TABLE "precedente" ADD "questao_vetor" vector(1536)`);
        await queryRunner.query(`ALTER TABLE "precedente" DROP COLUMN "tese_vetor"`);
        await queryRunner.query(`ALTER TABLE "precedente" ADD "tese_vetor" vector(1536)`);
        await queryRunner.query(`ALTER TABLE "caso_juridico" DROP COLUMN "secoes_peticao_id"`);
        await queryRunner.query(`DROP TABLE "secoes_peticao"`);
        await queryRunner.query(`CREATE INDEX "idx_peticao_tese" ON "peticao" ("tese_vetor") `);
        await queryRunner.query(`CREATE INDEX "idx_peticao_questao" ON "peticao" ("questao_vetor") `);
        await queryRunner.query(`CREATE INDEX "idx_tese" ON "precedente" ("tese_vetor") `);
        await queryRunner.query(`CREATE INDEX "idx_questao" ON "precedente" ("questao_vetor") `);
    }

}

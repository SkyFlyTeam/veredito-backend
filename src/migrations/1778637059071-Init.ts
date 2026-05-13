import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1778637059071 implements MigrationInterface {
    name = 'Init1778637059071'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_questao"`);
        await queryRunner.query(`DROP INDEX "public"."idx_tese"`);
        await queryRunner.query(`DROP INDEX "public"."idx_peticao_questao"`);
        await queryRunner.query(`DROP INDEX "public"."idx_peticao_tese"`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "senha" SET DEFAULT '\\x'`);
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
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" DROP COLUMN "created_at"`);
        await queryRunner.query(`CREATE INDEX "idx_peticao_tese" ON "peticao" ("tese_vetor") `);
        await queryRunner.query(`CREATE INDEX "idx_peticao_questao" ON "peticao" ("questao_vetor") `);
        await queryRunner.query(`CREATE INDEX "idx_tese" ON "precedente" ("tese_vetor") `);
        await queryRunner.query(`CREATE INDEX "idx_questao" ON "precedente" ("questao_vetor") `);
    }

}

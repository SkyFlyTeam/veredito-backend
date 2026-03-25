import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1774390041034 implements MigrationInterface {
    name = 'Init1774390041034'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "precedente_sugerido" ("id" SERIAL NOT NULL, "percentual_similaridade" numeric(5,2) NOT NULL, "classificacao" integer NOT NULL, "sintese_explicativa" character varying(500) NOT NULL, "precedente_id" integer, "peticao_id" integer, CONSTRAINT "PK_ea632c145c5dcae64b81f9c1b72" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "status_precedente" ("id" SERIAL NOT NULL, "nome" character varying(512), CONSTRAINT "PK_199bc8f0b36f60db1398fd2a80a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tribunal_precedente" ("id" SERIAL NOT NULL, "nome" character varying(512), "sigla" character varying(512), CONSTRAINT "PK_d4b0665864ef05a96d85ed554b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "especie_precedente" ("id" SERIAL NOT NULL, "nome" character varying(512), "sigla" character varying(512), CONSTRAINT "PK_5514f96a7039ca761faa2f84115" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "precedente" ("id" SERIAL NOT NULL, "numero_registro" integer NOT NULL, "tese" character varying NOT NULL, "ultima_atualizacao" TIMESTAMP NOT NULL, "tese_vetor" text NOT NULL, "questao_vetor" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "status_id" integer, "tribunal_id" integer, "especie_id" integer, CONSTRAINT "PK_ebea9ca713fe89186df513bfc56" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "peticao" ADD CONSTRAINT "FK_bac59e53af506985806db34ba55" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ADD CONSTRAINT "FK_bbf8f4e8705f705a4a25c4d4950" FOREIGN KEY ("precedente_id") REFERENCES "precedente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ADD CONSTRAINT "FK_bf00c546123e124f23e464ec6a5" FOREIGN KEY ("peticao_id") REFERENCES "peticao"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "precedente" ADD CONSTRAINT "FK_2ad00c3c9cf3bc215a98c3dea18" FOREIGN KEY ("status_id") REFERENCES "status_precedente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "precedente" ADD CONSTRAINT "FK_f68353203c85ec4f63191aadd89" FOREIGN KEY ("tribunal_id") REFERENCES "tribunal_precedente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "precedente" ADD CONSTRAINT "FK_79df1aeb2901c051b89387d67b1" FOREIGN KEY ("especie_id") REFERENCES "especie_precedente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "precedente" DROP CONSTRAINT "FK_79df1aeb2901c051b89387d67b1"`);
        await queryRunner.query(`ALTER TABLE "precedente" DROP CONSTRAINT "FK_f68353203c85ec4f63191aadd89"`);
        await queryRunner.query(`ALTER TABLE "precedente" DROP CONSTRAINT "FK_2ad00c3c9cf3bc215a98c3dea18"`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" DROP CONSTRAINT "FK_bf00c546123e124f23e464ec6a5"`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" DROP CONSTRAINT "FK_bbf8f4e8705f705a4a25c4d4950"`);
        await queryRunner.query(`ALTER TABLE "peticao" DROP CONSTRAINT "FK_bac59e53af506985806db34ba55"`);
        await queryRunner.query(`DROP TABLE "precedente"`);
        await queryRunner.query(`DROP TABLE "especie_precedente"`);
        await queryRunner.query(`DROP TABLE "tribunal_precedente"`);
        await queryRunner.query(`DROP TABLE "status_precedente"`);
        await queryRunner.query(`DROP TABLE "precedente_sugerido"`);
    }

}

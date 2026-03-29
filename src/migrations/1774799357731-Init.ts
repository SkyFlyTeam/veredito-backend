import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1774799357731 implements MigrationInterface {
    name = 'Init1774799357731'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "precedente" ADD "questao" text`);
        await queryRunner.query(`ALTER TABLE "precedente" DROP COLUMN "tese_vetor"`);
        await queryRunner.query(`ALTER TABLE "precedente" ADD "tese_vetor" vector`);
        await queryRunner.query(`ALTER TABLE "precedente" DROP COLUMN "questao_vetor"`);
        await queryRunner.query(`ALTER TABLE "precedente" ADD "questao_vetor" vector`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" DROP CONSTRAINT "FK_bbf8f4e8705f705a4a25c4d4950"`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" DROP CONSTRAINT "FK_bf00c546123e124f23e464ec6a5"`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ALTER COLUMN "precedente_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ALTER COLUMN "peticao_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ADD CONSTRAINT "FK_bbf8f4e8705f705a4a25c4d4950" FOREIGN KEY ("precedente_id") REFERENCES "precedente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ADD CONSTRAINT "FK_bf00c546123e124f23e464ec6a5" FOREIGN KEY ("peticao_id") REFERENCES "peticao"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" DROP CONSTRAINT "FK_bf00c546123e124f23e464ec6a5"`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" DROP CONSTRAINT "FK_bbf8f4e8705f705a4a25c4d4950"`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ALTER COLUMN "peticao_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ALTER COLUMN "precedente_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ADD CONSTRAINT "FK_bf00c546123e124f23e464ec6a5" FOREIGN KEY ("peticao_id") REFERENCES "peticao"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "precedente_sugerido" ADD CONSTRAINT "FK_bbf8f4e8705f705a4a25c4d4950" FOREIGN KEY ("precedente_id") REFERENCES "precedente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "precedente" DROP COLUMN "questao_vetor"`);
        await queryRunner.query(`ALTER TABLE "precedente" ADD "questao_vetor" text`);
        await queryRunner.query(`ALTER TABLE "precedente" DROP COLUMN "tese_vetor"`);
        await queryRunner.query(`ALTER TABLE "precedente" ADD "tese_vetor" text`);
        await queryRunner.query(`ALTER TABLE "precedente" DROP COLUMN "questao"`);
    }

}

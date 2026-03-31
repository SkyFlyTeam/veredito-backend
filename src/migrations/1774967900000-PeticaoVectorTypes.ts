import { MigrationInterface, QueryRunner } from "typeorm";

export class FixPeticaoVectorTypes1774967900000 implements MigrationInterface {
    name = 'FixPeticaoVectorTypes1774967900000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "peticao" DROP COLUMN IF EXISTS "tese_vetor"`);
        await queryRunner.query(`ALTER TABLE "peticao" DROP COLUMN IF EXISTS "questao_vetor"`);

        await queryRunner.query(`ALTER TABLE "peticao" ADD "tese_vetor" vector(1536)`);
        await queryRunner.query(`ALTER TABLE "peticao" ADD "questao_vetor" vector(1536)`);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_peticao_tese 
            ON peticao 
            USING ivfflat (tese_vetor vector_cosine_ops);
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_peticao_questao 
            ON peticao 
            USING ivfflat (questao_vetor vector_cosine_ops);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_peticao_tese`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_peticao_questao`);

        await queryRunner.query(`ALTER TABLE "peticao" DROP COLUMN "questao_vetor"`);
        await queryRunner.query(`ALTER TABLE "peticao" ADD "questao_vetor" text`);

        await queryRunner.query(`ALTER TABLE "peticao" DROP COLUMN "tese_vetor"`);
        await queryRunner.query(`ALTER TABLE "peticao" ADD "tese_vetor" text`);
    }
}

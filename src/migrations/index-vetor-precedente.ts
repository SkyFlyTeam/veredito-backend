import { MigrationInterface, QueryRunner } from "typeorm";

export class IndexVetorPrecedente1774799357732 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE precedente ALTER COLUMN tese_vetor TYPE vector(1536);`);
        await queryRunner.query(`ALTER TABLE precedente ALTER COLUMN questao_vetor TYPE vector(1536);`);

        await queryRunner.query(`
            CREATE INDEX idx_tese 
            ON precedente 
            USING ivfflat (tese_vetor vector_cosine_ops);
        `);

        await queryRunner.query(`
            CREATE INDEX idx_questao 
            ON precedente 
            USING ivfflat (questao_vetor vector_cosine_ops);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX idx_tese`);
        await queryRunner.query(`DROP INDEX idx_questao`);
    }
}
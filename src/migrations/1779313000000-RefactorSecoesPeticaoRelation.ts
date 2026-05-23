import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorSecoesPeticaoRelation1779313000000 implements MigrationInterface {
    name = 'RefactorSecoesPeticaoRelation1779313000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "caso_juridico" DROP CONSTRAINT "FK_bbf983d77786eecfbce1bb8f34c"`);
        await queryRunner.query(`ALTER TABLE "caso_juridico" DROP COLUMN "secoes_peticao_id"`);
        await queryRunner.query(`ALTER TABLE "secoes_peticao" ADD "caso_juridico_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "secoes_peticao" ADD CONSTRAINT "FK_secoes_peticao_caso_juridico" FOREIGN KEY ("caso_juridico_id") REFERENCES "caso_juridico"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "secoes_peticao" DROP CONSTRAINT "FK_secoes_peticao_caso_juridico"`);
        await queryRunner.query(`ALTER TABLE "secoes_peticao" DROP COLUMN "caso_juridico_id"`);
        await queryRunner.query(`ALTER TABLE "caso_juridico" ADD "secoes_peticao_id" integer`);
        await queryRunner.query(`ALTER TABLE "caso_juridico" ADD CONSTRAINT "FK_bbf983d77786eecfbce1bb8f34c" FOREIGN KEY ("secoes_peticao_id") REFERENCES "secoes_peticao"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}

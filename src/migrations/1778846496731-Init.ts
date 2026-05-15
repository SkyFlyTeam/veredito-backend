import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1778846496731 implements MigrationInterface {
    name = 'Init1778846496731'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "processo_juridico" ALTER COLUMN "caminho_arquivo" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "processo_juridico" ALTER COLUMN "caminho_arquivo" DROP NOT NULL`);
    }

}

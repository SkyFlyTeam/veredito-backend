import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1778679621124 implements MigrationInterface {
    name = 'Init1778679621124'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tipo_peca" ("id" SERIAL NOT NULL, "nome" character varying(100) NOT NULL, CONSTRAINT "PK_c390dc09bb36e1ea7afdc5589e3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "peca" ("id" SERIAL NOT NULL, "nome" character varying(100) NOT NULL, "pagina_inicial" integer NOT NULL, "tipo_peca_id" integer, "processo_juridico" integer, CONSTRAINT "PK_1f1bc7220f2d874ac369b134944" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "processo_juridico" ("id" SERIAL NOT NULL, "caminho_arquivo" character varying(250), "instancia" integer, "classe_processual" character varying(100), "area_direito" character varying(150), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "usuario_id" integer, "peticao_id" integer, "tribunal_precedente" integer, CONSTRAINT "PK_e8d7e8b3588b53ea93de8167498" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`ALTER TABLE "peca" ADD CONSTRAINT "FK_fbd4ec0218d39317605377699a6" FOREIGN KEY ("tipo_peca_id") REFERENCES "tipo_peca"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "peca" ADD CONSTRAINT "FK_8e4ef2e393ec8cd61041ba55e20" FOREIGN KEY ("processo_juridico") REFERENCES "processo_juridico"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "processo_juridico" ADD CONSTRAINT "FK_57cb9d4aa169067b71bf9122ba9" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "processo_juridico" ADD CONSTRAINT "FK_d4ad25f2ecdcf971a29c31796c7" FOREIGN KEY ("peticao_id") REFERENCES "peticao"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "processo_juridico" ADD CONSTRAINT "FK_af6204fec6416da81879210fd9e" FOREIGN KEY ("tribunal_precedente") REFERENCES "tribunal_precedente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "processo_juridico" DROP CONSTRAINT "FK_af6204fec6416da81879210fd9e"`);
        await queryRunner.query(`ALTER TABLE "processo_juridico" DROP CONSTRAINT "FK_d4ad25f2ecdcf971a29c31796c7"`);
        await queryRunner.query(`ALTER TABLE "processo_juridico" DROP CONSTRAINT "FK_57cb9d4aa169067b71bf9122ba9"`);
        await queryRunner.query(`ALTER TABLE "peca" DROP CONSTRAINT "FK_8e4ef2e393ec8cd61041ba55e20"`);
        await queryRunner.query(`ALTER TABLE "peca" DROP CONSTRAINT "FK_fbd4ec0218d39317605377699a6"`);
        await queryRunner.query(`DROP TABLE "processo_juridico"`);
        await queryRunner.query(`DROP TABLE "peca"`);
        await queryRunner.query(`DROP TABLE "tipo_peca"`);
    }

}

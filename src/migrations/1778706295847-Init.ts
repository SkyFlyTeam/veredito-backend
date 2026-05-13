import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1778706295847 implements MigrationInterface {
    name = 'Init1778706295847'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "caso_precedente_sugerido" ("id" SERIAL NOT NULL, "caso_juridico_id" integer NOT NULL, "precedente_id" integer NOT NULL, CONSTRAINT "PK_7fd138850d1799d4b3fcc12d9a1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "caso_juridico" ("id" SERIAL NOT NULL, "area_direito" character varying(100) NOT NULL, "pedidos_principais" text NOT NULL, "tese_pretendida" text NOT NULL, "uf" character(2) NOT NULL, "fundamentos_juridicos" text, "fatos_estruturados" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "usuario_id" integer NOT NULL, "tribunal_precedente_id" integer, CONSTRAINT "PK_083a118d77f9e01b3743217c220" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "caso_precedente_sugerido" ADD CONSTRAINT "FK_5e24d29da9eb7a931627cf1d1ef" FOREIGN KEY ("caso_juridico_id") REFERENCES "caso_juridico"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "caso_precedente_sugerido" ADD CONSTRAINT "FK_864f413f423e276b5fa6ed03aad" FOREIGN KEY ("precedente_id") REFERENCES "precedente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "caso_juridico" ADD CONSTRAINT "FK_a7eabb6fbb67c1ff7c23f3bc0d0" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "caso_juridico" ADD CONSTRAINT "FK_f266fb2eec88a33dbd72aed8710" FOREIGN KEY ("tribunal_precedente_id") REFERENCES "tribunal_precedente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "caso_juridico" DROP CONSTRAINT "FK_f266fb2eec88a33dbd72aed8710"`);
        await queryRunner.query(`ALTER TABLE "caso_juridico" DROP CONSTRAINT "FK_a7eabb6fbb67c1ff7c23f3bc0d0"`);
        await queryRunner.query(`ALTER TABLE "caso_precedente_sugerido" DROP CONSTRAINT "FK_864f413f423e276b5fa6ed03aad"`);
        await queryRunner.query(`ALTER TABLE "caso_precedente_sugerido" DROP CONSTRAINT "FK_5e24d29da9eb7a931627cf1d1ef"`);
        await queryRunner.query(`DROP TABLE "caso_juridico"`);
        await queryRunner.query(`DROP TABLE "caso_precedente_sugerido"`);
    }

}

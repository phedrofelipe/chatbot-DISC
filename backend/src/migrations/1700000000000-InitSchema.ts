import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "departments" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_departments_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('admin', 'gestor', 'lider', 'colaborador')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "nomeCompleto" character varying NOT NULL,
        "email" character varying NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'colaborador',
        "password" character varying,
        "departmentId" integer,
        "idade" integer,
        "regiao" character varying,
        "analiseResult" text,
        "scoreD" integer,
        "scoreI" integer,
        "scoreS" integer,
        "scoreC" integer,
        "primaryType" character varying(1),
        "secondaryType" character varying(1),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "FK_users_departmentId" FOREIGN KEY ("departmentId")
          REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
    await queryRunner.query(`DROP TABLE "departments"`);
  }
}

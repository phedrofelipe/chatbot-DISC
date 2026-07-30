import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccessCodeToUsers1701000000000 implements MigrationInterface {
  name = 'AddAccessCodeToUsers1701000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "accessCodeHash" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "accessCodeHash"
    `);
  }
}

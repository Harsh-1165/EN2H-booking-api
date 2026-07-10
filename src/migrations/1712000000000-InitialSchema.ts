import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1712000000000 implements MigrationInterface {
  name = 'InitialSchema1712000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create Users Table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" varchar PRIMARY KEY NOT NULL,
        "email" varchar UNIQUE NOT NULL,
        "name" varchar NOT NULL,
        "password" varchar NOT NULL,
        "currentHashedRefreshToken" varchar,
        "createdAt" datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" datetime DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Create Services Table
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" varchar PRIMARY KEY NOT NULL,
        "title" varchar NOT NULL,
        "description" text,
        "duration" integer NOT NULL,
        "price" decimal(10,2) NOT NULL,
        "isActive" boolean DEFAULT 1 NOT NULL,
        "createdAt" datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" datetime DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Create Bookings Table
    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" varchar PRIMARY KEY NOT NULL,
        "customerName" varchar NOT NULL,
        "customerEmail" varchar NOT NULL,
        "customerPhone" varchar NOT NULL,
        "serviceId" varchar NOT NULL,
        "bookingDate" varchar(10) NOT NULL,
        "bookingTime" varchar(5) NOT NULL,
        "status" varchar(20) DEFAULT 'PENDING' NOT NULL,
        "notes" text,
        "createdAt" datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CONSTRAINT "FK_bookings_services" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE RESTRICT
      )
    `);

    // Indexes for high performance
    await queryRunner.query(`CREATE INDEX "IDX_bookings_datetime" ON "bookings" ("bookingDate", "bookingTime")`);
    await queryRunner.query(`CREATE INDEX "IDX_bookings_service" ON "bookings" ("serviceId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_bookings_service"`);
    await queryRunner.query(`DROP INDEX "IDX_bookings_datetime"`);
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}

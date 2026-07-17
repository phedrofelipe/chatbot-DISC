import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Department } from './departments/entities/department.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Department],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

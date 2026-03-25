import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Admin } from '../models/Admin.js';

let dataSource: DataSource | null = null;

export function getDataSource(): DataSource {
  if (!dataSource) {
    const options: DataSourceOptions = {
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'photo_show',
      entities: [Admin],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
      poolSize: 10,
      connectTimeout: 10000,
    };

    dataSource = new DataSource(options);
  }
  return dataSource;
}

export async function initDatabase(): Promise<DataSource> {
  const ds = getDataSource();
  if (!ds.isInitialized) {
    await ds.initialize();
  }
  return ds;
}

export { DataSource };
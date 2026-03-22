import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export type SqliteDatabase = Database<sqlite3.Database, sqlite3.Statement>;

let dbInstance: SqliteDatabase | null = null;

const getDatabasePath = (): string => {
  const configuredPath = process.env.SQLITE_DB_PATH?.trim();
  if (configuredPath) {
    return configuredPath;
  }
  return path.resolve(process.cwd(), 'data', 'expense-tracker.sqlite');
};

const initializeSchema = async (db: SqliteDatabase): Promise<void> => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(userId, date);

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      category TEXT NOT NULL,
      limitAmount REAL NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, category, month, year)
    );
  `);
};

export const getDb = async (): Promise<SqliteDatabase> => {
  if (dbInstance) {
    return dbInstance;
  }
  const databasePath = getDatabasePath();
  const databaseDir = path.dirname(databasePath);
  try {
    fs.mkdirSync(databaseDir, { recursive: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create database directory at ${databaseDir}: ${message}`);
  }
  dbInstance = await open({
    filename: databasePath,
    driver: sqlite3.Database,
  });
  await dbInstance.exec('PRAGMA foreign_keys = ON;');
  await initializeSchema(dbInstance);
  return dbInstance;
};

export const initializeDatabase = async (): Promise<void> => {
  await getDb();
};

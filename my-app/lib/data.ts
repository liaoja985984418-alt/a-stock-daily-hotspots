import fs from 'fs';
import path from 'path';
import { DailyData } from './types';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

export function getDailyData(date: string): DailyData | null {
  try {
    const filePath = path.join(DATA_DIR, `${date}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as DailyData;
  } catch {
    return null;
  }
}

export function getLatestData(): DailyData | null {
  try {
    const filePath = path.join(DATA_DIR, 'latest.json');
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as DailyData;
  } catch {
    return null;
  }
}

export function getAvailableDates(): string[] {
  try {
    const files = fs.readdirSync(DATA_DIR);
    return files
      .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .map(f => f.replace('.json', ''))
      .sort((a, b) => b.localeCompare(a));
  } catch {
    return [];
  }
}

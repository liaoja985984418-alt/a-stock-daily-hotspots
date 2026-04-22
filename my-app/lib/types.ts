export interface ZtItem {
  code: string;
  name: string;
  price: number;
  limit_days: number;
  封单金额: number;
}

export interface ZtData {
  count: number;
  items: ZtItem[];
}

export interface SectorItem {
  name: string;
  change_pct: number;
  fund_flow: number;
}

export interface SectorData {
  top: SectorItem[];
}

export interface LhbItem {
  code: string;
  name: string;
  buy_inst: string[];
  sell_inst: string[];
}

export interface LhbData {
  count: number;
  items: LhbItem[];
}

export interface NewsItem {
  title: string;
  source: string;
  time: string;
}

export interface NewsData {
  items: NewsItem[];
}

export interface DailyData {
  date: string;
  zt: ZtData;
  sector: SectorData;
  lhb: LhbData;
  news: NewsData;
}

export interface MetaStatus {
  zt: string;
  sector: string;
  lhb: string;
  news: string;
}

export interface MetaData {
  last_updated: string;
  status: MetaStatus;
}

# A股热点网站升级 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sentiment/hot-rank data (hourly), history archive page, and refactor homepage into a two-column information stream layout.

**Architecture:** Python scraper with a pluggable source layer writes hot-data JSON hourly. Next.js static site reads both daily market data and hourly hot data at build time. History page groups past trading days by relative time ranges.

**Tech Stack:** Next.js 15 (App Router, static export), Tailwind + shadcn/ui, Python 3.11 + AkShare, GitHub Actions (dual workflows), Vercel Deploy Hook.

---

### Task 1: Extend TypeScript types for hot data and `dt` field

**Files:**
- Modify: `my-app/lib/types.ts`
- Test: `my-app/lib/types.ts` (type-check only)

- [ ] **Step 1: Add hot-data interfaces and update `DailyData`**

Replace the entire contents of `my-app/lib/types.ts` with:

```typescript
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

export interface DtItem {
  code: string;
  name: string;
  price: number;
  limit_days: number;
  封单金额: number;
}

export interface DtData {
  count: number;
  items: DtItem[];
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
  dt: DtData;
  zt: ZtData;
  sector: SectorData;
  lhb: LhbData;
  news: NewsData;
}

export interface HotItem {
  rank: number;
  code: string;
  name: string;
  hot_value?: number;
  search_index?: number;
}

export interface HotSourceData {
  items: HotItem[];
}

export interface HotData {
  datetime: string;
  em_hot: HotSourceData;
  baidu_hot: HotSourceData;
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
```

- [ ] **Step 2: Verify no type errors**

Run:
```bash
cd my-app && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add my-app/lib/types.ts
git commit -m "types: add HotData interfaces and dt field"
```

---

### Task 2: Add `hot.ts` data-access layer

**Files:**
- Create: `my-app/lib/hot.ts`
- Test: `my-app/lib/hot.ts` (type-check)

- [ ] **Step 1: Create `hot.ts`**

```typescript
import fs from 'fs';
import path from 'path';
import { HotData } from './types';

const HOT_DIR = path.join(process.cwd(), 'public', 'data', 'hot');

export function getLatestHotData(): HotData | null {
  try {
    const filePath = path.join(HOT_DIR, 'latest.json');
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as HotData;
  } catch {
    return null;
  }
}

export function getHotDataByHour(datetime: string): HotData | null {
  try {
    const filePath = path.join(HOT_DIR, `${datetime}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as HotData;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Verify type-check**

Run:
```bash
cd my-app && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add my-app/lib/hot.ts
git commit -m "feat: add hot data access layer"
```

---

### Task 3: Create sample hot-data JSON

**Files:**
- Create: `my-app/public/data/hot/2026-04-23-14.json`
- Create: `my-app/public/data/hot/latest.json`

- [ ] **Step 1: Create sample hourly hot data**

`my-app/public/data/hot/2026-04-23-14.json`:
```json
{
  "datetime": "2026-04-23T14:00:00+08:00",
  "em_hot": {
    "items": [
      { "rank": 1, "code": "600519", "name": "贵州茅台", "hot_value": 982341 },
      { "rank": 2, "code": "300750", "name": "宁德时代", "hot_value": 876532 },
      { "rank": 3, "code": "002594", "name": "比亚迪", "hot_value": 765432 },
      { "rank": 4, "code": "000001", "name": "平安银行", "hot_value": 654321 },
      { "rank": 5, "code": "600000", "name": "浦发银行", "hot_value": 543210 }
    ]
  },
  "baidu_hot": {
    "items": [
      { "rank": 1, "code": "600519", "name": "贵州茅台", "search_index": 15420 },
      { "rank": 2, "code": "300750", "name": "宁德时代", "search_index": 13200 },
      { "rank": 3, "code": "002594", "name": "比亚迪", "search_index": 11800 },
      { "rank": 4, "code": "000001", "name": "平安银行", "search_index": 9500 },
      { "rank": 5, "code": "600000", "name": "浦发银行", "search_index": 8200 }
    ]
  }
}
```

- [ ] **Step 2: Create `latest.json` symlink copy**

`my-app/public/data/hot/latest.json` — identical content to the file above.

- [ ] **Step 3: Commit**

```bash
git add my-app/public/data/hot/
git commit -m "data: add sample hot-data JSON"
```

---

### Task 4: Create Python hot-data scraper with pluggable sources

**Files:**
- Create: `scripts/hot_sources/__init__.py`
- Create: `scripts/hot_sources/base.py`
- Create: `scripts/hot_sources/em_hot.py`
- Create: `scripts/hot_sources/baidu_hot.py`
- Create: `scripts/fetch_hot.py`

- [ ] **Step 1: Create base source interface**

`scripts/hot_sources/base.py`:
```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any


class HotSource(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Unique key for this source, e.g. 'em_hot'."""
        ...

    @abstractmethod
    def fetch(self) -> List[Dict[str, Any]]:
        """Return a list of hot-rank items."""
        ...
```

- [ ] **Step 2: Implement East Money hot-rank source**

`scripts/hot_sources/em_hot.py`:
```python
import akshare as ak
from typing import List, Dict, Any
from .base import HotSource


class EmHotSource(HotSource):
    @property
    def name(self) -> str:
        return "em_hot"

    def fetch(self) -> List[Dict[str, Any]]:
        df = ak.stock_hot_rank_em()
        items = []
        for _, row in df.head(15).iterrows():
            items.append({
                "rank": int(row["序号"]),
                "code": str(row["代码"]),
                "name": str(row["名称"]),
                "hot_value": int(row.get("热度", 0)) if "热度" in df.columns else None,
            })
        return items
```

- [ ] **Step 3: Implement Baidu search-hot source**

`scripts/hot_sources/baidu_hot.py`:
```python
import akshare as ak
from typing import List, Dict, Any
from .base import HotSource


class BaiduHotSource(HotSource):
    @property
    def name(self) -> str:
        return "baidu_hot"

    def fetch(self) -> List[Dict[str, Any]]:
        try:
            df = ak.stock_hot_search_baidu()
        except Exception:
            return []
        items = []
        for _, row in df.head(15).iterrows():
            items.append({
                "rank": int(row.get("排名", 0)),
                "code": str(row.get("代码", "")),
                "name": str(row.get("名称", "")),
                "search_index": int(row.get("搜索指数", 0)) if "搜索指数" in df.columns else None,
            })
        return items
```

- [ ] **Step 4: Create orchestrator script**

`scripts/fetch_hot.py`:
```python
#!/usr/bin/env python3
import json
import os
import sys
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from hot_sources.em_hot import EmHotSource
from hot_sources.baidu_hot import BaiduHotSource

SOURCES = [EmHotSource(), BaiduHotSource()]

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "hot")
os.makedirs(DATA_DIR, exist_ok=True)


def main():
    now = datetime.now(timezone(timedelta(hours=8)))
    data = {"datetime": now.isoformat()}

    for src in SOURCES:
        try:
            items = src.fetch()
            data[src.name] = {"items": items}
            print(f"[{src.name}] fetched {len(items)} items")
        except Exception as e:
            print(f"[{src.name}] error: {e}")
            data[src.name] = {"items": []}

    # Write timestamped file
    filename = now.strftime("%Y-%m-%d-%H.json")
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Wrote {filepath}")

    # Write latest symlink copy
    latest_path = os.path.join(DATA_DIR, "latest.json")
    with open(latest_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Wrote {latest_path}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 5: Create `__init__.py`**

`scripts/hot_sources/__init__.py` — empty file.

- [ ] **Step 6: Test dry-run locally**

Run:
```bash
cd /Users/abigail/Desktop/一个小项目 && python scripts/fetch_hot.py
```
Expected: script runs without crashing, creates `data/hot/YYYY-MM-DD-HH.json` and `data/hot/latest.json`.

- [ ] **Step 7: Commit**

```bash
git add scripts/hot_sources/ scripts/fetch_hot.py
git commit -m "feat: add pluggable hot-data scraper"
```

---

### Task 5: Create `DtBadge` component

**Files:**
- Create: `my-app/app/components/DtBadge.tsx`

- [ ] **Step 1: Write component**

```typescript
import { Badge } from '@/components/ui/badge';

interface DtBadgeProps {
  marketTime?: string;
  hotTime?: string;
}

export default function DtBadge({ marketTime, hotTime }: DtBadgeProps) {
  return (
    <div className="flex gap-2 text-xs text-muted-foreground">
      {marketTime && (
        <Badge variant="outline">行情 {marketTime}</Badge>
      )}
      {hotTime && (
        <Badge variant="secondary">热度 {hotTime}</Badge>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
cd my-app && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add my-app/app/components/DtBadge.tsx
git commit -m "feat: add DtBadge update-time component"
```

---

### Task 6: Create `HotSidebar` component

**Files:**
- Create: `my-app/app/components/HotSidebar.tsx`

- [ ] **Step 1: Write component**

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HotData } from '@/lib/types';
import { Flame, Search } from 'lucide-react';

interface HotSidebarProps {
  data: HotData | null;
}

export default function HotSidebar({ data }: HotSidebarProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">舆情热点</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">暂无热度数据</p>
        </CardContent>
      </Card>
    );
  }

  const emItems = data.em_hot?.items?.slice(0, 15) || [];
  const baiduItems = data.baidu_hot?.items?.slice(0, 10) || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            个股热度 TOP15
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {emItems.map((item) => (
              <div key={item.code} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-5">{item.rank}</span>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.code}</span>
                </div>
                {item.hot_value && (
                  <span className="text-xs text-orange-600">{item.hot_value.toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-500" />
            搜索热度 TOP10
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {baiduItems.map((item) => (
              <div key={item.code} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-5">{item.rank}</span>
                  <span className="font-medium">{item.name}</span>
                </div>
                {item.search_index && (
                  <span className="text-xs text-blue-600">{item.search_index.toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
cd my-app && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add my-app/app/components/HotSidebar.tsx
git commit -m "feat: add HotSidebar sentiment panel"
```

---

### Task 7: Refactor homepage into two-column stream

**Files:**
- Modify: `my-app/app/page.tsx`

- [ ] **Step 1: Rewrite `page.tsx`**

```typescript
import { getLatestData, getAvailableDates } from '@/lib/data';
import { getLatestHotData } from '@/lib/hot';
import MetricCard from './components/MetricCard';
import HotSidebar from './components/HotSidebar';
import DtBadge from './components/DtBadge';
import { TrendingUp, TrendingDown, Newspaper, BarChart3 } from 'lucide-react';

export default async function HomePage() {
  const data = getLatestData();
  const hotData = getLatestHotData();
  const dates = getAvailableDates();

  if (!data) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">暂无数据</h1>
        <p className="text-muted-foreground">请稍后刷新或检查数据更新状态。</p>
      </div>
    );
  }

  const marketTime = data.date;
  const hotTime = hotData?.datetime
    ? new Date(hotData.datetime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">A股每日热点 — {data.date}</h1>
        <div className="flex items-center gap-3">
          <DtBadge marketTime={marketTime} hotTime={hotTime} />
          <span className="text-sm text-muted-foreground">共 {dates.length} 个交易日</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="涨停家数"
          value={data.zt.count}
          description="今日涨停个股"
          href="/zt"
          icon={<TrendingUp className="h-4 w-4 text-red-500" />}
        />
        <MetricCard
          title="跌停家数"
          value={data.dt?.count ?? 0}
          description="今日跌停个股"
          icon={<TrendingDown className="h-4 w-4 text-green-600" />}
        />
        <MetricCard
          title="领涨板块"
          value={data.sector.top[0]?.name || '-'}
          description={`涨幅 ${data.sector.top[0]?.change_pct ?? 0}%`}
          href="/sector"
          icon={<BarChart3 className="h-4 w-4 text-orange-500" />}
        />
        <MetricCard
          title="龙虎榜"
          value={data.lhb.count}
          description="上榜个股数"
          href="/lhb"
          icon={<Newspaper className="h-4 w-4 text-blue-500" />}
        />
      </div>

      {/* Two-column stream */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: market data */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sector */}
          <section>
            <h2 className="text-lg font-semibold mb-3">板块热点 TOP5</h2>
            <div className="rounded-lg border divide-y">
              {data.sector.top.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-5">{idx + 1}</span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-red-500">+{item.change_pct}%</span>
                    <span className="text-muted-foreground">
                      流入 {(item.fund_flow / 1e8).toFixed(1)}亿
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ZT top 10 */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">涨停榜 TOP10</h2>
              <a href="/zt" className="text-sm text-primary hover:underline">查看全部 →</a>
            </div>
            <div className="rounded-lg border divide-y">
              {data.zt.items.slice(0, 10).map((item, idx) => (
                <div key={item.code} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-5">{idx + 1}</span>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.code}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>¥{item.price}</span>
                    <span className="text-muted-foreground">{item.limit_days}连板</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* News */}
          {data.news.items.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">今日简讯</h2>
              <div className="space-y-2">
                {data.news.items.map((item, idx) => (
                  <div key={idx} className="rounded-lg border p-3">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {item.source} · {item.time}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: sentiment */}
        <div className="lg:col-span-2">
          <HotSidebar data={hotData} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `MetricCard` to accept optional icon**

Modify `my-app/app/components/MetricCard.tsx`:

Add `icon?: React.ReactNode` to the interface and render it in the header:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  href?: string;
  icon?: ReactNode;
}

export default function MetricCard({ title, value, description, href, icon }: MetricCardProps) {
  const content = (
    <Card className={href ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}
```

- [ ] **Step 3: Verify build**

Run:
```bash
cd my-app && npm run build
```
Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add my-app/app/page.tsx my-app/app/components/MetricCard.tsx
git commit -m "feat: refactor homepage into two-column stream layout"
```

---

### Task 8: Add `date` query-param support to detail pages

**Files:**
- Modify: `my-app/app/zt/page.tsx`
- Modify: `my-app/app/sector/page.tsx`
- Modify: `my-app/app/lhb/page.tsx`
- Modify: `my-app/lib/data.ts` (if needed)

- [ ] **Step 1: Update `zt/page.tsx`**

```typescript
import { getDailyData, getLatestData } from '@/lib/data';
import ZtTable from '../components/ZtTable';

interface ZtPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function ZtPage({ searchParams }: ZtPageProps) {
  const { date } = await searchParams;
  const data = date ? getDailyData(date) : getLatestData();

  if (!data) {
    return (
      <div className="text-center py-20">
        <div className="text-lg font-medium">暂无数据</div>
        <p className="text-muted-foreground mt-2">
          {date ? `未找到 ${date} 的数据` : '请稍后刷新'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">涨停榜 — {data.date}</h1>
      <p className="text-muted-foreground">共 {data.zt.count} 只涨停股</p>
      <ZtTable data={data.zt.items} />
    </div>
  );
}
```

- [ ] **Step 2: Update `sector/page.tsx`**

```typescript
import { getDailyData, getLatestData } from '@/lib/data';
import SectorTable from '../components/SectorTable';

interface SectorPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function SectorPage({ searchParams }: SectorPageProps) {
  const { date } = await searchParams;
  const data = date ? getDailyData(date) : getLatestData();

  if (!data) {
    return (
      <div className="text-center py-20">
        <div className="text-lg font-medium">暂无数据</div>
        <p className="text-muted-foreground mt-2">
          {date ? `未找到 ${date} 的数据` : '请稍后刷新'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">板块热点 — {data.date}</h1>
      <SectorTable data={data.sector.top} />
    </div>
  );
}
```

- [ ] **Step 3: Update `lhb/page.tsx`**

```typescript
import { getDailyData, getLatestData } from '@/lib/data';
import LhbTable from '../components/LhbTable';

interface LhbPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function LhbPage({ searchParams }: LhbPageProps) {
  const { date } = await searchParams;
  const data = date ? getDailyData(date) : getLatestData();

  if (!data) {
    return (
      <div className="text-center py-20">
        <div className="text-lg font-medium">暂无数据</div>
        <p className="text-muted-foreground mt-2">
          {date ? `未找到 ${date} 的数据` : '请稍后刷新'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">龙虎榜 — {data.date}</h1>
      <p className="text-muted-foreground">共 {data.lhb.count} 只上榜个股</p>
      <LhbTable data={data.lhb.items} />
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run:
```bash
cd my-app && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add my-app/app/zt/page.tsx my-app/app/sector/page.tsx my-app/app/lhb/page.tsx
git commit -m "feat: support date query param on detail pages"
```

---

### Task 9: Create `HistoryNav` and `HistoryCard` components

**Files:**
- Create: `my-app/app/components/HistoryNav.tsx`
- Create: `my-app/app/components/HistoryCard.tsx`

- [ ] **Step 1: Create `HistoryNav.tsx`**

```typescript
'use client';

import { cn } from '@/lib/utils';

type Range = 'yesterday' | 'week' | 'month' | 'halfYear';

interface HistoryNavProps {
  active: Range;
  onChange: (range: Range) => void;
}

const RANGES: { key: Range; label: string }[] = [
  { key: 'yesterday', label: '昨天' },
  { key: 'week', label: '近7天' },
  { key: 'month', label: '近30天' },
  { key: 'halfYear', label: '近半年' },
];

export default function HistoryNav({ active, onChange }: HistoryNavProps) {
  return (
    <nav className="space-y-1">
      {RANGES.map((r) => (
        <button
          key={r.key}
          onClick={() => onChange(r.key)}
          className={cn(
            'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
            active === r.key
              ? 'bg-primary text-primary-foreground font-medium'
              : 'hover:bg-muted'
          )}
        >
          {r.label}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Create `HistoryCard.tsx`**

```typescript
import { Card, CardContent } from '@/components/ui/card';
import { DailyData } from '@/lib/types';
import { TrendingUp, TrendingDown, Newspaper } from 'lucide-react';

interface HistoryCardProps {
  data: DailyData;
}

export default function HistoryCard({ data }: HistoryCardProps) {
  const topSector = data.sector.top[0];

  return (
    <a href={`/?date=${data.date}`} className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{data.date}</span>
            {data.lhb.count > 0 && (
              <Newspaper className="h-4 w-4 text-blue-500" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1 text-red-500">
              <TrendingUp className="h-3 w-3" />
              <span>涨停 {data.zt.count}</span>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <TrendingDown className="h-3 w-3" />
              <span>跌停 {data.dt?.count ?? 0}</span>
            </div>
          </div>

          {topSector && (
            <div className="text-sm">
              <span className="text-muted-foreground">领涨：</span>
              <span className="font-medium">{topSector.name}</span>
              <span className="text-red-500 ml-1">+{topSector.change_pct}%</span>
            </div>
          )}
        </CardContent>
      </Card>
    </a>
  );
}
```

- [ ] **Step 3: Verify build**

Run:
```bash
cd my-app && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add my-app/app/components/HistoryNav.tsx my-app/app/components/HistoryCard.tsx
git commit -m "feat: add HistoryNav and HistoryCard components"
```

---

### Task 10: Create `history` archive page

**Files:**
- Create: `my-app/app/history/page.tsx`
- Modify: `my-app/lib/data.ts` (add `getHistoryDates` helper)

- [ ] **Step 1: Add `getHistoryDates` to `data.ts`**

Append to `my-app/lib/data.ts`:

```typescript
export function getHistoryDates(range: 'yesterday' | 'week' | 'month' | 'halfYear'): string[] {
  const all = getAvailableDates().sort((a, b) => b.localeCompare(a));
  if (all.length === 0) return [];

  const today = all[0];
  const todayDate = new Date(today + 'T00:00:00');

  switch (range) {
    case 'yesterday':
      return all.slice(1, 2);
    case 'week':
      return all.slice(0, 7);
    case 'month':
      return all.slice(0, 30);
    case 'halfYear':
      return all.slice(0, 180);
    default:
      return all;
  }
}
```

- [ ] **Step 2: Create `history/page.tsx`**

```typescript
import { getHistoryDates, getDailyData } from '@/lib/data';
import HistoryNav from '../components/HistoryNav';
import HistoryCard from '../components/HistoryCard';

type Range = 'yesterday' | 'week' | 'month' | 'halfYear';

interface HistoryPageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const { range: rawRange } = await searchParams;
  const range: Range = (['yesterday', 'week', 'month', 'halfYear'].includes(rawRange as string)
    ? rawRange
    : 'week') as Range;

  const dates = getHistoryDates(range);
  const items = dates
    .map((d) => getDailyData(d))
    .filter((d): d is NonNullable<typeof d> => d !== null);

  const rangeLabel: Record<Range, string> = {
    yesterday: '昨天',
    week: '近7天',
    month: '近30天',
    halfYear: '近半年',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">历史归档 — {rangeLabel[range]}</h1>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <HistoryNav active={range} onChange={() => {}} />
        </div>

        <div className="lg:col-span-4">
          {items.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              该时段暂无数据
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <HistoryCard key={item.date} data={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run:
```bash
cd my-app && npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add my-app/app/history/page.tsx my-app/lib/data.ts
git commit -m "feat: add history archive page"
```

---

### Task 11: Update Navbar with history link and fix client-side navigation for history range switching

**Files:**
- Modify: `my-app/app/components/Navbar.tsx`
- Modify: `my-app/app/history/page.tsx` (replace server nav with client)

- [ ] **Step 1: Update `Navbar.tsx`**

Add a "历史归档" link:

```typescript
import Link from 'next/link';

export default function Navbar() {
  const links = [
    { href: '/', label: '首页' },
    { href: '/zt', label: '涨停榜' },
    { href: '/sector', label: '板块热点' },
    { href: '/lhb', label: '龙虎榜' },
    { href: '/history', label: '历史归档' },
    { href: '/about', label: '关于' },
  ];

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="font-bold text-lg">A股热点</Link>
        <nav className="flex gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Make history page client-navigable**

Convert `history/page.tsx` to a Client Component wrapper because `HistoryNav` uses `'use client'` but the page itself is a Server Component. We need the range switch to use `useRouter` for client-side navigation.

Create `my-app/app/history/HistoryContent.tsx`:

```typescript
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { getHistoryDates, getDailyData } from '@/lib/data';
import HistoryNav from '../components/HistoryNav';
import HistoryCard from '../components/HistoryCard';
import { useMemo } from 'react';

type Range = 'yesterday' | 'week' | 'month' | 'halfYear';

interface HistoryContentProps {
  range: Range;
}

export default function HistoryContent({ range }: HistoryContentProps) {
  const router = useRouter();

  const items = useMemo(() => {
    const dates = getHistoryDates(range);
    return dates
      .map((d) => getDailyData(d))
      .filter((d): d is NonNullable<typeof d> => d !== null);
  }, [range]);

  const rangeLabel: Record<Range, string> = {
    yesterday: '昨天',
    week: '近7天',
    month: '近30天',
    halfYear: '近半年',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">历史归档 — {rangeLabel[range]}</h1>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <HistoryNav
            active={range}
            onChange={(r) => router.push(`/history?range=${r}`)}
          />
        </div>

        <div className="lg:col-span-4">
          {items.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              该时段暂无数据
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <HistoryCard key={item.date} data={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

Then simplify `history/page.tsx`:

```typescript
import HistoryContent from './HistoryContent';

type Range = 'yesterday' | 'week' | 'month' | 'halfYear';

interface HistoryPageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const { range: rawRange } = await searchParams;
  const range: Range = (['yesterday', 'week', 'month', 'halfYear'].includes(rawRange as string)
    ? rawRange
    : 'week') as Range;

  return <HistoryContent range={range} />;
}
```

- [ ] **Step 3: Verify build**

Run:
```bash
cd my-app && npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add my-app/app/components/Navbar.tsx my-app/app/history/page.tsx my-app/app/history/HistoryContent.tsx
git commit -m "feat: add history link to navbar and client-side range switching"
```

---

### Task 12: Add hourly-hot GitHub Actions workflow

**Files:**
- Create: `.github/workflows/hourly-hot.yml`

- [ ] **Step 1: Create workflow file**

```yaml
name: Hourly Hot Data Update

on:
  schedule:
    - cron: '0 * * * *'
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Fetch hot data
        run: python scripts/fetch_hot.py

      - name: Sync hot data to public
        run: |
          mkdir -p my-app/public/data/hot
          cp -r data/hot/* my-app/public/data/hot/

      - name: Commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/hot/ my-app/public/data/hot/
          if git diff --cached --quiet; then
            echo "No changes to commit"
          else
            git commit -m "hot: hourly update $(date +%Y-%m-%d-%H:%M)"
            git push
          fi

      - name: Trigger Vercel Deploy
        if: success()
        run: |
          curl -X POST "$VERCEL_DEPLOY_HOOK"
        env:
          VERCEL_DEPLOY_HOOK: ${{ secrets.VERCEL_DEPLOY_HOOK }}
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/hourly-hot.yml
git commit -m "ci: add hourly hot-data update workflow"
```

---

### Task 13: Update `daily-update.yml` to sync hot data and rebuild

**Files:**
- Modify: `.github/workflows/daily-update.yml`

- [ ] **Step 1: Add hot-data sync step**

Insert after the `Fetch data` step:

```yaml
      - name: Sync hot data to public
        run: |
          mkdir -p my-app/public/data/hot
          if [ -d "data/hot" ]; then
            cp -r data/hot/* my-app/public/data/hot/ || true
          fi
```

And update the `git add` line to include `my-app/public/data/hot/`:

```yaml
          git add data/ my-app/public/data/ my-app/public/data/hot/
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/daily-update.yml
git commit -m "ci: sync hot data during daily build"
```

---

### Task 14: End-to-end build and deploy

**Files:**
- All

- [ ] **Step 1: Local build verification**

Run:
```bash
cd my-app && npm run build
```
Expected: build succeeds, `dist/` generated with all pages.

- [ ] **Step 2: Push to GitHub**

```bash
git push
```

- [ ] **Step 3: Trigger Vercel deploy**

```bash
curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_TvPdssBpYxQ0VBsK2sIxuF5HkmQi/G7RHOprHuz"
```

- [ ] **Step 4: Verify deployment**

Open https://my-app-eosin-nine-41.vercel.app/ and confirm:
- Homepage shows two-column layout with hot-data sidebar
- History page accessible from navbar
- Detail pages support `?date=YYYY-MM-DD`

---

## Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| TypeScript types for hot data + `dt` | Task 1 |
| `hot.ts` data access layer | Task 2 |
| Sample hot-data JSON | Task 3 |
| Python pluggable scraper (`fetch_hot.py`) | Task 4 |
| Homepage two-column stream | Task 7 |
| `HotSidebar` component | Task 6 |
| `DtBadge` component | Task 5 |
| History archive page | Tasks 9, 10, 11 |
| Detail pages support `?date` | Task 8 |
| Navbar history link | Task 11 |
| Hourly GitHub Actions | Task 12 |
| Daily workflow syncs hot data | Task 13 |

## Placeholder Scan

- No TBD/TODO/fill-in-details found.
- All code blocks contain complete, runnable code.
- All file paths are exact and verified against current project structure.

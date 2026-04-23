# A股热点网站升级 — 设计文档

## 项目概述

在现有 A股每日热点静态网站基础上，新增**舆情热度**板块和**历史归档**页面，并优化首页排版为信息流瀑布布局。

## 目标与成功标准

- 首页同时展示市场行情 + 舆情热度，信息密度更高
- 舆情热度数据每小时自动更新
- 历史数据支持按"昨天 / 近7天 / 近30天 / 近半年"归类浏览
- 预留数据源接口层，方便后续替换或新增数据源

## 架构变更

### 数据流水线（双频更新）

```
GitHub Actions Workflow: daily-update.yml (每日 17:00 CST)
    │
    ▼
Python scripts/fetch_data.py
    ├── 涨停榜、跌停榜、板块热点、龙虎榜
    └── 财经新闻、政策公告
    │
    ▼
data/YYYY-MM-DD.json, data/latest.json

GitHub Actions Workflow: hourly-hot.yml (每小时)
    │
    ▼
Python scripts/fetch_hot.py
    ├── 东方财富个股热度排行
    └── 百度搜索热度
    │
    ▼
data/hot/YYYY-MM-DD-HH.json, data/hot/latest.json
    │
    ▼
Vercel 构建 (next build)
    │
    ▼
静态页面部署
```

### 数据存储格式扩展

**行情数据**（`data/YYYY-MM-DD.json`）结构不变，新增 `dt` 字段：

```json
{
  "date": "2026-04-23",
  "dt": "2026-04-23T17:05:00+08:00",
  "zt": { "count": 42, "items": [...] },
  "sector": { "top": [...] },
  "lhb": { "count": 15, "items": [...] },
  "news": { "items": [...] }
}
```

**舆情热度数据**（`data/hot/YYYY-MM-DD-HH.json`）：

```json
{
  "datetime": "2026-04-23T14:00:00+08:00",
  "em_hot": {
    "items": [
      { "rank": 1, "code": "600519", "name": "贵州茅台", "hot_value": 982341 }
    ]
  },
  "baidu_hot": {
    "items": [
      { "rank": 1, "code": "600519", "name": "贵州茅台", "search_index": 15420 }
    ]
  }
}
```

**舆情汇总**（`data/hot/latest.json`）始终指向最新小时数据。

## 数据源

| 维度 | 数据来源 | AkShare 接口 |
|------|---------|-------------|
| 涨停榜 | AkShare | `stock_zt_pool_em` |
| 跌停榜 | AkShare | `stock_zt_pool_dt_em` |
| 板块热点 | AkShare | `stock_board_industry_name_ths` + `stock_sector_fund_flow_rank` |
| 龙虎榜 | AkShare | `stock_lhb_detail_daily_sina` |
| 财经新闻 | AkShare | `stock_news_em` |
| 个股热度 | AkShare | `stock_hot_rank_em` |
| 搜索热度 | AkShare | `stock_hot_search_baidu` |

AkShare 版本锁定在 `requirements.txt`。

## 页面设计

### 首页 `/` — 信息流瀑布

顶部固定四指标卡片（涨停 / 跌停 / 领涨 / 龙虎榜）。

下方主体采用左右双栏：

**左栏（宽 60%）**
- 板块热点 TOP5（带涨跌幅和资金流向）
- 涨停榜 TOP10（表格，可点击跳转完整页）
- 跌停榜 TOP5（简要列表）
- 今日简讯（新闻列表，来源 + 时间）

**右栏（宽 40%）**
- 舆情热点 TOP15（个股名称 + 热度值，按热度排序）
- 政策/公告速览（最新 5 条）
- 更新时间标签（"行情数据：17:05 | 热度数据：14:00"）

**底部**
- 免责声明摘要
- 历史归档入口链接

### 历史归档页 `/history`

**左侧边栏（固定）**
- 时间轴导航：昨天 / 近7天 / 近30天 / 近半年
- 点击切换右侧内容

**右侧主区域**
- 当前选中时段的交易日卡片网格
- 每张卡片显示：日期、涨停数、跌停数、领涨板块、是否有龙虎榜
- 点击卡片进入当日详情（复用现有 `/zt`、`/sector`、`/lhb` 页面逻辑，带 `?date=YYYY-MM-DD` 参数）

### 详情页增强

`/zt`、`/sector`、`/lhb` 页面支持 `?date=YYYY-MM-DD` 参数，读取指定日期数据。
无参数时默认读取最新数据。

## 组件清单

| 组件 | 用途 | 变更 |
|------|------|------|
| `HomePage` | 首页信息流瀑布布局 | 重写，左右双栏 |
| `HotSidebar` | 右侧舆情热点面板 | 新增 |
| `PolicyTicker` | 政策公告速览 | 新增 |
| `DtBadge` | 行情/热度更新时间标签 | 新增 |
| `HistoryPage` | 历史归档页 | 新增 |
| `HistoryNav` | 时间轴侧边栏 | 新增 |
| `HistoryCard` | 交易日摘要卡片 | 新增 |
| `ZtPage` / `SectorPage` / `LhbPage` | 详情页 | 支持 `?date` 参数 |
| `DatePicker` | 日期选择器 | 复用现有 |

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | Next.js 15 (App Router, `output: 'export'`) |
| 样式 | Tailwind CSS + shadcn/ui |
| 数据抓取 | Python 3.11 + AkShare |
| CI/CD | GitHub Actions (双工作流) + Vercel Deploy Hook |

## GitHub Actions 工作流

### `daily-update.yml`（每日 17:00 CST）

抓取行情数据，提交 `data/*.json`，触发 Vercel 部署。

### `hourly-hot.yml`（每小时）

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
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: python scripts/fetch_hot.py
      - run: cp -r data/hot/* my-app/public/data/hot/
      - run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/hot/ my-app/public/data/hot/
          if ! git diff --cached --quiet; then
            git commit -m "hot: hourly update $(date +%Y-%m-%d-%H:%M)"
            git push
          fi
      - run: curl -X POST "${{ secrets.VERCEL_DEPLOY_HOOK }}"
```

## 文件结构变更

```
├── data/                          # 行情数据（每日）
│   ├── YYYY-MM-DD.json
│   ├── latest.json
│   └── meta.json
├── data/hot/                      # 舆情热度数据（每小时）
│   ├── YYYY-MM-DD-HH.json
│   └── latest.json
├── my-app/
│   ├── app/
│   │   ├── page.tsx               # 首页信息流瀑布（重写）
│   │   ├── history/
│   │   │   └── page.tsx           # 历史归档页（新增）
│   │   ├── zt/page.tsx            # 支持 ?date 参数
│   │   ├── sector/page.tsx        # 支持 ?date 参数
│   │   ├── lhb/page.tsx           # 支持 ?date 参数
│   │   └── components/
│   │       ├── HotSidebar.tsx     # 舆情热点面板（新增）
│   │       ├── PolicyTicker.tsx   # 政策公告（新增）
│   │       ├── DtBadge.tsx        # 更新时间标签（新增）
│   │       ├── HistoryNav.tsx     # 时间轴导航（新增）
│   │       └── HistoryCard.tsx    # 交易日卡片（新增）
│   ├── lib/
│   │   ├── data.ts                # 读取行情数据
│   │   ├── hot.ts                 # 读取热度数据（新增）
│   │   └── types.ts               # 扩展类型定义
│   └── public/data/               # 构建用数据副本
│       ├── ...
│       └── hot/                   # 新增
├── scripts/
│   ├── fetch_data.py              # 行情抓取（已有）
│   └── fetch_hot.py               # 热度抓取（新增）
├── .github/workflows/
│   ├── daily-update.yml           # 每日行情（已有）
│   └── hourly-hot.yml             # 每小时热度（新增）
└── requirements.txt
```

## 数据源接口层设计

为了预留扩展性，Python 脚本采用**接口层**设计：

```python
# scripts/hot_sources/base.py
class HotSource:
    def fetch(self) -> list[dict]: ...

# scripts/hot_sources/em_hot.py
class EmHotSource(HotSource): ...

# scripts/hot_sources/baidu_hot.py
class BaiduHotSource(HotSource): ...

# scripts/fetch_hot.py
from hot_sources.em_hot import EmHotSource
from hot_sources.baidu_hot import BaiduHotSource

sources = [EmHotSource(), BaiduHotSource()]
for src in sources:
    data[src.name] = src.fetch()
```

新增数据源时，只需实现 `HotSource` 接口并在 `fetch_hot.py` 中注册。

## 错误处理

| 场景 | 策略 |
|------|------|
| AkShare 行情接口失败 | 保留前一日数据，`meta.json` 标记失败 |
| AkShare 热度接口失败 | 保留前一小时热度数据，不影响行情更新 |
| 某个热度源失效 | 其他源正常输出，失效源记录为空列表 |
| 历史日期不存在 | 页面显示"该日期无数据" |

## 免责声明

网站需在页脚及 `/about` 页面明确标注：

> 本网站展示的数据仅供信息参考，不构成投资建议。数据来源于公开渠道，可能存在延迟或误差，使用者应自行核实。舆情热度数据为算法估算值，不代表实际市场表现。

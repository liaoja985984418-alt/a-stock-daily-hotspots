# A 股每日热点信息网站 — 设计文档

## 项目概述

一个展示中国 A 股每日热点信息的静态网站，数据每日收盘后自动更新，覆盖涨跌停榜、板块热点、龙虎榜与综合资讯四个维度。

## 目标与成功标准

- 每日 17:30 前自动展示当日收盘后的核心市场热点数据
- 页面加载速度快（静态生成，无服务端延迟）
- 支持查看历史归档数据
- 数据源免费、合法、稳定

## 架构设计

### 数据流水线

```
GitHub Actions (每日 17:00)
    │
    ▼
Python 脚本 (scripts/fetch_data.py)
    │
    ├── AkShare: 涨停榜、板块热点、龙虎榜
    └── Tushare(免费版): 备用/交叉验证
    │
    ▼
data/YYYY-MM-DD.json   (归档)
data/latest.json       (当前最新)
data/meta.json         (更新元数据)
    │
    ▼
Vercel 自动构建 (next build, output: export)
    │
    ▼
静态页面部署
```

### 数据存储格式

每日生成一个 JSON 文件 `data/YYYY-MM-DD.json`，结构如下：

```json
{
  "date": "2026-04-22",
  "zt": {
    "count": 42,
    "items": [{ "code": "600000", "name": "浦发银行", "price": 10.5, "limit_days": 1, "封单金额": 120000000 }]
  },
  "sector": {
    "top": [{ "name": "半导体", "change_pct": 5.2, "fund_flow": 890000000 }]
  },
  "lhb": {
    "count": 15,
    "items": [{ "code": "000001", "name": "平安银行", "buy_inst": [], "sell_inst": [] }]
  },
  "news": {
    "items": [{ "title": "...", "source": "...", "time": "..." }]
  }
}
```

`data/meta.json` 记录最后成功更新时间及各维度状态：

```json
{
  "last_updated": "2026-04-22T17:05:00+08:00",
  "status": { "zt": "ok", "sector": "ok", "lhb": "ok", "news": "skipped" }
}
```

### 数据源

| 维度 | 主数据源 | AkShare 接口 |
|------|---------|-------------|
| 涨停榜 | AkShare | `stock_zt_pool_em` |
| 板块热点 | AkShare | `stock_board_industry_name_ths` + `stock_sector_fund_flow_rank` |
| 龙虎榜 | AkShare | `stock_lhb_detail_daily_sina` |
| 资讯 | 暂不提供或手动补充 | — |

AkShare 版本锁定在 `requirements.txt` 中，避免接口变动导致构建失败。

## 页面设计

### 路由

| 路由 | 用途 |
|------|------|
| `/` | 首页 — 市场概览 |
| `/zt` | 涨停榜详情 |
| `/sector` | 板块热点详情 |
| `/lhb` | 龙虎榜详情 |
| `/about` | 关于与免责声明 |

### 首页 `/`

- 顶部：日期选择器（默认今日，下拉选择历史日期）
- 核心指标卡片区（4 张 `MetricCard`）：涨停家数、跌停家数、领涨板块 Top1、龙虎榜上榜数
- 卡片可点击跳转对应详情页
- 底部：免责声明摘要

### 详情页

统一使用 `DataTable` 组件，支持：
- 列排序（点击表头）
- 基础分页（如数据量过大）
- 响应式横向滚动（移动端）

### 历史数据查看

日期选择器切换时，前端根据日期读取 `data/YYYY-MM-DD.json`。若文件不存在，提示"该日期无数据"。

## 组件清单

| 组件 | 用途 | 来源 |
|------|------|------|
| `Layout` | 全局导航 + 页脚 | 自定义 |
| `MetricCard` | 首页指标卡片 | 自定义 |
| `DataTable` | 数据表格（排序/分页） | 基于 shadcn/ui Table + TanStack Table |
| `DatePicker` | 日期选择器 | shadcn/ui Calendar + Popover |
| `StatusBadge` | 数据更新状态指示 | 自定义 |

## 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 输出模式 | 静态导出 (`output: 'export'`) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 组件库 | shadcn/ui |
| 图表 | Recharts（板块资金流向等简单可视化） |
| 数据抓取 | Python 3.11 + AkShare |
| CI/CD | GitHub Actions + Vercel |

## 部署策略

1. GitHub Actions 每日 17:00 CST 触发 `fetch_data.py`
2. 脚本生成/更新 `data/*.json`，commit & push 到 `main` 分支
3. Vercel 监测 `main` 分支更新，自动执行 `next build`
4. 构建产物为纯静态文件，部署到 CDN

## 错误处理

| 场景 | 策略 |
|------|------|
| 数据抓取失败 | 保留前一日数据，`meta.json` 标记失败维度，页面显示"数据更新中" |
| JSON 缺失/损坏 | 构建时 schema 校验，fallback 到空数据，不阻断构建 |
| 历史日期不存在 | 日期选择器仅展示有数据的日期 |
| AkShare 接口变动 | `requirements.txt` 锁定版本，升级前本地测试 |

## 测试策略

- **数据脚本**：`fetch_data.py` 支持 `--dry-run` 参数，本地验证抓取逻辑
- **类型安全**：TypeScript 接口与 JSON schema 对齐，构建时校验
- **构建检查**：每次 PR 触发 Vercel Preview Build，确认无构建错误

## 文件结构

```
├── app/                    # Next.js App Router
│   ├── page.tsx            # 首页
│   ├── zt/page.tsx         # 涨停榜
│   ├── sector/page.tsx     # 板块热点
│   ├── lhb/page.tsx        # 龙虎榜
│   ├── about/page.tsx      # 关于
│   ├── layout.tsx          # 根布局
│   └── components/         # 页面级组件
├── components/ui/          # shadcn/ui 组件
├── data/                   # JSON 数据（Git 追踪）
├── scripts/
│   └── fetch_data.py       # 数据抓取脚本
├── .github/workflows/
│   └── daily-update.yml    # 定时触发工作流
├── next.config.js
├── tailwind.config.ts
└── requirements.txt        # Python 依赖
```

## 免责声明

网站需在页脚及 `/about` 页面明确标注：

> 本网站展示的数据仅供信息参考，不构成投资建议。数据来源于公开渠道，可能存在延迟或误差，使用者应自行核实。

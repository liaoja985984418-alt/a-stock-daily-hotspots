#!/usr/bin/env python3
import argparse
import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

import akshare as ak

DATA_DIR = Path(__file__).parent.parent / "data"


def fetch_zt(trade_date: str):
    """Fetch Zhangting (limit-up) data."""
    try:
        df = ak.stock_zt_pool_em(date=trade_date)
        items = []
        for _, row in df.iterrows():
            items.append({
                "code": str(row.get("代码", "")).zfill(6),
                "name": row.get("名称", ""),
                "price": float(row.get("最新价", 0)),
                "limit_days": int(row.get("连板数", 1)),
                "封单金额": float(row.get("封单资金", 0)),
            })
        return {"count": len(items), "items": items}
    except Exception as e:
        print(f"[zt] Error: {e}", file=sys.stderr)
        return None


def fetch_sector(trade_date: str):
    """Fetch sector hotspots."""
    try:
        df = ak.stock_sector_fund_flow_rank(indicator="今日", sector_type="行业资金流")
        top = []
        for _, row in df.head(20).iterrows():
            top.append({
                "name": row.get("名称", ""),
                "change_pct": float(row.get("涨跌幅", 0)),
                "fund_flow": float(row.get("主力净流入-净额", 0)),
            })
        return {"top": top}
    except Exception as e:
        print(f"[sector] Error: {e}", file=sys.stderr)
        return None


def fetch_lhb(trade_date: str):
    """Fetch Longhubang data."""
    try:
        df = ak.stock_lhb_detail_daily_sina(start_date=trade_date, end_date=trade_date)
        items = []
        for _, row in df.iterrows():
            items.append({
                "code": str(row.get("代码", "")).zfill(6),
                "name": row.get("名称", ""),
                "buy_inst": [],
                "sell_inst": [],
            })
        return {"count": len(items), "items": items}
    except Exception as e:
        print(f"[lhb] Error: {e}", file=sys.stderr)
        return None


def run(dry_run: bool = False):
    today = datetime.now().strftime("%Y%m%d")
    trade_date = datetime.now().strftime("%Y-%m-%d")

    result = {
        "date": trade_date,
        "zt": {"count": 0, "items": []},
        "sector": {"top": []},
        "lhb": {"count": 0, "items": []},
        "news": {"items": []},
    }
    status = {"zt": "skipped", "sector": "skipped", "lhb": "skipped", "news": "skipped"}

    if not dry_run:
        zt = fetch_zt(today)
        if zt:
            result["zt"] = zt
            status["zt"] = "ok"

        sector = fetch_sector(today)
        if sector:
            result["sector"] = sector
            status["sector"] = "ok"

        lhb = fetch_lhb(today)
        if lhb:
            result["lhb"] = lhb
            status["lhb"] = "ok"
    else:
        print("Dry run mode: skipping API calls")
        # Use sample data for dry run
        result = json.loads((DATA_DIR / "2026-04-22.json").read_text(encoding="utf-8"))
        status = {"zt": "ok", "sector": "ok", "lhb": "ok", "news": "ok"}

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    archive_path = DATA_DIR / f"{trade_date}.json"
    latest_path = DATA_DIR / "latest.json"
    meta_path = DATA_DIR / "meta.json"

    if not dry_run:
        archive_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        latest_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    meta = {
        "last_updated": datetime.now(timezone(timedelta(hours=8))).isoformat(),
        "status": status,
    }
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Data saved: {archive_path}, {latest_path}, {meta_path}")
    print(f"Status: {status}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Run without calling APIs")
    args = parser.parse_args()
    run(dry_run=args.dry_run)

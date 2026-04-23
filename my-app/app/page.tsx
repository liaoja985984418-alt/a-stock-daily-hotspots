import { getLatestData, getAvailableDates } from '@/lib/data';
import MetricCard from './components/MetricCard';

export default async function HomePage() {
  const data = getLatestData();
  const dates = getAvailableDates();

  if (!data) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">暂无数据</h1>
        <p className="text-muted-foreground">请稍后刷新或检查数据更新状态。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">A股每日热点 — {data.date}</h1>
        <span className="text-sm text-muted-foreground">共 {dates.length} 个历史交易日</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="涨停家数"
          value={data.zt.count}
          description="今日涨停个股总数"
          href="/zt"
        />
        <MetricCard
          title="跌停家数"
          value={0}
          description="今日跌停个股总数（待补充）"
        />
        <MetricCard
          title="领涨板块"
          value={data.sector.top[0]?.name || '-'}
          description={`涨幅 ${data.sector.top[0]?.change_pct || 0}%`}
          href="/sector"
        />
        <MetricCard
          title="龙虎榜上榜"
          value={data.lhb.count}
          description="今日龙虎榜上榜个股数"
          href="/lhb"
        />
      </div>

      {data.news.items.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">今日简讯</h2>
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
        </div>
      )}
    </div>
  );
}

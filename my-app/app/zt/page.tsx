import { getLatestData } from '@/lib/data';
import ZtTable from '../components/ZtTable';

export default async function ZtPage() {
  const data = getLatestData();

  if (!data) {
    return <div className="text-center py-20">暂无数据</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">涨停榜 — {data.date}</h1>
      <p className="text-muted-foreground">共 {data.zt.count} 只涨停股</p>
      <ZtTable data={data.zt.items} />
    </div>
  );
}

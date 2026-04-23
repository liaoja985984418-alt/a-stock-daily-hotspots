import { getLatestData } from '@/lib/data';
import LhbTable from '../components/LhbTable';

export default async function LhbPage() {
  const data = getLatestData();

  if (!data) {
    return <div className="text-center py-20">暂无数据</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">龙虎榜 — {data.date}</h1>
      <p className="text-muted-foreground">共 {data.lhb.count} 只上榜个股</p>
      <LhbTable data={data.lhb.items} />
    </div>
  );
}

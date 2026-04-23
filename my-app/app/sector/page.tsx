import { getLatestData } from '@/lib/data';
import SectorTable from '../components/SectorTable';

export default async function SectorPage() {
  const data = getLatestData();

  if (!data) {
    return <div className="text-center py-20">暂无数据</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">板块热点 — {data.date}</h1>
      <SectorTable data={data.sector.top} />
    </div>
  );
}

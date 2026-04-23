'use client';

import DataTable from './DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { SectorItem } from '@/lib/types';

const columns: ColumnDef<SectorItem>[] = [
  {
    accessorKey: 'name',
    header: '板块名称',
  },
  {
    accessorKey: 'change_pct',
    header: '涨跌幅 (%)',
    cell: ({ row }) => {
      const val = row.getValue('change_pct') as number;
      return `${val.toFixed(2)}%`;
    },
  },
  {
    accessorKey: 'fund_flow',
    header: '主力资金净流入',
    cell: ({ row }) => {
      const val = row.getValue('fund_flow') as number;
      return `${(val / 100000000).toFixed(2)} 亿`;
    },
  },
];

interface SectorTableProps {
  data: SectorItem[];
}

export default function SectorTable({ data }: SectorTableProps) {
  return <DataTable columns={columns} data={data} />;
}

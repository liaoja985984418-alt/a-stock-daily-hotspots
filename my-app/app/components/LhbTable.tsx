'use client';

import DataTable from './DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { LhbItem } from '@/lib/types';

const columns: ColumnDef<LhbItem>[] = [
  {
    accessorKey: 'code',
    header: '代码',
  },
  {
    accessorKey: 'name',
    header: '名称',
  },
  {
    accessorKey: 'buy_inst',
    header: '买入席位',
    cell: ({ row }) => {
      const val = row.getValue('buy_inst') as string[];
      return val.join('、') || '-';
    },
  },
  {
    accessorKey: 'sell_inst',
    header: '卖出席位',
    cell: ({ row }) => {
      const val = row.getValue('sell_inst') as string[];
      return val.join('、') || '-';
    },
  },
];

interface LhbTableProps {
  data: LhbItem[];
}

export default function LhbTable({ data }: LhbTableProps) {
  return <DataTable columns={columns} data={data} />;
}

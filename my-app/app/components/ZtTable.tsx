'use client';

import DataTable from './DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { ZtItem } from '@/lib/types';

const columns: ColumnDef<ZtItem>[] = [
  {
    accessorKey: 'code',
    header: '代码',
  },
  {
    accessorKey: 'name',
    header: '名称',
  },
  {
    accessorKey: 'price',
    header: '价格',
  },
  {
    accessorKey: 'limit_days',
    header: '连板数',
  },
  {
    accessorKey: '封单金额',
    header: '封单金额',
    cell: ({ row }) => {
      const val = row.getValue('封单金额') as number;
      return `${(val / 100000000).toFixed(2)} 亿`;
    },
  },
];

interface ZtTableProps {
  data: ZtItem[];
}

export default function ZtTable({ data }: ZtTableProps) {
  return <DataTable columns={columns} data={data} />;
}


"use client";

import { ColumnDef } from "@tanstack/react-table";
import { User } from "@/lib/types";
import { DataTableRowActions } from "./data-table-row-actions";

export const columns = (t: (key: string) => string): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: t('general.name'),
  },
  {
    accessorKey: "email",
    header: t('general.email'),
  },
  {
    accessorKey: "accountStatus",
    header: t('general.status'),
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} t={t} />,
  },
];

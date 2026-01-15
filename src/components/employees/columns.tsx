"use client";

import { ColumnDef } from "@tanstack/react-table";
import { User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

export const columns = (t: (key: string) => string): ColumnDef<User>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('dashboard.employee')} />
    ),
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person face" />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "rank",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('general.rank')} />
    ),
  },
  {
    accessorKey: "nationalId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="National ID" />
    ),
  },
  {
    accessorKey: "cnasNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="CNAS" />
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    )
  },
  {
    accessorKey: "baseSalary",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('general.baseSalary')} />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("baseSalary"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "DZD",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "attendanceRate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('dashboard.attendanceRate')} />
    ),
    cell: ({ row }) => {
      const rate = row.original.attendanceRate;
      return <div>{rate}%</div>;
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('general.role')} />
    ),
    cell: ({ row }) => {
      const role = row.original.role;
      return (
        <Badge variant={role === "Admin" ? "default" : "secondary"}>
          {role}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} t={t} />,
  },
];

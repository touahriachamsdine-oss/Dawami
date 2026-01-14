"use client"

import { Table } from "@tanstack/react-table"
import Link from "next/link";
import { Button } from "@/components/ui/button"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  t: (key: string) => string
}

export function DataTableToolbar<TData>({
  table,
  t
}: DataTableToolbarProps<TData>) {

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* Search is now in the header */}
      </div>
      <Button asChild>
        <Link href="/add-employee">{t('employees.addEmployee')}</Link>
      </Button>
    </div>
  )
}

"use client"

import { MoreHorizontal } from "lucide-react"
import { Row } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditEmployeeDialog } from "./edit-employee-dialog"
import { useState } from "react"
import { User } from "@/lib/types"


interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  t: (key: string) => string
}

export function DataTableRowActions<TData>({
  row,
  t
}: DataTableRowActionsProps<TData>) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const user = row.original as User;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsEditDialogOpen(true); }}>{t('general.edit')}</DropdownMenuItem>
          <DropdownMenuItem>{t('general.viewAttendance')}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            {t('general.delete')}
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditEmployeeDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        user={user}
        t={t}
      />
    </>
  )
}

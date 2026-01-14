
"use client"

import { MoreHorizontal } from "lucide-react"
import { Row } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { User } from "@/lib/types"
import { ApproveApplicantDialog } from "./approve-applicant-dialog"
import { useFirebase, doc, updateDoc } from "@/db"
import { useToast } from "@/hooks/use-toast"


interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  t: (key: string) => string
}

export function DataTableRowActions<TData>({
  row,
  t
}: DataTableRowActionsProps<TData>) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const applicant = row.original as User;

  const handleReject = async () => {
    if (!firestore) return;
    try {
      const applicantRef = doc(firestore, 'users', applicant.id); // Use Firestore ID, not UID for doc reference
      await updateDoc(applicantRef, {
        accountStatus: 'Rejected'
      });
      toast({
        title: t('applicants.rejected'),
        description: t('applicants.rejectedDesc').replace('{name}', applicant.name),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred.",
      });
    }
  }

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
          <DropdownMenuItem onClick={() => setIsApproveDialogOpen(true)}>{t('general.approve')}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleReject} className="text-destructive">
            {t('general.reject')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ApproveApplicantDialog
        isOpen={isApproveDialogOpen}
        setIsOpen={setIsApproveDialogOpen}
        applicant={applicant}
        t={t}
      />
    </>
  )
}

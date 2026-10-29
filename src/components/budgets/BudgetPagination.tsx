"use client"

import { Pagination } from "@/components/ui/pagination"

interface BudgetPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  itemLabel?: string
}

export function BudgetPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  itemLabel = "presupuestos"
}: BudgetPaginationProps) {
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      pageSize={pageSize}
      itemLabel={itemLabel}
    />
  )
}


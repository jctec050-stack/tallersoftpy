"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface BudgetPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
}

export function BudgetPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize
}: BudgetPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  if (totalItems === 0) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return

    const params = new URLSearchParams(searchParams.toString())
    if (newPage === 1) {
      params.delete("page")
    } else {
      params.set("page", newPage.toString())
    }

    startTransition(() => {
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : window.location.pathname)
    })
  }

  // Generar lista de números de páginas con ellipsis si hay muchas páginas
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-200 text-xs text-zinc-500">
      {/* Resumen */}
      <div>
        <span>
          Mostrando <strong className="text-zinc-900 font-semibold">{startItem}</strong> -{" "}
          <strong className="text-zinc-900 font-semibold">{endItem}</strong> de{" "}
          <strong className="text-zinc-900 font-semibold">{totalItems}</strong> presupuestos
        </span>
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-1">
        {/* Anterior */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || isPending}
          onClick={() => handlePageChange(currentPage - 1)}
          className="h-8 px-2.5 text-xs text-zinc-700 bg-white"
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        {/* Números de página */}
        <div className="flex items-center gap-1 flex-wrap justify-center">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`dots-${idx}`} className="px-1.5 text-zinc-400">
                  ...
                </span>
              )
            }

            const pageNum = p as number
            const isActive = pageNum === currentPage

            return (
              <button
                key={pageNum}
                type="button"
                disabled={isPending}
                onClick={() => handlePageChange(pageNum)}
                className={`h-8 min-w-[32px] px-2 rounded-md font-medium text-xs transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        {/* Siguiente */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || isPending}
          onClick={() => handlePageChange(currentPage + 1)}
          className="h-8 px-2.5 text-xs text-zinc-700 bg-white"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  )
}

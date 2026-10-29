"use client"
import { Search } from "lucide-react"
import { Input } from "./input"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

export function SearchInput({ placeholder }: { placeholder: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="relative max-w-md w-full">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
      <Input
        type="search"
        placeholder={placeholder}
        className="pl-9 bg-white"
        defaultValue={searchParams.get("q")?.toString()}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString())
          if (e.target.value) {
            params.set("q", e.target.value)
          } else {
            params.delete("q")
          }
          params.delete("page")
          startTransition(() => {
            const qs = params.toString()
            router.replace(qs ? `?${qs}` : window.location.pathname)
          })
        }}
      />
    </div>
  )
}

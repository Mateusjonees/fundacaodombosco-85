import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
}

const MAX_VISIBLE = 100

function ComboboxImpl({
  options,
  value,
  onValueChange,
  placeholder = "Selecione uma opção...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  )

  // Filtragem manual (mais rápida e estável que o filter interno do cmdk
  // quando há centenas/milhares de opções — evita o "piscar" durante a digitação).
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options.slice(0, MAX_VISIBLE)
    const result: ComboboxOption[] = []
    for (const opt of options) {
      if (opt.label.toLowerCase().includes(q)) {
        result.push(opt)
        if (result.length >= MAX_VISIBLE) break
      }
    }
    return result
  }, [options, search])

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      onValueChange(selectedValue === value ? "" : selectedValue)
      setOpen(false)
      setSearch("")
    },
    [onValueChange, value]
  )

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch("") }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">{selectedOption?.label || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filtered.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {options.length > filtered.length && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Mostrando {filtered.length} de {options.length} — refine a busca para ver mais.
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export const Combobox = React.memo(ComboboxImpl)

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface Option {
  id: number;
  value: string;
  label: string;
  description?: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: number[];
  onSelectionChange: (selected: number[]) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  maxHeight?: string;
  isLoading?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onSelectionChange,
  placeholder = "Seleccionar elementos...",
  emptyText = "No se encontraron elementos",
  className,
  disabled = false,
  maxHeight = "300px",
  isLoading = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOptions = options.filter(option => selected.includes(option.id));

  const handleSelect = (option: Option) => {
    if (selected.includes(option.id)) {
      onSelectionChange(selected.filter(id => id !== option.id));
    } else {
      onSelectionChange([...selected, option.id]);
    }
  };

  const handleRemove = (optionId: number) => {
    onSelectionChange(selected.filter(id => id !== optionId));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected items display */}
      {selected.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">
              Elementos seleccionados ({selected.length})
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              Limpiar todo
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedOptions.map((option) => (
              <Badge
                key={option.id}
                variant="secondary"
                className="text-xs px-2 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                <span className="max-w-32 truncate">{option.label}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(option.id);
                  }}
                  className="h-auto p-0 ml-1 text-blue-600 hover:text-blue-800 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Dropdown selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] p-3"
            disabled={disabled}
          >
            <span className="text-left flex-1">
              {selected.length === 0
                ? placeholder
                : `${selected.length} elemento${selected.length !== 1 ? 's' : ''} seleccionado${selected.length !== 1 ? 's' : ''}`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
          <Command>
            <CommandInput placeholder="Buscar..." className="h-9" />
            <CommandList style={{ maxHeight }}>
              <CommandEmpty>
                {isLoading ? "Cargando..." : emptyText}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.label}
                    onSelect={() => handleSelect(option)}
                    className="flex items-start space-x-3 p-3 cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        selected.includes(option.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{option.label}</span>
                        <Badge variant="outline" className="text-xs">
                          ID: {String(option.id).padStart(2, '0')}
                        </Badge>
                      </div>
                      {option.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
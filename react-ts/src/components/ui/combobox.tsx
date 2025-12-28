import * as React from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Button } from "./button";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";

export type ComboBoxItem = {
  label: string;
  value: string;
  disabled?: boolean;
};

export interface ComboBoxProps {
  items: ComboBoxItem[];
  selected?: ComboBoxItem;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  onChange?: (value: ComboBoxItem) => void;
  className?: string;
}

export function ComboBox({
  items,
  selected,
  placeholder = "Select an item",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found",
  disabled,
  onChange,
  className,
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false);
  const handleSelect = (v: ComboBoxItem) => {
    if (onChange) onChange(v);
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span
            className={cn("truncate", !selected && "text-muted-foreground")}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <ScrollArea className="max-h-64">
          <ul className="py-1">
            {items.map((item) => (
              <li key={item.value}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left cursor-pointer",
                    item.disabled
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-muted",
                  )}
                  onClick={() => !item.disabled && handleSelect(item)}
                  disabled={item.disabled}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      selected?.value === item.value
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default ComboBox;

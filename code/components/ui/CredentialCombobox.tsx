"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface CredentialOption {
  label: string;
  value: string;
}

interface CredentialComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: CredentialOption[];
  placeholder?: string;
  inputType?: "text" | "password";
  className?: string;
}

export function CredentialCombobox({
  value,
  onChange,
  options,
  placeholder = "Select or type...",
  inputType = "text",
  className,
}: CredentialComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);

  // Sync external value changes (e.g. env toggle)
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const matchedOption = options.find((o) => o.value === value);

  const triggerDisplay = value
    ? (matchedOption
        ? matchedOption.label
        : inputType === "password"
          ? "•".repeat(Math.min(value.length, 24))
          : value)
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "border-2 flex h-9 w-full items-center justify-between rounded-md border-input bg-background px-3 py-2 text-sm shadow-sm",
            "focus:outline-none focus:ring-1 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {triggerDisplay}
          </span>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or type value..."
            value={inputValue}
            onValueChange={(v) => {
              setInputValue(v);
              onChange(v);
            }}
          />
          <CommandList>
            <CommandEmpty>
              <button
                type="button"
                className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent rounded-sm"
                onClick={() => {
                  onChange(inputValue);
                  setOpen(false);
                }}
              >
                Use:{" "}
                {inputType === "password"
                  ? "•".repeat(Math.min(inputValue.length, 16))
                  : inputValue}
              </button>
            </CommandEmpty>
            {options.length > 0 && (
              <CommandGroup heading="Presets">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onChange(option.value);
                      setInputValue(option.value);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

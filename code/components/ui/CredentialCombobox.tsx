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

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const matchedOption = options.find((o) => o.value === value);

  const triggerDisplay = value
    ? matchedOption
      ? matchedOption.label
      : inputType === "password"
        ? "•".repeat(Math.min(value.length, 24))
        : value
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            // base
            "flex h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
            // border — thicker, blue-tinted to match the card
            "border-2 border-input",
            // background & shadow
            "bg-background shadow-sm",
            // open state ring
            open && "border-blue-400 ring-2 ring-blue-400/20 dark:border-blue-500 dark:ring-blue-500/20",
            // hover
            !open && "hover:border-blue-300 hover:shadow-md dark:hover:border-blue-600 transition-all duration-150",
            // focus-visible
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span className={cn("truncate font-mono text-xs", !value && "text-muted-foreground font-sans text-sm")}>
            {triggerDisplay}
          </span>
          <ChevronsUpDownIcon
            className={cn(
              "ml-2 h-4 w-4 shrink-0 transition-transform duration-200",
              open ? "opacity-70 rotate-180" : "opacity-40",
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          // solid background — fixes transparency
          "w-[var(--radix-popover-trigger-width)] p-0",
          "bg-white dark:bg-zinc-900",
          "border border-blue-100 dark:border-blue-900",
          "rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40",
          "overflow-hidden",
        )}
        align="start"
        sideOffset={6}
      >
        <Command className="bg-transparent">
          <div className="border-b border-zinc-100 dark:border-zinc-800">
            <CommandInput
              placeholder="Search or type value…"
              value={inputValue}
              onValueChange={(v) => {
                setInputValue(v);
                onChange(v);
              }}
              className="h-10 text-sm"
            />
          </div>

          <CommandList className="max-h-48 overflow-y-auto">
            <CommandEmpty>
              {inputValue ? (
                <button
                  type="button"
                  className={cn(
                    "w-full px-3 py-2.5 text-xs text-left transition-colors",
                    "text-muted-foreground hover:text-foreground hover:bg-blue-50 dark:hover:bg-blue-950/40",
                  )}
                  onClick={() => {
                    onChange(inputValue);
                    setOpen(false);
                  }}
                >
                  <span className="text-blue-500 font-medium mr-1">↵ Use:</span>
                  <span className="font-mono">
                    {inputType === "password"
                      ? "•".repeat(Math.min(inputValue.length, 20))
                      : inputValue.length > 32
                        ? `${inputValue.slice(0, 32)}…`
                        : inputValue}
                  </span>
                </button>
              ) : (
                <p className="py-4 text-center text-xs text-muted-foreground">Type a value above</p>
              )}
            </CommandEmpty>

            {options.length > 0 && (
              <CommandGroup
                heading="Presets"
                className="px-1 py-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground/70 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
              >
                {options.map((option) => {
                  const isSelected = value === option.value;
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => {
                        onChange(option.value);
                        setInputValue(option.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-2 text-sm cursor-pointer transition-colors",
                        "hover:bg-blue-50 dark:hover:bg-blue-950/40",
                        isSelected && "bg-blue-50/80 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                          isSelected
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-muted-foreground/30",
                        )}
                      >
                        {isSelected && <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} />}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{option.label}</span>
                        <span className="font-mono text-xs text-muted-foreground truncate">
                          {inputType === "password"
                            ? "•".repeat(12)
                            : option.value.length > 28
                              ? `${option.value.slice(0, 28)}…`
                              : option.value}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, ChevronDown } from "lucide-react";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
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

// ISO code → flag emoji
const flag = (cc: string) =>
  cc
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

let displayNames: Intl.DisplayNames | null = null;
try {
  displayNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  displayNames = null;
}
const countryName = (cc: string) => displayNames?.of(cc) ?? cc;

function detectCountry(): CountryCode {
  try {
    const langs = [navigator.language, ...(navigator.languages ?? [])];
    for (const l of langs) {
      const m = /-([A-Z]{2})\b/i.exec(l ?? "");
      if (m) {
        const cc = m[1].toUpperCase() as CountryCode;
        if (getCountries().includes(cc)) return cc;
      }
    }
  } catch {
    /* noop */
  }
  return "IN";
}

export type PhoneValue = {
  country: CountryCode;
  countryCode: string;
  national: string;
  e164: string;
  valid: boolean;
};

export function emptyPhoneValue(country: CountryCode = "IN"): PhoneValue {
  return {
    country,
    countryCode: `+${getCountryCallingCode(country)}`,
    national: "",
    e164: "",
    valid: false,
  };
}

function buildValue(country: CountryCode, nationalDigits: string): PhoneValue {
  const callingCode = getCountryCallingCode(country);
  const e164Candidate = `+${callingCode}${nationalDigits}`;
  const parsed = parsePhoneNumberFromString(e164Candidate);
  const valid = !!parsed && parsed.isValid() && parsed.country === country;
  return {
    country,
    countryCode: `+${callingCode}`,
    national: nationalDigits,
    e164: nationalDigits ? e164Candidate : "",
    valid,
  };
}

function maxNationalDigits(country: CountryCode): number {
  if (country === "IN") return 10;
  if (country === "US" || country === "CA") return 10;
  if (country === "GB") return 10;
  return 15;
}

export function PhoneField({
  label = "Phone",
  id = "phone",
  value,
  onChange,
  onBlur,
  error,
  touched,
}: {
  label?: string;
  id?: string;
  value: PhoneValue;
  onChange: (v: PhoneValue) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Auto-detect country on first mount if untouched
  useEffect(() => {
    if (!value.national && value.country === "IN") {
      const detected = detectCountry();
      if (detected !== value.country) onChange(buildValue(detected, ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const countries = useMemo(
    () =>
      getCountries()
        .map((cc) => ({
          code: cc as CountryCode,
          name: countryName(cc) ?? cc,
          calling: `+${getCountryCallingCode(cc)}`,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const cap = maxNationalDigits(value.country);
  const formatted = useMemo(() => {
    if (!value.national) return "";
    try {
      const ay = new AsYouType(value.country);
      return ay.input(value.national) || value.national;
    } catch {
      return value.national;
    }
  }, [value.country, value.national]);

  const handleDigits = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, cap);
    onChange(buildValue(value.country, digits));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    const parsed = parsePhoneNumberFromString(text);
    if (parsed?.country && getCountries().includes(parsed.country as CountryCode)) {
      onChange(buildValue(parsed.country as CountryCode, parsed.nationalNumber));
      return;
    }
    handleDigits(text);
  };

  const selectCountry = (code: CountryCode) => {
    onChange(buildValue(code, value.national.slice(0, maxNationalDigits(code))));
    setOpen(false);
  };

  const showError = touched && !!error;
  const showSuccess = touched && !error && value.valid;

  return (
    <label htmlFor={id} className="block col-span-2">
      <span className="kicker block mb-2">{label}</span>

      {/* Single unified field: matches <Field> exactly (h-11, bg-background/40, border, rounded-md) */}
      <div
        className={cn(
          "relative flex items-stretch w-full h-11 bg-background/40 backdrop-blur border rounded-md transition-all",
          showError
            ? "border-destructive/70 focus-within:border-destructive focus-within:ring-2 focus-within:ring-destructive/20"
            : showSuccess
              ? "border-emerald-500/60 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
              : "border-border/70 focus-within:border-ember focus-within:ring-2 focus-within:ring-ember/25 hover:border-border",
        )}
      >
        {/* Country selector — Radix Popover + shadcn Command */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Country: ${countryName(value.country)} ${value.countryCode}`}
              className={cn(
                "flex items-center gap-1.5 pl-2.5 pr-2 min-w-[78px] shrink-0",
                "border-r border-border/60 rounded-l-md",
                "font-mono text-xs text-foreground/90 transition-colors outline-none",
                "hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.04]",
                open && "bg-foreground/[0.05]",
              )}
            >
              <span className="text-[15px] leading-none" aria-hidden>
                {flag(value.country)}
              </span>
              <span className="tracking-tight tabular-nums">{value.countryCode}</span>
              <ChevronDown
                className={cn(
                  "w-3 h-3 ml-0.5 text-foreground/50 transition-transform duration-200",
                  open && "rotate-180 text-ember",
                )}
                strokeWidth={1.8}
              />
            </button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            sideOffset={8}
            collisionPadding={12}
            className={cn(
              "z-[100] w-[300px] max-w-[92vw] p-0 overflow-hidden rounded-md",
              // Fully opaque, layered dark surface — no bleed-through to fields below
              "bg-[hsl(var(--card))] border border-border/80",
              "shadow-[0_24px_60px_-12px_rgba(0,0,0,0.75),0_8px_20px_-8px_rgba(0,0,0,0.6)]",
            )}
          >
            <Command
              className="bg-transparent"
              filter={(val, search) => {
                const s = search.trim().toLowerCase();
                if (!s) return 1;
                return val.toLowerCase().includes(s) ? 1 : 0;
              }}
            >
              {/* Sticky search — auto-focused by Radix Popover, visually separated */}
              <CommandInput
                placeholder="Search country or code"
                className="h-10 font-mono text-xs placeholder:text-foreground/40 bg-transparent"
              />
              <CommandList
                className={cn(
                  "max-h-[280px] py-1",
                  // Thin, subtle themed scrollbar
                  "[scrollbar-width:thin]",
                  "[scrollbar-color:hsl(var(--foreground)/0.18)_transparent]",
                  "[&::-webkit-scrollbar]:w-1.5",
                  "[&::-webkit-scrollbar-track]:bg-transparent",
                  "[&::-webkit-scrollbar-thumb]:bg-foreground/15",
                  "[&::-webkit-scrollbar-thumb]:rounded-full",
                  "hover:[&::-webkit-scrollbar-thumb]:bg-foreground/25",
                )}
              >
                <CommandEmpty className="px-3 py-6 text-center text-xs text-muted-foreground font-mono">
                  No matches
                </CommandEmpty>

                {/* Pinned: currently selected */}
                <CommandGroup
                  heading="Selected"
                  className="px-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:tracking-[0.22em] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-foreground/40"
                >
                  {(() => {
                    const c = countries.find((x) => x.code === value.country);
                    if (!c) return null;
                    return (
                      <CommandItem
                        key={`sel-${c.code}`}
                        value={`__selected__ ${c.name} ${c.code} ${c.calling}`}
                        onSelect={() => selectCountry(c.code)}
                        className={cn(
                          "relative flex items-center gap-3 px-3 py-2 my-0.5 rounded-md cursor-pointer",
                          "text-sm text-ember bg-ember/[0.08]",
                          "aria-selected:bg-ember/[0.14] data-[selected=true]:bg-ember/[0.14]",
                        )}
                      >
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-ember rounded-full" />
                        <span className="text-[15px] leading-none" aria-hidden>
                          {flag(c.code)}
                        </span>
                        <span className="flex-1 truncate text-[13px]">{c.name}</span>
                        <span className="font-mono text-[11px] tabular-nums">{c.calling}</span>
                        <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                      </CommandItem>
                    );
                  })()}
                </CommandGroup>

                {/* Divider between selected + full list */}
                <div className="h-px mx-2 my-1 bg-border/60" />

                <CommandGroup
                  heading="All countries"
                  className="px-1 pb-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:tracking-[0.22em] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-foreground/40"
                >
                  {countries.map((c) => {
                    const selected = c.code === value.country;
                    return (
                      <CommandItem
                        key={c.code}
                        value={`${c.name} ${c.code} ${c.calling}`}
                        onSelect={() => selectCountry(c.code)}
                        className={cn(
                          "relative flex items-center gap-3 px-3 py-2 my-0.5 rounded-md cursor-pointer",
                          "text-sm text-foreground/90 transition-colors",
                          "aria-selected:bg-foreground/[0.06] data-[selected=true]:bg-foreground/[0.06]",
                          "aria-selected:text-foreground data-[selected=true]:text-foreground",
                          selected && "text-ember",
                        )}
                      >
                        <span className="text-[15px] leading-none" aria-hidden>
                          {flag(c.code)}
                        </span>
                        <span
                          className={cn(
                            "flex-1 truncate text-[13px]",
                            selected ? "text-ember" : "",
                          )}
                        >
                          {c.name}
                        </span>
                        <span
                          className={cn(
                            "font-mono text-[11px] tabular-nums",
                            selected ? "text-ember" : "text-foreground/50",
                          )}
                        >
                          {c.calling}
                        </span>
                        {selected && (
                          <Check className="w-3.5 h-3.5 text-ember shrink-0" strokeWidth={2} />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Number input — identical to <Field> input (font-mono text-sm, px-3.5) */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="tel-national"
          value={formatted}
          onChange={(e) => handleDigits(e.target.value)}
          onPaste={handlePaste}
          onBlur={onBlur}
          onBeforeInput={(e) => {
            const nativeData = (e as unknown as { data?: string }).data;
            if (nativeData && /[^\d\s\-()]/.test(nativeData)) e.preventDefault();
          }}
          placeholder={value.country === "IN" ? "98765 43210" : "Phone number"}
          className={cn(
            "flex-1 min-w-0 bg-transparent px-3.5 font-mono text-sm text-foreground",
            "outline-none placeholder:text-foreground/30",
            "appearance-none [-webkit-appearance:none] rounded-r-md",
          )}
          style={{ WebkitTapHighlightColor: "transparent" }}
        />

        <AnimatePresence>
          {showSuccess && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="grid place-items-center pr-3 text-emerald-500"
              aria-hidden
            >
              <Check className="w-4 h-4" strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showError && (
          <motion.span
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] tracking-wider uppercase text-destructive"
          >
            <AlertCircle className="w-3 h-3" strokeWidth={1.8} /> {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

export function validatePhone(v: PhoneValue): string | undefined {
  if (!v.national) return "Required";
  if (!v.valid || !isValidPhoneNumber(v.e164)) return "Please enter a valid phone number";
  return undefined;
}

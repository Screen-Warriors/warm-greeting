import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, ChevronDown, Search } from "lucide-react";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { cn } from "@/lib/utils";

// ISO code -> flag emoji
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
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Auto-detect country on first mount if untouched
  useEffect(() => {
    if (!value.national && value.country === "IN") {
      const detected = detectCountry();
      if (detected !== value.country) onChange(buildValue(detected, ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Outside click / Escape close
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => searchRef.current?.focus(), 40);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  const countries = useMemo(() => {
    const all = getCountries().map((cc) => ({
      code: cc,
      name: countryName(cc) ?? cc,
      calling: `+${getCountryCallingCode(cc)}`,
    }));
    const q = query.trim().toLowerCase();
    const filtered = !q
      ? all
      : all.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q) ||
            c.calling.includes(q.replace(/[^\d+]/g, "")),
        );
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query, open]);

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
    setQuery("");
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, countries.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const c = countries[activeIdx];
      if (c) selectCountry(c.code as CountryCode);
    }
  };

  // keep active row in view
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  const showError = touched && !!error;
  const showSuccess = touched && !error && value.valid;

  return (
    <label htmlFor={id} className="block col-span-2">
      <span className="kicker block mb-2">{label}</span>
      <div
        ref={wrapRef}
        className={cn(
          // Matches Field: h-11, bg-background/40, border, rounded-md
          "relative flex items-stretch w-full h-11 bg-background/40 backdrop-blur border rounded-md transition-all",
          showError
            ? "border-destructive/70 focus-within:border-destructive focus-within:ring-2 focus-within:ring-destructive/20"
            : showSuccess
              ? "border-emerald-500/60 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
              : "border-border/70 focus-within:border-ember focus-within:ring-2 focus-within:ring-ember/25 hover:border-border",
        )}
      >
        {/* Country trigger — fixed compact width */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Country: ${countryName(value.country)}, calling code ${value.countryCode}`}
          className={cn(
            "flex items-center gap-1.5 pl-3 pr-2.5 w-[96px] shrink-0",
            "border-r border-border/60 rounded-l-md",
            "font-mono text-xs text-foreground/90 transition-colors",
            "hover:bg-foreground/[0.04] focus:outline-none focus-visible:bg-foreground/[0.04]",
            open && "bg-foreground/[0.05]",
          )}
        >
          <span className="text-[15px] leading-none" aria-hidden>
            {flag(value.country)}
          </span>
          <span className="tracking-tight">{value.countryCode}</span>
          <ChevronDown
            className={cn(
              "w-3 h-3 ml-auto text-foreground/50 transition-transform duration-200",
              open && "rotate-180 text-ember",
            )}
            strokeWidth={1.8}
          />
        </button>

        {/* Number input — inherits Field typography exactly */}
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

        {/* Success check */}
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

        {/* Dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "absolute z-50 top-[calc(100%+6px)] left-0 w-[320px] max-w-[92vw]",
                "rounded-md border border-border/70 bg-background/95 backdrop-blur-xl",
                "shadow-[0_20px_60px_-20px_rgba(0,0,0,0.85)] overflow-hidden",
              )}
              role="listbox"
            >
              {/* Sticky search — styled like other checkout inputs */}
              <div className="p-2 border-b border-border/60 bg-background/80 backdrop-blur">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/50"
                    strokeWidth={1.6}
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onSearchKey}
                    placeholder="Search country or code"
                    className={cn(
                      "w-full h-9 bg-background/40 border border-border/70 rounded-md",
                      "pl-8 pr-3 font-mono text-xs text-foreground outline-none",
                      "placeholder:text-foreground/40 transition-colors",
                      "focus:border-ember focus:ring-2 focus:ring-ember/25",
                    )}
                  />
                </div>
              </div>

              <ul
                ref={listRef}
                className={cn(
                  "max-h-[280px] overflow-y-auto py-1",
                  "[scrollbar-width:thin]",
                  "[&::-webkit-scrollbar]:w-1.5",
                  "[&::-webkit-scrollbar-track]:bg-transparent",
                  "[&::-webkit-scrollbar-thumb]:bg-foreground/15",
                  "[&::-webkit-scrollbar-thumb]:rounded-full",
                  "hover:[&::-webkit-scrollbar-thumb]:bg-foreground/25",
                )}
              >
                {countries.length === 0 ? (
                  <li className="px-3 py-6 text-center text-xs text-muted-foreground font-mono">
                    No matches
                  </li>
                ) : (
                  countries.map((c, idx) => {
                    const selected = c.code === value.country;
                    const active = idx === activeIdx;
                    return (
                      <li key={c.code}>
                        <button
                          type="button"
                          data-idx={idx}
                          onClick={() => selectCountry(c.code as CountryCode)}
                          onMouseEnter={() => setActiveIdx(idx)}
                          role="option"
                          aria-selected={selected}
                          className={cn(
                            "w-full flex items-center gap-3 pl-3 pr-3.5 py-2 text-left",
                            "text-sm transition-colors relative",
                            active && "bg-foreground/[0.04]",
                            selected && "text-ember",
                          )}
                        >
                          {/* Selected indicator bar */}
                          {selected && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-ember rounded-full" />
                          )}
                          <span className="text-[15px] leading-none" aria-hidden>
                            {flag(c.code)}
                          </span>
                          <span
                            className={cn(
                              "flex-1 truncate text-[13px]",
                              selected ? "text-ember" : "text-foreground/90",
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
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </motion.div>
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

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

// Flag emoji from ISO country code (regional indicator symbols)
const flag = (cc: string) =>
  cc
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

// Rough country name map — fallback to code if unknown
let displayNames: Intl.DisplayNames | null = null;
try {
  displayNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  displayNames = null;
}
const countryName = (cc: string) => displayNames?.of(cc) ?? cc;

// Detect default country from browser locale, fallback IN
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
  country: CountryCode;      // e.g. "IN"
  countryCode: string;       // e.g. "+91"
  national: string;          // digits only, e.g. "9876543210"
  e164: string;              // e.g. "+919876543210"
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

// Sensible max digits per country for hard-cap typing (India = 10)
function maxNationalDigits(country: CountryCode): number {
  // libphonenumber doesn't expose a direct "max digits". Use conservative caps.
  // India strictly 10; most countries ≤ 12; a few (DE) up to 13. Cap at 15 (E.164 max minus CC).
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-detect on first mount if country not set / default
  useEffect(() => {
    if (!value.national && value.country === "IN") {
      const detected = detectCountry();
      if (detected !== value.country) onChange(buildValue(detected, ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click / Escape
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
    setTimeout(() => searchRef.current?.focus(), 30);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
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
    // Sort: exact code match first, then alpha
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [query]);

  const cap = maxNationalDigits(value.country);
  const formatted = useMemo(() => {
    if (!value.national) return "";
    try {
      const ay = new AsYouType(value.country);
      ay.input(`+${getCountryCallingCode(value.country)}${value.national}`);
      // formatNational returns national spacing e.g. "98765 43210"
      return ay.formatNational() || value.national;
    } catch {
      return value.national;
    }
  }, [value.country, value.national]);

  const handleDigits = (raw: string) => {
    // strip everything except digits; drop leading zeros only when equal length would exceed cap
    const digits = raw.replace(/\D/g, "").slice(0, cap);
    onChange(buildValue(value.country, digits));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    // Try full E.164 first — auto switch country if pasted
    const parsed = parsePhoneNumberFromString(text);
    if (parsed && parsed.country && getCountries().includes(parsed.country as CountryCode)) {
      onChange(buildValue(parsed.country as CountryCode, parsed.nationalNumber));
      return;
    }
    handleDigits(text);
  };

  const showError = touched && !!error;
  const showSuccess = touched && !error && value.valid;

  return (
    <label htmlFor={id} className="block col-span-2">
      <span className="kicker block mb-2">{label}</span>
      <div
        ref={wrapRef}
        className={cn(
          "relative flex items-stretch w-full h-11 bg-background/40 backdrop-blur border rounded-md transition-all overflow-visible",
          showError
            ? "border-destructive/70 focus-within:border-destructive focus-within:ring-2 focus-within:ring-destructive/20"
            : showSuccess
              ? "border-emerald-500/60 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
              : "border-border/70 focus-within:border-ember focus-within:ring-2 focus-within:ring-ember/25 hover:border-border",
        )}
      >
        {/* Country selector */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Country: ${countryName(value.country)}, calling code ${value.countryCode}`}
          className="flex items-center gap-1.5 pl-3 pr-2 border-r border-border/70 font-mono text-sm text-foreground hover:bg-foreground/5 rounded-l-md transition-colors focus:outline-none focus:bg-foreground/5"
        >
          <span className="text-base leading-none" aria-hidden>
            {flag(value.country)}
          </span>
          <span className="text-xs text-foreground/90">{value.countryCode}</span>
          <ChevronDown className="w-3 h-3 text-foreground/60" strokeWidth={1.8} />
        </button>

        {/* Number input */}
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
            // Block emoji / letters at input level
            const nativeData = (e as unknown as { data?: string }).data;
            if (nativeData && /[^\d\s\-()]/.test(nativeData)) e.preventDefault();
          }}
          placeholder={value.country === "IN" ? "98765 43210" : "Phone number"}
          className="flex-1 min-w-0 bg-transparent px-3 font-mono text-sm outline-none placeholder:text-foreground/30"
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
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 top-full left-0 mt-1.5 w-[300px] max-w-[92vw] rounded-lg border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden"
              role="listbox"
            >
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60">
                <Search className="w-3.5 h-3.5 text-foreground/60" strokeWidth={1.6} />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search country or code"
                  className="w-full bg-transparent outline-none text-sm placeholder:text-foreground/40"
                />
              </div>
              <ul className="max-h-64 overflow-y-auto py-1">
                {countries.length === 0 ? (
                  <li className="px-3 py-3 text-xs text-muted-foreground font-mono">No matches</li>
                ) : (
                  countries.map((c) => {
                    const selected = c.code === value.country;
                    return (
                      <li key={c.code}>
                        <button
                          type="button"
                          onClick={() => {
                            onChange(buildValue(c.code as CountryCode, value.national.slice(0, maxNationalDigits(c.code as CountryCode))));
                            setOpen(false);
                            setQuery("");
                          }}
                          role="option"
                          aria-selected={selected}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-foreground/5 transition-colors",
                            selected && "bg-ember/10",
                          )}
                        >
                          <span className="text-base leading-none" aria-hidden>{flag(c.code)}</span>
                          <span className="flex-1 truncate">{c.name}</span>
                          <span className="font-mono text-xs text-foreground/60">{c.calling}</span>
                          {selected && <Check className="w-3.5 h-3.5 text-ember" strokeWidth={2} />}
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

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

// Module-level Intl formatters to eliminate thousands of object allocations per render
const integerFormatter = new Intl.NumberFormat("en-US");

export type CurrencyCode = "USD" | "EUR" | "GBP" | "AED" | "CHF";
export type AreaUnit = "sqft" | "sqm";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  symbolPosition: "prefix" | "suffix" | "code";
  rate: number; // Relative to USD = 1.0
  flag: string;
  name: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: "USD",
    symbol: "$",
    symbolPosition: "prefix",
    rate: 1.0,
    flag: "🇺🇸",
    name: "US Dollar",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    symbolPosition: "prefix",
    rate: 0.92,
    flag: "🇪🇺",
    name: "Euro",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    symbolPosition: "prefix",
    rate: 0.79,
    flag: "🇬🇧",
    name: "British Pound",
  },
  AED: {
    code: "AED",
    symbol: "AED",
    symbolPosition: "code",
    rate: 3.67,
    flag: "🇦🇪",
    name: "UAE Dirham",
  },
  CHF: {
    code: "CHF",
    symbol: "CHF",
    symbolPosition: "code",
    rate: 0.89,
    flag: "🇨🇭",
    name: "Swiss Franc",
  },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  unit: AreaUnit;
  setUnit: (unit: AreaUnit) => void;
  formatPrice: (amountInUSD: number) => string;
  formatArea: (sqft: number | string) => string;
  currentCurrencyConfig: CurrencyConfig;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [unit, setUnitState] = useState<AreaUnit>("sqft");

  // Restore saved preference on mount without blocking
  useEffect(() => {
    try {
      const savedCurr = localStorage.getItem("aurelia_currency") as CurrencyCode | null;
      if (savedCurr && CURRENCIES[savedCurr]) {
        setCurrencyState(savedCurr);
      }
      const savedUnit = localStorage.getItem("aurelia_unit") as AreaUnit | null;
      if (savedUnit === "sqft" || savedUnit === "sqm") {
        setUnitState(savedUnit);
      }
    } catch {
      // Ignore storage restrictions
    }
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    try {
      localStorage.setItem("aurelia_currency", code);
    } catch {}
  }, []);

  const setUnit = useCallback((newUnit: AreaUnit) => {
    setUnitState(newUnit);
    try {
      localStorage.setItem("aurelia_unit", newUnit);
    } catch {}
  }, []);

  const formatPrice = useCallback((amountInUSD: number): string => {
    const config = CURRENCIES[currency];
    const converted = Math.round(amountInUSD * config.rate);
    const formattedNum = integerFormatter.format(converted);

    if (config.symbolPosition === "prefix") {
      return `${config.symbol}${formattedNum}`;
    }
    if (config.symbolPosition === "suffix") {
      return `${formattedNum} ${config.symbol}`;
    }
    return `${config.symbol} ${formattedNum}`;
  }, [currency]);

  const formatArea = useCallback((sqftInput: number | string): string => {
    const numericSqft =
      typeof sqftInput === "number"
        ? sqftInput
        : parseInt(String(sqftInput).replace(/[^0-9]/g, ""), 10) || 0;

    if (unit === "sqm") {
      const sqm = Math.round(numericSqft * 0.092903);
      return `${integerFormatter.format(sqm)} m²`;
    }

    return `${integerFormatter.format(numericSqft)} sq ft`;
  }, [unit]);

  const contextValue = useMemo(() => ({
    currency,
    setCurrency,
    unit,
    setUnit,
    formatPrice,
    formatArea,
    currentCurrencyConfig: CURRENCIES[currency],
  }), [currency, setCurrency, unit, setUnit, formatPrice, formatArea]);

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

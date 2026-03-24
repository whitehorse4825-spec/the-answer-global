/** 생년월일 8자리(YYYYMMDD) → ISO YYYY-MM-DD (한국 UX) */

export function digitsOnlyBirth(s: string): string {
  return s.replace(/\D/g, "").slice(0, 8);
}

export function eightDigitsToIso(d: string): string | null {
  if (d.length !== 8) return null;
  const y = Number.parseInt(d.slice(0, 4), 10);
  const m = Number.parseInt(d.slice(4, 6), 10);
  const day = Number.parseInt(d.slice(6, 8), 10);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(day)) {
    return null;
  }
  if (y < 1900 || y > 2100) return null;
  if (m < 1 || m > 12) return null;
  if (day < 1 || day > 31) return null;
  const dt = new Date(y, m - 1, day);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== day
  ) {
    return null;
  }
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

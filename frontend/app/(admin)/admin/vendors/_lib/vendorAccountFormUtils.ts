export function isValidVendorContactEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function extractVendorPhoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

export function formatVendorPhoneNumber(value: string): string {
  const digits = extractVendorPhoneDigits(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

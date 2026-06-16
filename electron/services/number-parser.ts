// Moroccan mobile: 06/07 + 8 digits, or international 2126/2127
const MOROCCAN_PATTERNS = [
  /(?:\+|00)?212[\s.-]?([67][\s.-]?\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})/g,
  /\b0([67][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})\b/g,
  /\b212([67]\d{8})\b/g,
  /\b([67]\d{8})\b/g,
];

export function normalizeMoroccanPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 10 && digits.startsWith('0') && /^0[67]/.test(digits)) {
    return '212' + digits.slice(1);
  }
  if (digits.length === 12 && digits.startsWith('212') && /^212[67]/.test(digits)) {
    return digits;
  }
  if (digits.length === 9 && /^[67]/.test(digits)) {
    return '212' + digits;
  }
  return null;
}

export function toChatId(phone: string): string {
  const normalized = normalizeMoroccanPhone(phone) || phone.replace(/\D/g, '');
  return `${normalized}@c.us`;
}

export function extractMoroccanNumbers(text: string): string[] {
  const found = new Set<string>();

  for (const pattern of MOROCCAN_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const candidate = match[1] || match[0];
      const normalized = normalizeMoroccanPhone(candidate);
      if (normalized) found.add(normalized);
    }
  }

  // Fallback: scan all digit sequences
  const allDigits = text.match(/\d[\d\s.\-]{8,20}\d/g) || [];
  for (const chunk of allDigits) {
    const normalized = normalizeMoroccanPhone(chunk);
    if (normalized) found.add(normalized);
  }

  return Array.from(found);
}

export function formatPhoneDisplay(phone: string): string {
  const n = normalizeMoroccanPhone(phone);
  if (!n) return phone;
  return `+${n.slice(0, 3)} ${n.slice(3, 4)} ${n.slice(4, 6)} ${n.slice(6, 8)} ${n.slice(8, 10)} ${n.slice(10)}`;
}

export function formatPhoneDisplay(phone: string): string {
  const n = phone.replace(/\D/g, '');
  if (n.length === 12 && n.startsWith('212')) {
    return `+${n.slice(0, 3)} ${n.slice(3, 4)} ${n.slice(4, 6)} ${n.slice(6, 8)} ${n.slice(8, 10)} ${n.slice(10)}`;
  }
  return '+' + n;
}

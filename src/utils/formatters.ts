export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp');
}

export function formatNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getEffectivePrice2(price1: number, price2: number, isi: number): number {
  if (price2 && price2 > 0) return price2;
  const ratio = isi > 0 ? isi : 1;
  return price1 * ratio;
}

export function calculateSubtotal(
  qty1: number,
  qty2: number,
  price1: number,
  price2: number,
  isi: number
): number {
  const effectivePrice2 = getEffectivePrice2(price1, price2, isi);
  return (qty1 * price1) + (qty2 * effectivePrice2);
}

export function calculateTotalBaseUnits(qty1: number, qty2: number, isi: number): number {
  const ratio = isi > 0 ? isi : 1;
  return qty1 + (qty2 * ratio);
}

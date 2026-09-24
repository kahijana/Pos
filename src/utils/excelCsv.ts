import * as XLSX from 'xlsx';
import { Product, Transaction } from '../types/pos';
import { DEFAULT_CSV_DATA } from '../data/defaultCsv';

// Helper to parse CSV line handling quotes
function parseCsvLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseProductsFromCsvText(text: string): Product[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Determine delimiter: comma or semicolon
  const headerLine = lines[0];
  const delimiter = headerLine.includes(';') && !headerLine.includes(',') ? ';' : ',';

  const rawHeaders = parseCsvLine(headerLine, delimiter).map((h) =>
    h.toUpperCase().replace(/\s+/g, '_')
  );

  const getIdx = (candidates: string[]): number => {
    for (const c of candidates) {
      const idx = rawHeaders.indexOf(c);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxKodeBarang = getIdx(['KODE_BARANG', 'KODE', 'CODE', 'ID']);
  const idxBarcode = getIdx(['KODE_BARCODE', 'BARCODE']);
  const idxNama = getIdx(['NAMA', 'NAMA_BARANG', 'NAME', 'PRODUK']);
  const idxKategori = getIdx(['KATEGORI', 'CATEGORY']);
  const idxIsi = getIdx(['ISI', 'RATIO', 'ISI_SATUAN']);
  const idxSatuan1 = getIdx(['SATUAN_1', 'SATUAN1', 'UNIT1', 'UNIT_1']);
  const idxSatuan2 = getIdx(['SATUAN_2', 'SATUAN2', 'UNIT2', 'UNIT_2']);
  const idxToko = getIdx(['TOKO', 'STOK_TOKO', 'STOK', 'STOCK']);
  const idxRetail1 = getIdx(['HARGA_RETAIL_1', 'HARGA_JUAL_1', 'HARGA_1', 'PRICE_1']);
  const idxRetail2 = getIdx(['HARGA_RETAIL_2', 'HARGA_JUAL_2', 'HARGA_2', 'PRICE_2']);
  const idxGrosir1 = getIdx(['HARGA_GROSIR_1', 'GROSIR_1']);
  const idxGrosir2 = getIdx(['HARGA_GROSIR_2', 'GROSIR_2']);

  const products: Product[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delimiter);
    if (cols.length < 3) continue;

    const kodeBarang = (idxKodeBarang >= 0 ? cols[idxKodeBarang] : cols[0]) || `ITEM-${i}`;
    const kodeBarcode = (idxBarcode >= 0 ? cols[idxBarcode] : cols[1]) || kodeBarang;
    const nama = (idxNama >= 0 ? cols[idxNama] : cols[2]) || 'Produk ' + i;
    if (!nama || nama === 'a') continue; // filter empty

    const kategori = (idxKategori >= 0 ? cols[idxKategori] : '') || 'Umum';
    const isiNum = parseFloat(idxIsi >= 0 ? cols[idxIsi] : '1');
    const isi = isNaN(isiNum) || isiNum <= 0 ? 1 : isiNum;

    const satuan1 = (idxSatuan1 >= 0 ? cols[idxSatuan1] : 'PCS')?.toUpperCase() || 'PCS';
    const satuan2 = (idxSatuan2 >= 0 ? cols[idxSatuan2] : 'PACK')?.toUpperCase() || 'PACK';
    const stok = parseFloat(idxToko >= 0 ? cols[idxToko] : '0') || 0;

    // Selling prices strictly - NO HPP
    const hargaRetail1 = parseFloat(idxRetail1 >= 0 ? cols[idxRetail1] : '0') || 0;
    let hargaRetail2 = parseFloat(idxRetail2 >= 0 ? cols[idxRetail2] : '0') || 0;
    if (hargaRetail2 === 0 && hargaRetail1 > 0 && isi > 1) {
      hargaRetail2 = hargaRetail1 * isi;
    }

    const hargaGrosir1 = idxGrosir1 >= 0 ? parseFloat(cols[idxGrosir1]) || undefined : undefined;
    const hargaGrosir2 = idxGrosir2 >= 0 ? parseFloat(cols[idxGrosir2]) || undefined : undefined;

    products.push({
      id: `${kodeBarang}-${i}`,
      kodeBarang,
      kodeBarcode,
      nama,
      kategori,
      isi,
      satuan1,
      satuan2,
      stokToko: stok,
      hargaRetail1,
      hargaRetail2,
      hargaGrosir1: hargaGrosir1 && hargaGrosir1 > 0 ? hargaGrosir1 : undefined,
      hargaGrosir2: hargaGrosir2 && hargaGrosir2 > 0 ? hargaGrosir2 : undefined,
    });
  }

  return products;
}

export function getDefaultProducts(): Product[] {
  return parseProductsFromCsvText(DEFAULT_CSV_DATA);
}

export async function parseProductsFromFile(file: File): Promise<Product[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv' || extension === 'txt') {
    const text = await file.text();
    return parseProductsFromCsvText(text);
  }

  // Parse Excel (.xlsx or .xls)
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const csvText = XLSX.utils.sheet_to_csv(worksheet);
  return parseProductsFromCsvText(csvText);
}

export function exportProductsToExcel(products: Product[], filename: string = 'Katalog_Barang_2Satuan.xlsx'): void {
  // CRITICAL: Strictly selling prices only, no modal/HPP
  const rows = products.map((p) => ({
    'KODE BARANG': p.kodeBarang,
    'BARCODE': p.kodeBarcode,
    'NAMA BARANG': p.nama,
    'KATEGORI': p.kategori,
    'ISI (1 SATUAN 2)': p.isi,
    'SATUAN 1': p.satuan1,
    'SATUAN 2': p.satuan2,
    'STOK (SATUAN 1)': p.stokToko,
    'HARGA JUAL 1 (RETAIL)': p.hargaRetail1,
    'HARGA JUAL 2 (RETAIL)': p.hargaRetail2,
    'HARGA JUAL 1 (GROSIR)': p.hargaGrosir1 || '',
    'HARGA JUAL 2 (GROSIR)': p.hargaGrosir2 || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Katalog');
  XLSX.writeFile(workbook, filename);
}

export function exportProductsToCsv(products: Product[], filename: string = 'Katalog_Barang_2Satuan.csv'): void {
  const rows = products.map((p) => ({
    'KODE_BARANG': p.kodeBarang,
    'KODE_BARCODE': p.kodeBarcode,
    'NAMA': p.nama,
    'KATEGORI': p.kategori,
    'ISI': p.isi,
    'SATUAN_1': p.satuan1,
    'SATUAN_2': p.satuan2,
    'TOKO': p.stokToko,
    'HARGA_RETAIL_1': p.hargaRetail1,
    'HARGA_RETAIL_2': p.hargaRetail2,
    'HARGA_GROSIR_1': p.hargaGrosir1 || 0,
    'HARGA_GROSIR_2': p.hargaGrosir2 || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTransactionsToExcel(transactions: Transaction[], filename: string = 'Laporan_Penjualan.xlsx'): void {
  const rows: Record<string, string | number>[] = [];

  transactions.forEach((tx) => {
    tx.items.forEach((item, idx) => {
      rows.push({
        'NO STRUK': tx.receiptNumber,
        'WAKTU': new Date(tx.timestamp).toLocaleString('id-ID'),
        'PELANGGAN': tx.customerName || 'Umum',
        'METODE BAYAR': tx.paymentMethod.toUpperCase(),
        'NAMA BARANG': item.product.nama,
        'QTY SATUAN 1': item.qty1,
        'SATUAN 1': item.product.satuan1,
        'HARGA SATUAN 1': item.price1,
        'QTY SATUAN 2': item.qty2,
        'SATUAN 2': item.product.satuan2,
        'HARGA SATUAN 2': item.price2,
        'SUBTOTAL ITEM': item.subtotal,
        'TOTAL STRUK': idx === 0 ? tx.total : '',
        'DISKON': idx === 0 ? tx.discount : '',
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Penjualan');
  XLSX.writeFile(workbook, filename);
}

export function exportTransactionsToCsv(transactions: Transaction[], filename: string = 'Laporan_Penjualan.csv'): void {
  const rows: Record<string, string | number>[] = [];

  transactions.forEach((tx) => {
    tx.items.forEach((item, idx) => {
      rows.push({
        'NO_STRUK': tx.receiptNumber,
        'WAKTU': new Date(tx.timestamp).toLocaleString('id-ID'),
        'PELANGGAN': tx.customerName || 'Umum',
        'METODE_BAYAR': tx.paymentMethod.toUpperCase(),
        'NAMA_BARANG': item.product.nama,
        'QTY_SATUAN_1': item.qty1,
        'SATUAN_1': item.product.satuan1,
        'HARGA_SATUAN_1': item.price1,
        'QTY_SATUAN_2': item.qty2,
        'SATUAN_2': item.product.satuan2,
        'HARGA_SATUAN_2': item.price2,
        'SUBTOTAL_ITEM': item.subtotal,
        'TOTAL_STRUK': idx === 0 ? tx.total : '',
        'DISKON': idx === 0 ? tx.discount : '',
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

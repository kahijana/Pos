import { useState, useRef } from 'react';
import { Product } from '../types/pos';
import {
  exportProductsToExcel,
  exportProductsToCsv,
  parseProductsFromFile,
  getDefaultProducts,
} from '../utils/excelCsv';
import { formatRupiah } from '../utils/formatters';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';

interface InventoryManagerProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  onResetDefault: () => void;
}

export default function InventoryManager({
  products,
  onUpdateProducts,
  onResetDefault,
}: InventoryManagerProps) {
  const [search, setSearch] = useState('');
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states for adding/editing product (NO HPP/MODAL!)
  const [formData, setFormData] = useState({
    kodeBarang: '',
    kodeBarcode: '',
    nama: '',
    kategori: 'Umum',
    isi: 1,
    satuan1: 'PCS',
    satuan2: 'PACK',
    stokToko: 0,
    hargaRetail1: 0,
    hargaRetail2: 0,
    hargaGrosir1: '',
    hargaGrosir2: '',
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await parseProductsFromFile(file);
      if (imported.length === 0) {
        setImportStatus({
          type: 'error',
          message: 'Format file tidak sesuai atau tidak ada baris data barang yang valid.',
        });
        return;
      }

      // Merge or update products
      const existingMap = new Map(products.map((p) => [p.kodeBarang, p]));
      imported.forEach((p) => {
        existingMap.set(p.kodeBarang, p);
      });

      const updatedList = Array.from(existingMap.values());
      onUpdateProducts(updatedList);

      setImportStatus({
        type: 'success',
        message: `Berhasil mengimpor ${imported.length} data barang dari ${file.name}.`,
      });

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportStatus({
        type: 'error',
        message: `Gagal membaca file: ${msg}`,
      });
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      kodeBarang: 'BRG-' + Date.now().toString().slice(-6),
      kodeBarcode: '',
      nama: '',
      kategori: 'Umum',
      isi: 1,
      satuan1: 'PCS',
      satuan2: 'PACK',
      stokToko: 10,
      hargaRetail1: 0,
      hargaRetail2: 0,
      hargaGrosir1: '',
      hargaGrosir2: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      kodeBarang: p.kodeBarang,
      kodeBarcode: p.kodeBarcode,
      nama: p.nama,
      kategori: p.kategori,
      isi: p.isi,
      satuan1: p.satuan1,
      satuan2: p.satuan2,
      stokToko: p.stokToko,
      hargaRetail1: p.hargaRetail1,
      hargaRetail2: p.hargaRetail2,
      hargaGrosir1: p.hargaGrosir1 ? p.hargaGrosir1.toString() : '',
      hargaGrosir2: p.hargaGrosir2 ? p.hargaGrosir2.toString() : '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus barang ini dari katalog?')) {
      onUpdateProducts(products.filter((p) => p.id !== id));
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.kodeBarang.trim()) return;

    const hGrosir1 = parseFloat(formData.hargaGrosir1);
    const hGrosir2 = parseFloat(formData.hargaGrosir2);

    const newProd: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      kodeBarang: formData.kodeBarang.trim(),
      kodeBarcode: formData.kodeBarcode.trim() || formData.kodeBarang.trim(),
      nama: formData.nama.trim(),
      kategori: formData.kategori.trim() || 'Umum',
      isi: Math.max(1, formData.isi),
      satuan1: formData.satuan1.trim().toUpperCase(),
      satuan2: formData.satuan2.trim().toUpperCase(),
      stokToko: formData.stokToko,
      hargaRetail1: formData.hargaRetail1,
      hargaRetail2:
        formData.hargaRetail2 > 0
          ? formData.hargaRetail2
          : formData.hargaRetail1 * formData.isi,
      hargaGrosir1: !isNaN(hGrosir1) && hGrosir1 > 0 ? hGrosir1 : undefined,
      hargaGrosir2: !isNaN(hGrosir2) && hGrosir2 > 0 ? hGrosir2 : undefined,
    };

    if (editingProduct) {
      onUpdateProducts(products.map((p) => (p.id === editingProduct.id ? newProd : p)));
    } else {
      onUpdateProducts([newProd, ...products]);
    }

    setIsFormOpen(false);
  };

  const filtered = products.filter(
    (p) =>
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.kodeBarang.toLowerCase().includes(search.toLowerCase()) ||
      p.kodeBarcode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header & Actions Card */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Kelola Inventaris & Data</h2>
            <p className="text-xs text-slate-500">
              Total {products.length} barang terdaftar (Harga Jual 2 Satuan)
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </div>

        {/* Excel & CSV Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          {/* Import */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileUpload}
              className="hidden"
              id="upload-file-input"
            />
            <label
              htmlFor="upload-file-input"
              className="min-h-[44px] w-full px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>Import Excel/CSV</span>
            </label>
          </div>

          {/* Export Excel */}
          <button
            onClick={() => exportProductsToExcel(products)}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>

        {/* Secondary Export & Reset options */}
        <div className="flex items-center justify-between text-xs pt-1">
          <button
            onClick={() => exportProductsToCsv(products)}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium py-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Kembalikan katalog ke data awal default CSV?')) {
                onResetDefault();
                setImportStatus({
                  type: 'success',
                  message: 'Katalog berhasil dikembalikan ke data default.',
                });
              }
            }}
            className="text-amber-700 hover:text-amber-800 flex items-center gap-1 font-medium py-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data Awal</span>
          </button>
        </div>

        {/* Status Alerts */}
        {importStatus && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center justify-between ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
            <button onClick={() => setImportStatus(null)} className="p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari data barang di inventaris..."
          className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      {/* Product List */}
      <div className="space-y-2">
        {filtered.slice(0, 40).map((p) => (
          <div
            key={p.id}
            className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{p.nama}</h4>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                <span>{p.kodeBarang}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-sans font-medium">
                  1 {p.satuan2} = {p.isi} {p.satuan1}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs">
                <span className="text-slate-700">
                  {p.satuan1}: <strong>{formatRupiah(p.hargaRetail1)}</strong>
                </span>
                <span className="text-emerald-700">
                  {p.satuan2}: <strong>{formatRupiah(p.hargaRetail2)}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleOpenEdit(p)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Edit Barang"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Hapus Barang"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal (STRICTLY NO HPP) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Data Barang' : 'Tambah Barang Baru'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Barang *</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: BATERAI ABC AA"
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kode Barang *</label>
                  <input
                    type="text"
                    required
                    value={formData.kodeBarang}
                    onChange={(e) => setFormData({ ...formData, kodeBarang: e.target.value })}
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kode Barcode</label>
                  <input
                    type="text"
                    value={formData.kodeBarcode}
                    onChange={(e) => setFormData({ ...formData, kodeBarcode: e.target.value })}
                    placeholder="Barcode scan"
                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Multi-Satuan Definition */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="font-bold text-slate-800 block">Pengaturan 2 Satuan</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">Satuan 1 (Kecil)</label>
                    <input
                      type="text"
                      required
                      value={formData.satuan1}
                      onChange={(e) => setFormData({ ...formData, satuan1: e.target.value.toUpperCase() })}
                      placeholder="PCS"
                      className="w-full h-9 px-2 text-center uppercase font-semibold border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">Satuan 2 (Besar)</label>
                    <input
                      type="text"
                      required
                      value={formData.satuan2}
                      onChange={(e) => setFormData({ ...formData, satuan2: e.target.value.toUpperCase() })}
                      placeholder="PACK"
                      className="w-full h-9 px-2 text-center uppercase font-semibold border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">Isi (Ratio)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.isi}
                      onChange={(e) => setFormData({ ...formData, isi: parseInt(e.target.value) || 1 })}
                      className="w-full h-9 px-2 text-center font-bold border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  Artinya: 1 {formData.satuan2 || 'PACK'} berisi {formData.isi || 1} {formData.satuan1 || 'PCS'}
                </p>
              </div>

              {/* Selling Prices (NO HPP) */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <span className="font-bold text-emerald-950 block">Harga Jual Retail</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">
                      Harga {formData.satuan1} (Rp) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.hargaRetail1 || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, hargaRetail1: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Contoh: 15000"
                      className="w-full h-9 px-2 text-right font-semibold border border-slate-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-0.5">
                      Harga {formData.satuan2} (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.hargaRetail2 || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, hargaRetail2: parseFloat(e.target.value) || 0 })
                      }
                      placeholder={`Otomatis (${(formData.hargaRetail1 || 0) * (formData.isi || 1)})`}
                      className="w-full h-9 px-2 text-right font-semibold border border-slate-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 min-h-[44px] rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

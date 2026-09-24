import { useState, useMemo } from 'react';
import { Product } from '../types/pos';
import { formatRupiah, getEffectivePrice2 } from '../utils/formatters';
import { Camera, Search, Layers, ShoppingBag, ArrowRight } from 'lucide-react';

interface PriceCheckViewProps {
  products: Product[];
  onOpenScanner: () => void;
  onAddToCart: (product: Product, unit: 'satuan1' | 'satuan2') => void;
  searchedBarcode?: string | null;
}

export default function PriceCheckView({
  products,
  onOpenScanner,
  onAddToCart,
  searchedBarcode,
}: PriceCheckViewProps) {
  const [searchQuery, setSearchQuery] = useState(searchedBarcode || '');
  const [selectedKategori, setSelectedKategori] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.kategori) set.add(p.kategori);
    });
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedKategori !== 'all') {
      result = result.filter((p) => p.kategori === selectedKategori);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.nama.toLowerCase().includes(q) ||
          p.kodeBarang.toLowerCase().includes(q) ||
          p.kodeBarcode.toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, searchQuery, selectedKategori]);

  return (
    <div className="space-y-4 pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-bold">Cek Harga 2 Satuan</h2>
            <p className="text-xs text-slate-300">
              Cek harga jual eceran & grosir tanpa akses modal
            </p>
          </div>
          <button
            onClick={onOpenScanner}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Kamera</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama barang atau scan barcode..."
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Categories Horizontal Filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedKategori('all')}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedKategori === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedKategori(cat)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedKategori === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Menampilkan {filteredProducts.length} barang</span>
        {searchQuery && <span>Kata kunci: &quot;{searchQuery}&quot;</span>}
      </div>

      {/* Products Price Cards */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-sm font-medium text-slate-700">Barang Tidak Ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">
              Coba cari dengan nama lain atau barcode yang sesuai.
            </p>
          </div>
        ) : (
          filteredProducts.slice(0, 50).map((product) => {
            const price1 = product.hargaRetail1;
            const price2 = getEffectivePrice2(price1, product.hargaRetail2, product.isi);
            const grosir1 = product.hargaGrosir1;
            const grosir2 = product.hargaGrosir2
              ? getEffectivePrice2(grosir1 || price1, product.hargaGrosir2, product.isi)
              : undefined;

            return (
              <div
                key={product.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
              >
                {/* Product Name & Code */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {product.nama}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                      <span>Kode: {product.kodeBarang}</span>
                      {product.kodeBarcode !== product.kodeBarang && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Barcode: {product.kodeBarcode}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">
                    <Layers className="w-3.5 h-3.5" />
                    <span>1 {product.satuan2} = {product.isi} {product.satuan1}</span>
                  </div>
                </div>

                {/* Primary Price Cards: Satuan 1 vs Satuan 2 */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Satuan 1 Price */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Harga Satuan 1 ({product.satuan1})
                    </span>
                    <div className="text-base font-extrabold text-slate-900 tabular-nums mt-0.5">
                      {formatRupiah(price1)}
                    </div>
                    {grosir1 && grosir1 > 0 && (
                      <div className="text-[10px] text-slate-500 mt-1">
                        Grosir: <strong className="text-slate-800">{formatRupiah(grosir1)}</strong>
                      </div>
                    )}
                    <button
                      onClick={() => onAddToCart(product, 'satuan1')}
                      className="mt-2 w-full min-h-[36px] py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                    >
                      <ShoppingBag className="w-3 h-3 text-slate-600" />
                      <span>+1 {product.satuan1}</span>
                    </button>
                  </div>

                  {/* Satuan 2 Price */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Harga Satuan 2 ({product.satuan2})
                    </span>
                    <div className="text-base font-extrabold text-emerald-700 tabular-nums mt-0.5">
                      {formatRupiah(price2)}
                    </div>
                    {grosir2 && grosir2 > 0 && (
                      <div className="text-[10px] text-emerald-800 mt-1">
                        Grosir: <strong>{formatRupiah(grosir2)}</strong>
                      </div>
                    )}
                    <button
                      onClick={() => onAddToCart(product, 'satuan2')}
                      className="mt-2 w-full min-h-[36px] py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-colors shadow-xs"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>+1 {product.satuan2}</span>
                    </button>
                  </div>
                </div>

                {/* Savings or info note */}
                {product.isi > 1 && (
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span>
                      Beli 1 {product.satuan2} setara {product.isi} {product.satuan1}
                    </span>
                    {price2 < price1 * product.isi && (
                      <span className="text-emerald-700 font-medium">
                        Hemat {formatRupiah((price1 * product.isi) - price2)} / {product.satuan2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {filteredProducts.length > 50 && (
          <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
            Menampilkan 50 barang teratas. Gunakan pencarian untuk menyaring lebih spesifik.
          </div>
        )}
      </div>
    </div>
  );
}

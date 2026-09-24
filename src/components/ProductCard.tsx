import { Product, PriceTier } from '../types/pos';
import { formatRupiah, getEffectivePrice2 } from '../utils/formatters';
import { Plus, ShoppingBag, Layers } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  priceTier: PriceTier;
  onAddSatuan1: (product: Product) => void;
  onAddSatuan2: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
  cartCount1?: number;
  cartCount2?: number;
}

export default function ProductCard({
  product,
  priceTier,
  onAddSatuan1,
  onAddSatuan2,
  onOpenDetails,
  cartCount1 = 0,
  cartCount2 = 0,
}: ProductCardProps) {
  const price1 =
    priceTier === 'grosir' && product.hargaGrosir1 && product.hargaGrosir1 > 0
      ? product.hargaGrosir1
      : product.hargaRetail1;

  const basePrice2 =
    priceTier === 'grosir' && product.hargaGrosir2 && product.hargaGrosir2 > 0
      ? product.hargaGrosir2
      : product.hargaRetail2;

  const price2 = getEffectivePrice2(price1, basePrice2, product.isi);
  const isInCart = cartCount1 > 0 || cartCount2 > 0;

  return (
    <div className={`relative bg-white rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
      isInCart ? 'border-emerald-500/80 ring-1 ring-emerald-500/30' : 'border-slate-200/90 hover:border-slate-300'
    }`}>
      {/* Top Header & Product Info */}
      <div
        onClick={() => onOpenDetails(product)}
        className="p-3.5 pb-2 cursor-pointer flex-1"
        role="button"
        tabIndex={0}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
              {product.nama}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
              <span className="font-mono text-slate-600">{product.kodeBarang}</span>
              {product.kategori && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{product.kategori}</span>
                </>
              )}
            </div>
          </div>

          {/* Ratio Tag */}
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md">
              <Layers className="w-3 h-3 text-slate-500" />
              <span>1 {product.satuan2} = {product.isi} {product.satuan1}</span>
            </div>
          </div>
        </div>

        {/* 2 Satuan Price Display */}
        <div className="grid grid-cols-2 gap-2 mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
          {/* Satuan 1 Price */}
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-medium tracking-wider text-slate-500 block truncate">
              {product.satuan1}
            </span>
            <div className="text-xs font-semibold text-slate-900 tabular-nums">
              {formatRupiah(price1)}
            </div>
          </div>

          {/* Satuan 2 Price */}
          <div className="min-w-0 border-l border-slate-200 pl-2">
            <span className="text-[10px] uppercase font-medium tracking-wider text-emerald-700 block truncate">
              {product.satuan2}
            </span>
            <div className="text-xs font-semibold text-emerald-700 tabular-nums">
              {formatRupiah(price2)}
            </div>
          </div>
        </div>

        {/* In Cart Indicator */}
        {isInCart && (
          <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700 font-medium px-1">
            <span className="flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" />
              Dalam Keranjang:
            </span>
            <span className="tabular-nums">
              {cartCount2 > 0 ? `${cartCount2} ${product.satuan2}` : ''}
              {cartCount2 > 0 && cartCount1 > 0 ? ' + ' : ''}
              {cartCount1 > 0 ? `${cartCount1} ${product.satuan1}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Dual Unit Action Buttons */}
      <div className="grid grid-cols-2 gap-1.5 p-2 pt-0 border-t border-slate-100 mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddSatuan1(product);
          }}
          className="min-h-[44px] flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 text-xs font-medium transition-all"
          title={`Tambah 1 ${product.satuan1}`}
        >
          <Plus className="w-3.5 h-3.5 text-slate-600" />
          <span className="truncate">+1 {product.satuan1}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddSatuan2(product);
          }}
          className="min-h-[44px] flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-medium transition-all shadow-xs"
          title={`Tambah 1 ${product.satuan2}`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="truncate">+1 {product.satuan2}</span>
        </button>
      </div>
    </div>
  );
}

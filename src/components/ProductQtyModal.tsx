import { useState, useEffect } from 'react';
import { Product, PriceTier } from '../types/pos';
import { formatRupiah, getEffectivePrice2, calculateSubtotal, calculateTotalBaseUnits } from '../utils/formatters';
import { X, Plus, Minus, Check, Layers } from 'lucide-react';
import { playScanSuccessSound } from '../utils/audio';

interface ProductQtyModalProps {
  product: Product | null;
  priceTier: PriceTier;
  initialQty1?: number;
  initialQty2?: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product, qty1: number, qty2: number) => void;
}

export default function ProductQtyModal({
  product,
  priceTier,
  initialQty1 = 0,
  initialQty2 = 0,
  isOpen,
  onClose,
  onSave,
}: ProductQtyModalProps) {
  const [qty1, setQty1] = useState(initialQty1);
  const [qty2, setQty2] = useState(initialQty2);

  useEffect(() => {
    if (isOpen) {
      setQty1(initialQty1);
      setQty2(initialQty2);
    }
  }, [isOpen, initialQty1, initialQty2]);

  if (!isOpen || !product) return null;

  const price1 =
    priceTier === 'grosir' && product.hargaGrosir1 && product.hargaGrosir1 > 0
      ? product.hargaGrosir1
      : product.hargaRetail1;

  const basePrice2 =
    priceTier === 'grosir' && product.hargaGrosir2 && product.hargaGrosir2 > 0
      ? product.hargaGrosir2
      : product.hargaRetail2;

  const price2 = getEffectivePrice2(price1, basePrice2, product.isi);
  const subtotal = calculateSubtotal(qty1, qty2, price1, price2, product.isi);
  const totalBaseUnits = calculateTotalBaseUnits(qty1, qty2, product.isi);

  const handleSave = () => {
    playScanSuccessSound();
    onSave(product, qty1, qty2);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="min-w-0 pr-2">
            <h2 className="text-base font-semibold text-slate-900 truncate">
              {product.nama}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-mono">{product.kodeBarang}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Layers className="w-3 h-3" />
                1 {product.satuan2} = {product.isi} {product.satuan1}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Unit Inputs */}
        <div className="p-4 space-y-4">
          {/* Unit 2 (e.g. PACK / GROSIR / DUS) */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
                  Satuan Besar ({product.satuan2})
                </span>
                <p className="text-xs text-emerald-700 tabular-nums">
                  {formatRupiah(price2)} per {product.satuan2}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Subtotal</span>
                <span className="text-sm font-semibold text-slate-900 tabular-nums">
                  {formatRupiah(qty2 * price2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty2(Math.max(0, qty2 - 1))}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 active:scale-95 transition-all"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                min="0"
                value={qty2 || ''}
                placeholder="0"
                onChange={(e) => setQty2(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 h-11 text-center font-bold text-lg bg-white border border-emerald-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => setQty2(qty2 + 1)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-xs"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Unit 1 (e.g. PCS / ECERAN) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Satuan Kecil ({product.satuan1})
                </span>
                <p className="text-xs text-slate-500 tabular-nums">
                  {formatRupiah(price1)} per {product.satuan1}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Subtotal</span>
                <span className="text-sm font-semibold text-slate-900 tabular-nums">
                  {formatRupiah(qty1 * price1)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty1(Math.max(0, qty1 - 1))}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 active:scale-95 transition-all"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                min="0"
                value={qty1 || ''}
                placeholder="0"
                onChange={(e) => setQty1(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 h-11 text-center font-bold text-lg bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                onClick={() => setQty1(qty1 + 1)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition-all shadow-xs"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Total Summary Breakdown */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Total Kuantitas Ekuivalen</span>
              <div className="text-xs font-semibold text-slate-800">
                {totalBaseUnits} {product.satuan1}
                {qty2 > 0 && ` (${qty2} ${product.satuan2} + ${qty1} ${product.satuan1})`}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Total Harga</span>
              <div className="text-base font-bold text-emerald-700 tabular-nums">
                {formatRupiah(subtotal)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 pt-0 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex-2 min-h-[44px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Simpan ke Keranjang</span>
          </button>
        </div>
      </div>
    </div>
  );
}

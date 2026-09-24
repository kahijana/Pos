import { useState } from 'react';
import { CartItem, PriceTier, Transaction } from '../types/pos';
import { formatRupiah, formatNumber } from '../utils/formatters';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Banknote,
  QrCode,
  CreditCard,
  FileText,
  User,
  CheckCircle2,
} from 'lucide-react';
import { playCheckoutSuccessSound } from '../utils/audio';

interface CartOrderPanelProps {
  cart: CartItem[];
  priceTier: PriceTier;
  onPriceTierChange: (tier: PriceTier) => void;
  onUpdateQty: (productId: string, qty1: number, qty2: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCompleteTransaction: (transaction: Transaction) => void;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export default function CartOrderPanel({
  cart,
  priceTier,
  onPriceTierChange,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onCompleteTransaction,
  onClose,
  isEmbedded = false,
}: CartOrderPanelProps) {
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris' | 'transfer' | 'bon'>('tunai');
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [discountInput, setDiscountInput] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const rawSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = Math.max(0, parseInt(discountInput) || 0);
  const totalAmount = Math.max(0, rawSubtotal - discountAmount);

  const cashReceived = paymentMethod === 'tunai' ? (parseInt(cashReceivedInput) || totalAmount) : totalAmount;
  const change = Math.max(0, cashReceived - totalAmount);

  // Quick cash options
  const quickCashOptions = [
    totalAmount,
    Math.ceil(totalAmount / 10000) * 10000,
    Math.ceil(totalAmount / 20000) * 20000,
    Math.ceil(totalAmount / 50000) * 50000,
    Math.ceil(totalAmount / 100000) * 100000,
  ].filter((val, index, self) => val >= totalAmount && self.indexOf(val) === index && val > 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const receiptNumber = 'INV-' + Date.now().toString().slice(-6);
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      receiptNumber,
      timestamp: Date.now(),
      items: [...cart],
      subtotal: rawSubtotal,
      discount: discountAmount,
      total: totalAmount,
      paymentMethod,
      cashReceived,
      change,
      customerName: customerName.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    playCheckoutSuccessSound();
    onCompleteTransaction(newTransaction);
    onClearCart();
    setCashReceivedInput('');
    setDiscountInput('');
    setCustomerName('');
    setNotes('');
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {isEmbedded ? 'Register Kasir' : 'Keranjang Transaksi'}
          </h2>
          <p className="text-[11px] text-slate-500">
            {cart.length} barang · Total {formatRupiah(totalAmount)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="min-h-[36px] px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Kosongkan Keranjang"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Pricing Tier Selector */}
      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Tarif Harga:</span>
        <div className="flex p-0.5 bg-slate-200 rounded-xl">
          <button
            onClick={() => onPriceTierChange('retail')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              priceTier === 'retail' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Retail
          </button>
          <button
            onClick={() => onPriceTierChange('grosir')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              priceTier === 'grosir' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Grosir
          </button>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Banknote className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Keranjang Masih Kosong</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Klik tombol satuan atau scan barcode barang untuk menambahkan.
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product.id}
              className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {item.product.nama}
                  </h4>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {item.product.kodeBarang} · 1 {item.product.satuan2} = {item.product.isi} {item.product.satuan1}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Unit Controls: Satuan 1 & Satuan 2 */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                {/* Satuan 1 Counter */}
                <div className="p-1.5 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div className="min-w-0 pr-1">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block truncate">
                      {item.product.satuan1}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      @{formatNumber(item.price1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        onUpdateQty(item.product.id, Math.max(0, item.qty1 - 1), item.qty2)
                      }
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs tabular-nums text-slate-900">
                      {item.qty1}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item.product.id, item.qty1 + 1, item.qty2)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Satuan 2 Counter */}
                <div className="p-1.5 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between">
                  <div className="min-w-0 pr-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block truncate">
                      {item.product.satuan2}
                    </span>
                    <span className="text-[10px] text-emerald-700 block truncate">
                      @{formatNumber(item.price2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        onUpdateQty(item.product.id, item.qty1, Math.max(0, item.qty2 - 1))
                      }
                      className="w-6 h-6 rounded-lg bg-white border border-emerald-200 flex items-center justify-center text-slate-700 hover:bg-emerald-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs tabular-nums text-emerald-950">
                      {item.qty2}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item.product.id, item.qty1, item.qty2 + 1)}
                      className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Item Subtotal */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50 font-medium">
                <span className="text-slate-400 text-[10px]">
                  Ekuivalen: {item.qty2 * item.product.isi + item.qty1} {item.product.satuan1}
                </span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Checkout Section */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3 shrink-0">
        {/* Customer & Discount inputs */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="relative">
            <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Pelanggan (opsional)"
              className="w-full h-8 pl-8 pr-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <input
              type="number"
              min="0"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder="Diskon (Rp)"
              className="w-full h-8 px-2.5 text-right rounded-xl bg-white border border-slate-200 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'tunai', label: 'Tunai', icon: Banknote },
            { id: 'qris', label: 'QRIS', icon: QrCode },
            { id: 'transfer', label: 'Transfer', icon: CreditCard },
            { id: 'bon', label: 'Bon', icon: FileText },
          ].map((pm) => {
            const Icon = pm.icon;
            const isSelected = paymentMethod === pm.id;
            return (
              <button
                key={pm.id}
                onClick={() => setPaymentMethod(pm.id as typeof paymentMethod)}
                className={`min-h-[38px] py-1 px-1 rounded-xl text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{pm.label}</span>
              </button>
            );
          })}
        </div>

        {/* Cash Calculation (if Tunai) */}
        {paymentMethod === 'tunai' && (
          <div className="p-2.5 bg-white border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Uang Diterima:</span>
              <div className="relative w-36">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                <input
                  type="number"
                  value={cashReceivedInput}
                  onChange={(e) => setCashReceivedInput(e.target.value)}
                  placeholder={totalAmount.toString()}
                  className="w-full h-8 pl-8 pr-2 text-right rounded-xl border border-slate-200 font-bold text-xs text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick cash chips */}
            {quickCashOptions.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-0.5">
                {quickCashOptions.slice(0, 4).map((val) => (
                  <button
                    key={val}
                    onClick={() => setCashReceivedInput(val.toString())}
                    className="min-h-[26px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-800 whitespace-nowrap"
                  >
                    {val === totalAmount ? 'Uang Pas' : formatNumber(val)}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className="font-medium text-slate-500">Kembalian:</span>
              <span className="font-extrabold text-emerald-700 text-sm tabular-nums">
                {formatRupiah(change)}
              </span>
            </div>
          </div>
        )}

        {/* Summary Totals */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="tabular-nums">{formatRupiah(rawSubtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>Diskon:</span>
              <span className="tabular-nums">-{formatRupiah(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
            <span className="font-bold text-sm text-slate-900">Total Tagihan:</span>
            <span className="font-extrabold text-base text-slate-900 tabular-nums">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>

        {/* Big Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="w-full min-h-[48px] py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Selesaikan Transaksi ({formatRupiah(totalAmount)})</span>
        </button>
      </div>
    </div>
  );
}

import { Transaction } from '../types/pos';
import { formatRupiah, formatDate } from '../utils/formatters';
import { X, Printer, Share2, Check, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onNewTransaction: () => void;
}

export default function ReceiptModal({
  transaction,
  isOpen,
  onClose,
  onNewTransaction,
}: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppText = (): string => {
    let text = `*STRUK PENJUALAN*\n`;
    text += `No: ${transaction.receiptNumber}\n`;
    text += `Waktu: ${formatDate(transaction.timestamp)}\n`;
    if (transaction.customerName) text += `Pelanggan: ${transaction.customerName}\n`;
    text += `--------------------------------\n`;

    transaction.items.forEach((item) => {
      text += `*${item.product.nama}*\n`;
      if (item.qty2 > 0) {
        text += `  ${item.qty2} ${item.product.satuan2} x ${formatRupiah(item.price2)} = ${formatRupiah(item.qty2 * item.price2)}\n`;
      }
      if (item.qty1 > 0) {
        text += `  ${item.qty1} ${item.product.satuan1} x ${formatRupiah(item.price1)} = ${formatRupiah(item.qty1 * item.price1)}\n`;
      }
    });

    text += `--------------------------------\n`;
    text += `Subtotal: ${formatRupiah(transaction.subtotal)}\n`;
    if (transaction.discount > 0) text += `Diskon: -${formatRupiah(transaction.discount)}\n`;
    text += `*TOTAL: ${formatRupiah(transaction.total)}*\n`;
    text += `Bayar (${transaction.paymentMethod.toUpperCase()}): ${formatRupiah(transaction.cashReceived)}\n`;
    text += `Kembalian: ${formatRupiah(transaction.change)}\n`;
    text += `--------------------------------\n`;
    text += `Terima kasih atas kunjungan Anda!\n`;
    return encodeURIComponent(text);
  };

  const handleShareWhatsApp = () => {
    const text = generateWhatsAppText();
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyText = async () => {
    const rawText = decodeURIComponent(generateWhatsAppText());
    await navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <span className="text-xs font-semibold text-slate-700">Struk Transaksi Penjualan</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Body */}
        <div id="thermal-receipt" className="p-5 font-mono text-xs text-slate-800 bg-white space-y-3">
          {/* Header */}
          <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
            <h1 className="font-bold text-base text-slate-900 font-sans tracking-tight">
              KASIR DUA SATUAN
            </h1>
            <p className="text-[11px] text-slate-500 font-sans">
              POS Penjualan Cepat & Multi-Satuan
            </p>
            <div className="pt-2 text-[10px] text-slate-600 flex justify-between">
              <span>{transaction.receiptNumber}</span>
              <span>{formatDate(transaction.timestamp)}</span>
            </div>
            {transaction.customerName && (
              <div className="text-[10px] text-left text-slate-700">
                Plg: {transaction.customerName}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
            {transaction.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="font-semibold text-slate-900 leading-tight">
                  {item.product.nama}
                </div>
                {item.qty2 > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-600 pl-2">
                    <span>
                      {item.qty2} {item.product.satuan2} @ {formatRupiah(item.price2)}
                    </span>
                    <span className="tabular-nums font-medium text-slate-900">
                      {formatRupiah(item.qty2 * item.price2)}
                    </span>
                  </div>
                )}
                {item.qty1 > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-600 pl-2">
                    <span>
                      {item.qty1} {item.product.satuan1} @ {formatRupiah(item.price1)}
                    </span>
                    <span className="tabular-nums font-medium text-slate-900">
                      {formatRupiah(item.qty1 * item.price1)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="tabular-nums">{formatRupiah(transaction.subtotal)}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Diskon:</span>
                <span className="tabular-nums">-{formatRupiah(transaction.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
              <span>TOTAL:</span>
              <span className="tabular-nums">{formatRupiah(transaction.total)}</span>
            </div>
            <div className="flex justify-between text-[11px] pt-1">
              <span>Bayar ({transaction.paymentMethod.toUpperCase()}):</span>
              <span className="tabular-nums">{formatRupiah(transaction.cashReceived)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Kembalian:</span>
              <span className="tabular-nums font-semibold">{formatRupiah(transaction.change)}</span>
            </div>
          </div>

          {/* Footer message */}
          <div className="text-center text-[10px] text-slate-500 pt-1">
            <p>Barang yang sudah dibeli tidak dapat ditukar.</p>
            <p className="mt-0.5 font-sans font-medium">Terima kasih atas kunjungan Anda!</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Struk</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>Kirim WhatsApp</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyText}
              className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors"
            >
              {copied ? 'Teks Tersalin!' : 'Salin Teks Nota'}
            </button>
            <button
              onClick={onNewTransaction}
              className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-1 hover:bg-slate-800 transition-colors shadow-xs"
            >
              <span>Transaksi Baru</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

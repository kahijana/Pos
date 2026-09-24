import { Transaction } from '../types/pos';
import { formatRupiah, formatDate } from '../utils/formatters';
import { exportTransactionsToExcel, exportTransactionsToCsv } from '../utils/excelCsv';
import { FileSpreadsheet, Download, Receipt, ArrowRight, TrendingUp } from 'lucide-react';

interface TransactionHistoryViewProps {
  transactions: Transaction[];
  onSelectReceipt: (tx: Transaction) => void;
}

export default function TransactionHistoryView({
  transactions,
  onSelectReceipt,
}: TransactionHistoryViewProps) {
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.total, 0);

  return (
    <div className="space-y-4 pb-24">
      {/* Summary Cards */}
      <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Total Penjualan Selesai</span>
            <div className="text-2xl font-extrabold tabular-nums tracking-tight">
              {formatRupiah(totalRevenue)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Total Struk</span>
            <div className="text-lg font-bold tabular-nums">
              {transactions.length}
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => exportTransactionsToExcel(transactions)}
            disabled={transactions.length === 0}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Laporan Excel</span>
          </button>
          <button
            onClick={() => exportTransactionsToCsv(transactions)}
            disabled={transactions.length === 0}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Daftar Struk Penjualan
        </h3>

        {transactions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Belum Ada Transaksi</p>
            <p className="text-xs text-slate-400 mt-1">
              Transaksi yang Anda selesaikan di kasir akan tercatat di sini.
            </p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              onClick={() => onSelectReceipt(tx)}
              className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {tx.receiptNumber}
                  </span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {tx.paymentMethod}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {formatDate(tx.timestamp)}
                  {tx.customerName && ` · ${tx.customerName}`}
                </div>
                <div className="text-xs text-slate-600 mt-1 line-clamp-1">
                  {tx.items.map((i) => `${i.product.nama} (${i.qty2 > 0 ? `${i.qty2} ${i.product.satuan2}` : ''}${i.qty2 > 0 && i.qty1 > 0 ? '+' : ''}${i.qty1 > 0 ? `${i.qty1} ${i.product.satuan1}` : ''})`).join(', ')}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  {formatRupiah(tx.total)}
                </div>
                <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-700 font-medium mt-1">
                  <span>Lihat Struk</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

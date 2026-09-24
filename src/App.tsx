import { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, CartItem, PriceTier, Transaction } from './types/pos';
import { getDefaultProducts, fetchProductsFromGoogleSheets } from './utils/excelCsv';
import { formatRupiah, calculateSubtotal, getEffectivePrice2 } from './utils/formatters';
import { playScanSuccessSound } from './utils/audio';
import ProductCard from './components/ProductCard';
import ProductQtyModal from './components/ProductQtyModal';
import CartDrawer from './components/CartDrawer';
import CartOrderPanel from './components/CartOrderPanel';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import ReceiptModal from './components/ReceiptModal';
import PriceCheckView from './components/PriceCheckView';
import InventoryManager from './components/InventoryManager';
import TransactionHistoryView from './components/TransactionHistoryView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  ShoppingBag,
  Camera,
  Search,
  Receipt,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Cloud,
  RefreshCw,
} from 'lucide-react';

const STORAGE_KEYS = {
  PRODUCTS: 'kasir_2satuan_products',
  TRANSACTIONS: 'kasir_2satuan_txs',
  CART: 'kasir_2satuan_cart',
  PRICE_TIER: 'kasir_2satuan_tier',
  GSHEET_URL: 'kasir_2satuan_gsheet_url',
  GSHEET_AUTO_SYNC: 'kasir_2satuan_gsheet_auto_sync',
  LAST_SYNC_TIME: 'kasir_2satuan_last_sync_time',
};

export const DEFAULT_GSHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSYXPCzjV8rs1-jzmcCc1STZ0aU5ziO88kBdW4mGo8jKE5YotBFg4oeo-pBd3qagezMYYdQmY8wxuiB/pubhtml';

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return getDefaultProducts();
  });

  const [gsheetUrl, setGsheetUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.GSHEET_URL) || DEFAULT_GSHEET_URL;
  });

  const [autoSync, setAutoSync] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GSHEET_AUTO_SYNC);
    return saved !== null ? saved === 'true' : true;
  });

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME) || null;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [priceTier, setPriceTier] = useState<PriceTier>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRICE_TIER);
      if (saved === 'retail' || saved === 'grosir') return saved;
    } catch {
      // ignore
    }
    return 'retail';
  });

  const [activeTab, setActiveTab] = useState<'kasir' | 'cek-harga' | 'riwayat' | 'inventaris'>('kasir');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals & Drawers
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch {
      // ignore
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRICE_TIER, priceTier);
    } catch {
      // ignore
    }
  }, [priceTier]);

  const handleSaveGsheetUrl = (url: string) => {
    setGsheetUrl(url);
    try {
      localStorage.setItem(STORAGE_KEYS.GSHEET_URL, url);
    } catch {
      // ignore
    }
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSync(enabled);
    try {
      localStorage.setItem(STORAGE_KEYS.GSHEET_AUTO_SYNC, String(enabled));
    } catch {
      // ignore
    }
  };

  const handleSyncGoogleSheets = useCallback(
    async (customUrl?: string): Promise<{ success: boolean; count?: number; message?: string }> => {
      const urlToUse = (customUrl !== undefined ? customUrl : gsheetUrl).trim();
      if (!urlToUse) {
        return { success: false, message: 'URL Google Sheets belum diisi.' };
      }

      setIsSyncing(true);
      try {
        const fetchedProducts = await fetchProductsFromGoogleSheets(urlToUse);
        if (fetchedProducts.length === 0) {
          throw new Error('Tidak ada data produk yang ditemukan di Google Sheet.');
        }

        setProducts(fetchedProducts);
        const nowStr = new Date().toLocaleString('id-ID', {
          dateStyle: 'short',
          timeStyle: 'short',
        });
        setLastSyncTime(nowStr);
        try {
          localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, nowStr);
        } catch {
          // ignore
        }
        showToast(`✅ Sinkron sukses: ${fetchedProducts.length} barang diperbarui dari Google Sheets`);
        return { success: true, count: fetchedProducts.length };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast(`❌ Gagal sinkron: ${msg}`);
        return { success: false, message: msg };
      } finally {
        setIsSyncing(false);
      }
    },
    [gsheetUrl]
  );

  // Auto-sync on startup if configured and online
  useEffect(() => {
    if (gsheetUrl && autoSync && navigator.onLine) {
      handleSyncGoogleSheets(gsheetUrl);
    }
  }, []);

  // Recalculate cart prices when price tier changes
  const handlePriceTierChange = (newTier: PriceTier) => {
    setPriceTier(newTier);
    setCart((prevCart) =>
      prevCart.map((item) => {
        const { product, qty1, qty2 } = item;
        const p1 =
          newTier === 'grosir' && product.hargaGrosir1 && product.hargaGrosir1 > 0
            ? product.hargaGrosir1
            : product.hargaRetail1;
        const baseP2 =
          newTier === 'grosir' && product.hargaGrosir2 && product.hargaGrosir2 > 0
            ? product.hargaGrosir2
            : product.hargaRetail2;
        const p2 = getEffectivePrice2(p1, baseP2, product.isi);
        const subtotal = calculateSubtotal(qty1, qty2, p1, p2, product.isi);
        return {
          ...item,
          priceTier: newTier,
          price1: p1,
          price2: p2,
          subtotal,
        };
      })
    );
  };

  // Cart operations
  const handleAddSatuan1 = (product: Product) => {
    playScanSuccessSound();
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      const p1 =
        priceTier === 'grosir' && product.hargaGrosir1 && product.hargaGrosir1 > 0
          ? product.hargaGrosir1
          : product.hargaRetail1;
      const baseP2 =
        priceTier === 'grosir' && product.hargaGrosir2 && product.hargaGrosir2 > 0
          ? product.hargaGrosir2
          : product.hargaRetail2;
      const p2 = getEffectivePrice2(p1, baseP2, product.isi);

      if (idx !== -1) {
        const item = prev[idx];
        const newQty1 = item.qty1 + 1;
        const subtotal = calculateSubtotal(newQty1, item.qty2, p1, p2, product.isi);
        const updated = [...prev];
        updated[idx] = { ...item, qty1: newQty1, subtotal, price1: p1, price2: p2 };
        return updated;
      } else {
        const subtotal = calculateSubtotal(1, 0, p1, p2, product.isi);
        return [
          ...prev,
          {
            product,
            priceTier,
            qty1: 1,
            qty2: 0,
            price1: p1,
            price2: p2,
            subtotal,
          },
        ];
      }
    });
    showToast(`+1 ${product.satuan1} ${product.nama}`);
  };

  const handleAddSatuan2 = (product: Product) => {
    playScanSuccessSound();
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      const p1 =
        priceTier === 'grosir' && product.hargaGrosir1 && product.hargaGrosir1 > 0
          ? product.hargaGrosir1
          : product.hargaRetail1;
      const baseP2 =
        priceTier === 'grosir' && product.hargaGrosir2 && product.hargaGrosir2 > 0
          ? product.hargaGrosir2
          : product.hargaRetail2;
      const p2 = getEffectivePrice2(p1, baseP2, product.isi);

      if (idx !== -1) {
        const item = prev[idx];
        const newQty2 = item.qty2 + 1;
        const subtotal = calculateSubtotal(item.qty1, newQty2, p1, p2, product.isi);
        const updated = [...prev];
        updated[idx] = { ...item, qty2: newQty2, subtotal, price1: p1, price2: p2 };
        return updated;
      } else {
        const subtotal = calculateSubtotal(0, 1, p1, p2, product.isi);
        return [
          ...prev,
          {
            product,
            priceTier,
            qty1: 0,
            qty2: 1,
            price1: p1,
            price2: p2,
            subtotal,
          },
        ];
      }
    });
    showToast(`+1 ${product.satuan2} ${product.nama}`);
  };

  const handleUpdateQty = (productId: string, qty1: number, qty2: number) => {
    if (qty1 <= 0 && qty2 <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const subtotal = calculateSubtotal(
          qty1,
          qty2,
          item.price1,
          item.price2,
          item.product.isi
        );
        return {
          ...item,
          qty1,
          qty2,
          subtotal,
        };
      })
    );
  };

  const handleSaveFromModal = (product: Product, qty1: number, qty2: number) => {
    if (qty1 <= 0 && qty2 <= 0) {
      handleRemoveFromCart(product.id);
      return;
    }

    const p1 =
      priceTier === 'grosir' && product.hargaGrosir1 && product.hargaGrosir1 > 0
        ? product.hargaGrosir1
        : product.hargaRetail1;
    const baseP2 =
      priceTier === 'grosir' && product.hargaGrosir2 && product.hargaGrosir2 > 0
        ? product.hargaGrosir2
        : product.hargaRetail2;
    const p2 = getEffectivePrice2(p1, baseP2, product.isi);
    const subtotal = calculateSubtotal(qty1, qty2, p1, p2, product.isi);

    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          qty1,
          qty2,
          price1: p1,
          price2: p2,
          subtotal,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            priceTier,
            qty1,
            qty2,
            price1: p1,
            price2: p2,
            subtotal,
          },
        ];
      }
    });
    showToast(`Disimpan: ${product.nama}`);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Barcode scanned handler
  const handleBarcodeScanned = (code: string) => {
    const cleanCode = code.trim().toLowerCase();
    const matched = products.find(
      (p) =>
        p.kodeBarcode.toLowerCase() === cleanCode ||
        p.kodeBarang.toLowerCase() === cleanCode
    );

    if (activeTab === 'cek-harga') {
      setIsScannerOpen(false);
      setSearchQuery(code);
      return;
    }

    if (matched) {
      handleAddSatuan1(matched);
      setIsScannerOpen(false);
    } else {
      showToast(`Barang tidak ditemukan untuk kode: ${code}`);
    }
  };

  // Total summary for cart
  const cartTotalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.kategori) set.add(p.kategori);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered products for Kasir catalog
  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.kategori === selectedCategory);
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
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      {/* Offline Mode Alert */}
      <OfflineIndicator />

      {/* Top Header Contract (Universal Responsive Header) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <img
            src="/icon.svg"
            alt="Logo Kasir Dua Satuan"
            className="w-8 h-8 rounded-xl shadow-xs"
          />
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 leading-tight">
              KasirDuaSatuan
            </h1>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
              POS Multi-Unit & Barcode Scanner PWA
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Visible on lg: screens) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
          {[
            { id: 'kasir', label: 'Kasir POS', icon: ShoppingBag, badge: cart.length },
            { id: 'cek-harga', label: 'Cek Harga 2 Satuan', icon: Layers },
            { id: 'riwayat', label: 'Riwayat Struk', icon: Receipt },
            { id: 'inventaris', label: 'Excel / CSV', icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 stroke-[2.2]' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="px-1.5 py-0.2 bg-emerald-600 text-white font-bold text-[10px] rounded-full">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Actions Zone: PWA Install, Cloud Sync & Camera Scanner Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Cloud Sync Quick Button */}
          {gsheetUrl ? (
            <button
              onClick={() => handleSyncGoogleSheets()}
              disabled={isSyncing}
              className="min-h-[40px] px-2.5 sm:px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              title={`Sinkron Google Sheets (Terakhir: ${lastSyncTime || 'Belum'})`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isSyncing ? 'Sinkron...' : 'Sync GSheets'}</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('inventaris')}
              className="min-h-[40px] px-2.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all hidden sm:flex"
              title="Hubungkan Google Sheets"
            >
              <Cloud className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Hubungkan GSheets</span>
            </button>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Barcode Camera Scanner */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="min-h-[40px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all"
            title="Scan Barcode Kamera"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Scan Barcode</span>
            <span className="sm:hidden">Scan</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* TAB 1: KASIR (POS) */}
        {activeTab === 'kasir' && (
          <div className="lg:flex lg:gap-6 lg:items-start pb-28 lg:pb-8">
            {/* Left Column: Product Catalog & Controls */}
            <div className="flex-1 space-y-4">
              {/* Search Bar & Retail/Grosir Switcher */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari barang atau scan barcode..."
                    className="w-full h-11 pl-10 pr-8 rounded-2xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Mobile / Inline Price Tier Switcher */}
                <div className="flex p-1 bg-slate-200/90 rounded-2xl shrink-0">
                  <button
                    onClick={() => handlePriceTierChange('retail')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      priceTier === 'retail' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Retail
                  </button>
                  <button
                    onClick={() => handlePriceTierChange('grosir')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      priceTier === 'grosir' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Grosir
                  </button>
                </div>
              </div>

              {/* Category Filter Horizontal Scroll */}
              {categories.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Semua ({products.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Product Cards Grid (Fully Responsive: 1 col on small phone, 2 cols on mobile/tablet, 2-3 on desktop split) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
                    <p className="text-sm font-medium text-slate-700">Barang tidak ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba kata kunci lain atau gunakan pemindai barcode.
                    </p>
                  </div>
                ) : (
                  filteredProducts.slice(0, 60).map((product) => {
                    const cartItem = cart.find((i) => i.product.id === product.id);
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        priceTier={priceTier}
                        cartCount1={cartItem?.qty1}
                        cartCount2={cartItem?.qty2}
                        onAddSatuan1={handleAddSatuan1}
                        onAddSatuan2={handleAddSatuan2}
                        onOpenDetails={(p) => setSelectedProductForModal(p)}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column (Desktop / Tablet split POS terminal register) */}
            <aside className="hidden lg:flex w-[390px] xl:w-[420px] h-[calc(100vh-92px)] sticky top-[72px] rounded-3xl border border-slate-200 shadow-sm overflow-hidden bg-white shrink-0">
              <CartOrderPanel
                cart={cart}
                priceTier={priceTier}
                onPriceTierChange={handlePriceTierChange}
                onUpdateQty={handleUpdateQty}
                onRemoveItem={handleRemoveFromCart}
                onClearCart={handleClearCart}
                onCompleteTransaction={(tx) => {
                  setTransactions((prev) => [tx, ...prev]);
                  setActiveReceipt(tx);
                }}
                isEmbedded={true}
              />
            </aside>
          </div>
        )}

        {/* TAB 2: CEK HARGA */}
        {activeTab === 'cek-harga' && (
          <div className="max-w-4xl mx-auto">
            <PriceCheckView
              products={products}
              onOpenScanner={() => setIsScannerOpen(true)}
              onAddToCart={(prod, unit) => {
                if (unit === 'satuan1') handleAddSatuan1(prod);
                else handleAddSatuan2(prod);
              }}
            />
          </div>
        )}

        {/* TAB 3: RIWAYAT TRANSAKSI */}
        {activeTab === 'riwayat' && (
          <div className="max-w-4xl mx-auto">
            <TransactionHistoryView
              transactions={transactions}
              onSelectReceipt={(tx) => setActiveReceipt(tx)}
            />
          </div>
        )}

        {/* TAB 4: INVENTARIS (GOOGLE SHEETS / EXCEL / CSV) */}
        {activeTab === 'inventaris' && (
          <div className="max-w-4xl mx-auto">
            <InventoryManager
              products={products}
              onUpdateProducts={setProducts}
              onResetDefault={() => setProducts(getDefaultProducts())}
              gsheetUrl={gsheetUrl}
              onSaveGsheetUrl={handleSaveGsheetUrl}
              onSyncGsheet={handleSyncGoogleSheets}
              isSyncing={isSyncing}
              lastSyncTime={lastSyncTime}
              autoSync={autoSync}
              onToggleAutoSync={handleToggleAutoSync}
            />
          </div>
        )}
      </main>

      {/* Floating Cart Summary Bar for Phones (Only visible on screens < lg:) */}
      {cart.length > 0 && activeTab === 'kasir' && (
        <div className="lg:hidden fixed bottom-18 inset-x-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom-2 duration-150">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full min-h-[52px] p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xl shadow-slate-900/30 active:scale-[0.99] transition-all border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                {cart.length}
              </div>
              <div className="text-left">
                <span className="text-[11px] text-slate-300 block">Total Keranjang</span>
                <span className="text-sm font-extrabold text-white tabular-nums">
                  {formatRupiah(cartTotalAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-slate-800 px-3 py-1.5 rounded-xl">
              <span>Buka Pembayaran</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Fixed Bottom Tab Bar for Mobile Phones (Hidden on lg: screens) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200">
        <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-1">
          {[
            { id: 'kasir', label: 'Kasir', icon: ShoppingBag, badge: cart.length },
            { id: 'cek-harga', label: 'Cek Harga', icon: Layers },
            { id: 'riwayat', label: 'Riwayat', icon: Receipt },
            { id: 'inventaris', label: 'Excel / CSV', icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`min-h-[44px] flex flex-col items-center justify-center relative transition-colors ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 bg-emerald-600 text-white font-bold text-[9px] rounded-full">
                      {tab.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] mt-1 tracking-tight truncate w-full text-center">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleBarcodeScanned}
        title={activeTab === 'cek-harga' ? 'Pindai untuk Cek Harga' : 'Pindai Barcode Masuk Kasir'}
      />

      {/* Cart Drawer for Mobile Screens (< lg) */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        priceTier={priceTier}
        onPriceTierChange={handlePriceTierChange}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onCompleteTransaction={(tx) => {
          setTransactions((prev) => [tx, ...prev]);
          setActiveReceipt(tx);
        }}
      />

      {/* Exact Dual-Unit Quantity Modal */}
      {selectedProductForModal && (
        <ProductQtyModal
          isOpen={!!selectedProductForModal}
          product={selectedProductForModal}
          priceTier={priceTier}
          initialQty1={cart.find((i) => i.product.id === selectedProductForModal.id)?.qty1 || 0}
          initialQty2={cart.find((i) => i.product.id === selectedProductForModal.id)?.qty2 || 0}
          onClose={() => setSelectedProductForModal(null)}
          onSave={handleSaveFromModal}
        />
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        transaction={activeReceipt}
        isOpen={!!activeReceipt}
        onClose={() => setActiveReceipt(null)}
        onNewTransaction={() => {
          setActiveReceipt(null);
          setActiveTab('kasir');
        }}
      />

      {/* Lightweight Floating Toast */}
      {toastMessage && (
        <div className="fixed top-16 inset-x-4 max-w-sm mx-auto z-50 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3 bg-slate-900/95 text-white text-xs font-semibold rounded-2xl shadow-xl flex items-center gap-2 backdrop-blur-md border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

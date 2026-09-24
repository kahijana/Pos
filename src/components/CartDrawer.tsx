import { CartItem, PriceTier, Transaction } from '../types/pos';
import CartOrderPanel from './CartOrderPanel';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  priceTier: PriceTier;
  onPriceTierChange: (tier: PriceTier) => void;
  onUpdateQty: (productId: string, qty1: number, qty2: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCompleteTransaction: (transaction: Transaction) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  priceTier,
  onPriceTierChange,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onCompleteTransaction,
}: CartDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl mx-auto h-[92vh] bg-white rounded-t-3xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-2 shrink-0 cursor-pointer" onClick={onClose} />

        {/* Reusable Cart Panel */}
        <div className="flex-1 overflow-hidden">
          <CartOrderPanel
            cart={cart}
            priceTier={priceTier}
            onPriceTierChange={onPriceTierChange}
            onUpdateQty={onUpdateQty}
            onRemoveItem={onRemoveItem}
            onClearCart={onClearCart}
            onCompleteTransaction={onCompleteTransaction}
            onClose={onClose}
            isEmbedded={false}
          />
        </div>
      </div>
    </div>
  );
}

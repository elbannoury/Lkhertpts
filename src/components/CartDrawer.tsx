import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatMAD } from '@/data/catalog';

const CartDrawer: React.FC = () => {
  const { cart, open, setOpen, updateQty, removeFromCart, subtotal } = useCart();
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#FAF8F5] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#E7DFD6]">
          <h2 className="font-serif text-xl tracking-wide">Your Selection</h2>
          <button onClick={() => setOpen(false)}><X size={22} /></button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <p className="text-[#8D8D8D] mb-6">Your gallery wall awaits.</p>
            <button onClick={() => setOpen(false)} className="text-xs tracking-[0.2em] uppercase border-b border-[#6E44FF] pb-1">
              Explore Collections
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.map((item) => (
                <div key={item.product_id + (item.variant_id || '')} className="flex gap-4">
                  <img src={item.image} alt={item.name} className="w-20 h-24 object-cover bg-[#F2ECE6] rounded-sm" />
                  <div className="flex-1">
                    <h4 className="font-serif text-base leading-tight">{item.name}</h4>
                    {item.variant_title && <p className="text-xs text-[#8D8D8D] mt-1">{item.variant_title}</p>}
                    <p className="text-sm text-[#1D1D1D] mt-1">{formatMAD(item.price)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-[#ddd]">
                        <button onClick={() => updateQty(item.product_id, item.variant_id, item.quantity - 1)} className="px-2 py-1"><Minus size={13} /></button>
                        <span className="px-3 text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product_id, item.variant_id, item.quantity + 1)} className="px-2 py-1"><Plus size={13} /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.product_id, item.variant_id)} className="text-[#b3b3b3] hover:text-[#1D1D1D]"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-[#E7DFD6]">
              <div className="flex justify-between mb-1 text-sm">
                <span className="text-[#8D8D8D]">Subtotal</span>
                <span className="font-medium">{formatMAD(subtotal)}</span>
              </div>
              <p className="text-xs text-[#8D8D8D] mb-4">Free delivery across Morocco · Pay on delivery</p>
              <button
                onClick={() => { setOpen(false); navigate('/checkout'); }}
                className="w-full bg-[#1D1D1D] text-white py-4 text-xs tracking-[0.25em] uppercase hover:bg-[#6E44FF] transition-colors"
              >
                Place Your Order
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;

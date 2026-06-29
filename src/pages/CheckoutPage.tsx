import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Shell from '@/components/Shell';
import { useCart } from '@/contexts/CartContext';
import { formatMAD } from '@/data/catalog';
import { getRefCode, clearRef } from '@/lib/affiliate';
import { crmSubscribe } from '@/lib/constants';


const MOROCCAN_CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Other'];

const CheckoutPage: React.FC = () => {
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: 'Casablanca', address: '', notes: '' });
  const [sms, setSms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.city) { setError('Please complete name, phone and city.'); return; }
    if (cart.length === 0) { setError('Your selection is empty.'); return; }
    setSubmitting(true); setError('');

    try {
      const { data: customer } = await supabase
        .from('ecom_customers')
        .upsert({ email: form.email || `${form.phone}@pitsiky.order`, name: form.name, phone: form.phone }, { onConflict: 'email' })
        .select('id').single();

      const refCode = getRefCode();
      const { data: order } = await supabase
        .from('ecom_orders')
        .insert({
          customer_id: customer?.id,
          status: 'pending',
          subtotal,
          tax: 0,
          shipping: 0,
          total: subtotal,
          // ref_code travels with the order; the affiliate is credited only when
          // the owner later marks this order "paid" in the console.
          shipping_address: { name: form.name, phone: form.phone, city: form.city, address: form.address, ref_code: refCode || null },
          notes: form.notes,
        })
        .select('id').single();


      if (!order) throw new Error('Could not create order');

      const orderItems = cart.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        variant_id: i.variant_id || null,
        product_name: i.name,
        variant_title: i.variant_title || null,
        sku: i.sku || null,
        quantity: i.quantity,
        unit_price: i.price,
        total: i.price * i.quantity,
      }));
      await supabase.from('ecom_order_items').insert(orderItems);

      // Distribute to configured channels (email + WhatsApp)
      supabase.functions.invoke('send-order-notifications', {
        body: {
          order: {
            order_id: order.id.slice(0, 8).toUpperCase(),
            customer_name: form.name,
            phone: form.phone,
            city: form.city,
            address: form.address,
            notes: form.notes,
            total: Math.round(subtotal / 100),
            timestamp: new Date().toLocaleString('en-GB'),
            items: orderItems,
          },
        },
      }).catch(() => {});

      // CRM — add buyer to the CRM (correct project id via shared helper)
      crmSubscribe({
        email: form.email || undefined,
        name: form.name,
        phone: form.phone || undefined,
        sms_opt_in: sms === true,
        source: 'checkout',
        tags: ['customer'],
      });


      // Referral was captured onto the order's shipping_address.ref_code above.
      // The affiliate is only credited later, when the owner marks this order
      // "paid" in the console — so clear the stored ref now.
      clearRef();


      clearCart();
      navigate(`/order-confirmed/${order.id.slice(0, 8).toUpperCase()}`);

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-16">
        <h1 className="font-serif text-4xl md:text-5xl mb-3">Place Your Order</h1>
        <p className="text-[#8D8D8D] mb-12">No payment online — pay calmly on delivery. We confirm by phone.</p>

        <div className="grid md:grid-cols-[1fr_380px] gap-12">
          <form onSubmit={submit} className="space-y-5">
            <input className="w-full border border-[#ddd] bg-white px-4 py-3" placeholder="Full name *" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <input className="w-full border border-[#ddd] bg-white px-4 py-3" type="tel" placeholder="Phone number *" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <input className="w-full border border-[#ddd] bg-white px-4 py-3" type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <select className="w-full border border-[#ddd] bg-white px-4 py-3" value={form.city} onChange={(e) => set('city', e.target.value)}>
              {MOROCCAN_CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className="w-full border border-[#ddd] bg-white px-4 py-3" placeholder="Delivery address" value={form.address} onChange={(e) => set('address', e.target.value)} />
            <textarea className="w-full border border-[#ddd] bg-white px-4 py-3 min-h-24" placeholder="Notes (optional)" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            <label className="flex items-start gap-2 text-xs text-[#8D8D8D]">
              <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} className="mt-0.5" />
              <span>Text me order updates. Msg &amp; data rates may apply. Reply STOP to unsubscribe.</span>
            </label>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button disabled={submitting} className="w-full bg-[#1D1D1D] text-white py-4 text-xs tracking-[0.25em] uppercase hover:bg-[#6E44FF] transition-colors disabled:opacity-50">
              {submitting ? 'Placing order…' : 'Confirm Order'}
            </button>
          </form>

          <div className="bg-[#F2ECE6] p-6 h-fit">
            <h3 className="font-serif text-xl mb-5">Your Selection</h3>
            <div className="space-y-4 mb-5">
              {cart.map((i) => (
                <div key={i.product_id + (i.variant_id || '')} className="flex gap-3">
                  <img src={i.image} alt={i.name} className="w-14 h-16 object-cover rounded-sm" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium leading-tight">{i.name}</p>
                    {i.variant_title && <p className="text-xs text-[#8D8D8D]">{i.variant_title}</p>}
                    <p className="text-xs text-[#8D8D8D]">Qty {i.quantity}</p>
                  </div>
                  <span className="text-sm">{formatMAD(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#ddd] pt-4 flex justify-between text-sm">
              <span>Total</span><span className="font-serif text-lg">{formatMAD(subtotal)}</span>
            </div>
            <p className="text-xs text-[#8D8D8D] mt-3">Free delivery · Pay on delivery</p>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default CheckoutPage;

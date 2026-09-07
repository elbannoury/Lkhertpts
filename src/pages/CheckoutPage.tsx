import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Shell from '@/components/Shell';
import SEO from '@/components/SEO';
import { useCart } from '@/contexts/CartContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatMAD } from '@/data/catalog';
import { getRefCode, clearRef } from '@/lib/affiliate';


const MOROCCAN_CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Other'];
const CITY_LABELS_AR: Record<string, string> = {
  Casablanca: 'الدار البيضاء', Rabat: 'الرباط', Marrakech: 'مراكش', 'Fès': 'فاس',
  Tanger: 'طنجة', Agadir: 'أكادير', 'Meknès': 'مكناس', Oujda: 'وجدة',
  'Kénitra': 'القنيطرة', 'Tétouan': 'تطوان', Other: 'مدينة أخرى',
};

const CheckoutPage: React.FC = () => {
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { lang } = useI18n();
  const en = lang === 'en';
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: 'Casablanca', address: '', notes: '' });
  const [sms, setSms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.city) {
      setError(en ? 'Please complete name, phone and city.' : 'يرجى إكمال الاسم والهاتف والمدينة.');
      return;
    }
    if (cart.length === 0) {
      setError(en ? 'Your selection is empty.' : 'سلتك فارغة.');
      return;
    }
    setSubmitting(true); setError('');

    try {
      const { data: existingCustomer, error: existErr } = await supabase
        .from('ecom_customers')
        .select('tags')
        .eq('email', form.email || `${form.phone}@pitsiky.order`)
        .maybeSingle();
      if (existErr) throw new Error(`Customer lookup failed: ${existErr.message}`);

      const tags = Array.from(new Set([...(existingCustomer?.tags || []), 'customer']));

      const { data: customer, error: customerErr } = await supabase
        .from('ecom_customers')
        .upsert({ email: form.email || `${form.phone}@pitsiky.order`, name: form.name, phone: form.phone, sms_opt_in: sms, tags }, { onConflict: 'email' })
        .select('id')
        .single();

      // إذا فشل حفظ العميل (مثلاً بسبب سياسة RLS تمنع الكتابة العامة)،
      // نوقف العملية هنا برسالة واضحة بدل المتابعة بـ customer_id فارغ
      // الذي كان يتسبب في فشل صامت لاحقاً عند إنشاء الطلب.
      // If saving the customer fails (e.g. an RLS policy blocking public
      // writes), stop here with a clear message instead of continuing with
      // an empty customer_id — which was silently breaking order creation.
      if (customerErr || !customer) {
        throw new Error(`Customer save failed: ${customerErr?.message || 'no customer id returned'}`);
      }

      const refCode = getRefCode();
      const { data: order, error: orderErr } = await supabase
        .from('ecom_orders')
        .insert({
          customer_id: customer.id,
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
        .select('id, order_number')
        .single();

      // نعرض رسالة الخطأ الفعلية القادمة من Supabase (مثال: انتهاك سياسة RLS،
      // أو عمود إجباري ناقص) بدل رسالة عامة لا تفيد في التشخيص.
      // Surface the real Supabase error (e.g. an RLS violation or a missing
      // required column) instead of a generic message that can't be debugged.
      if (orderErr || !order) {
        throw new Error(orderErr?.message || 'Could not create order — no order id returned.');
      }

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
      const { error: itemsErr } = await supabase.from('ecom_order_items').insert(orderItems);
      if (itemsErr) {
        // الطلب نفسه أُنشئ بنجاح؛ لا نمنع المستخدم من إتمام الشراء إذا فشلت
        // فقط سطور المنتجات — لكن نسجّل الخطأ ليتم تداركه من لوحة التحكم.
        // The order itself was created successfully; don't block the
        // customer if only the line items failed — but log it so it can be
        // fixed from the admin console.
        console.error('CheckoutPage: order created but order items failed to save', itemsErr);
      }

      // Distribute to configured channels (email + WhatsApp)
      supabase.functions.invoke('send-order-notifications', {
        body: {
          order: {
            order_id: order.order_number,
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

      // Buyer is already captured on the ecom_customers upsert above (tags, sms_opt_in).

      // Referral was captured onto the order's shipping_address.ref_code above.
      // The affiliate is only credited later, when the owner marks this order
      // "paid" in the console — so clear the stored ref now.
      clearRef();


      clearCart();
      navigate(`/order-confirmed/${order.order_number}`);

    } catch (err: any) {
      console.error('CheckoutPage: order submission failed', err);
      setError(err.message || (en ? 'Something went wrong. Please try again.' : 'حدث خطأ ما. يرجى المحاولة مرة أخرى.'));
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <SEO
        title={en ? 'Checkout' : 'إتمام الطلب'}
        path="/checkout"
        noindex
      />
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-16">
        <h1 className="font-serif text-4xl md:text-5xl mb-3">{en ? 'Place Your Order' : 'أتمم طلبك'}</h1>
        <p className="text-[#8D8D8D] mb-12">
          {en
            ? "We'll contact you by phone to confirm payment and delivery details."
            : 'سنتواصل معك هاتفياً لتأكيد تفاصيل الدفع والتوصيل.'}
        </p>

        <div className="grid md:grid-cols-[1fr_380px] gap-12">
          <form onSubmit={submit} className="space-y-5">
            <input className="w-full border border-[#ddd] bg-white px-4 py-3" placeholder={en ? 'Full name *' : 'الاسم الكامل *'} value={form.name} onChange={(e) => set('name', e.target.value)} />
            <input className="w-full border border-[#ddd] bg-white px-4 py-3" type="tel" placeholder={en ? 'Phone number *' : 'رقم الهاتف *'} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <input className="w-full border border-[#ddd] bg-white px-4 py-3" type="email" placeholder={en ? 'Email (optional)' : 'البريد الإلكتروني (اختياري)'} value={form.email} onChange={(e) => set('email', e.target.value)} />
            <select className="w-full border border-[#ddd] bg-white px-4 py-3" value={form.city} onChange={(e) => set('city', e.target.value)}>
              {MOROCCAN_CITIES.map((c) => <option key={c} value={c}>{en ? c : CITY_LABELS_AR[c]}</option>)}
            </select>
            <input className="w-full border border-[#ddd] bg-white px-4 py-3" placeholder={en ? 'Delivery address' : 'عنوان التوصيل'} value={form.address} onChange={(e) => set('address', e.target.value)} />
            <textarea className="w-full border border-[#ddd] bg-white px-4 py-3 min-h-24" placeholder={en ? 'Notes (optional)' : 'ملاحظات (اختياري)'} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            <label className="flex items-start gap-2 text-xs text-[#8D8D8D]">
              <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} className="mt-0.5" />
              <span>
                {en
                  ? 'Text me order updates. Msg & data rates may apply. Reply STOP to unsubscribe.'
                  : 'أرسل لي تحديثات الطلب عبر الرسائل النصية. قد تُطبَّق رسوم الرسائل والبيانات. أرسل STOP لإلغاء الاشتراك.'}
              </span>
            </label>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button disabled={submitting} className="w-full bg-[#1D1D1D] text-white py-4 text-xs tracking-[0.25em] uppercase hover:bg-[#6E44FF] transition-colors disabled:opacity-50">
              {submitting ? (en ? 'Placing order…' : 'جارٍ تأكيد الطلب…') : (en ? 'Confirm Order' : 'تأكيد الطلب')}
            </button>
          </form>

          <div className="bg-[#F2ECE6] p-6 h-fit">
            <h3 className="font-serif text-xl mb-5">{en ? 'Your Selection' : 'مشترياتك'}</h3>
            <div className="space-y-4 mb-5">
              {cart.map((i) => (
                <div key={i.product_id + (i.variant_id || '')} className="flex gap-3">
                  <img src={i.image} alt={i.name} className="w-14 h-16 object-cover rounded-sm" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium leading-tight">{i.name}</p>
                    {i.variant_title && <p className="text-xs text-[#8D8D8D]">{i.variant_title}</p>}
                    <p className="text-xs text-[#8D8D8D]">{en ? `Qty ${i.quantity}` : `الكمية: ${i.quantity}`}</p>
                  </div>
                  <span className="text-sm">{formatMAD(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#ddd] pt-4 flex justify-between text-sm">
              <span>{en ? 'Total' : 'المجموع'}</span><span className="font-serif text-lg">{formatMAD(subtotal)}</span>
            </div>
            <p className="text-xs text-[#8D8D8D] mt-3">{en ? 'Free delivery' : 'توصيل مجاني'}</p>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default CheckoutPage;

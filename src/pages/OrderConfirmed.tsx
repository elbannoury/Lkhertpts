import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import Shell from '@/components/Shell';
import SEO from '@/components/SEO';
import { useI18n } from '@/contexts/I18nContext';

const OrderConfirmed: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { lang } = useI18n();
  const en = lang === 'en';

  return (
    <Shell>
      <SEO title={en ? 'Order Received' : 'تم استلام طلبك'} path={`/order-confirmed/${id || ''}`} noindex />
      <div className="max-w-xl mx-auto px-6 py-32 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#6E44FF] flex items-center justify-center mb-8">
          <Check className="text-white" size={30} />
        </div>
        <h1 className="font-serif text-4xl mb-4">{en ? 'Order Received' : 'تم استلام طلبك'}</h1>
        <p className="text-[#8D8D8D] leading-relaxed mb-2">
          {en ? 'Thank you. Your order has been placed.' : 'شكراً لك. تم تسجيل طلبك بنجاح.'}
        </p>
        <div className="inline-block bg-[#F2ECE6] rounded-xl px-6 py-4 my-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8D8D8D] mb-1">
            {en ? 'Your order number' : 'رقم طلبك'}
          </p>
          <p className="font-mono text-2xl text-[#1D1D1D] tracking-widest">{id}</p>
        </div>
        <p className="text-[#8D8D8D] mb-2">
          {en ? "Save this number — you'll need it to track your order." : 'احتفظ بهذا الرقم — ستحتاجه لتتبّع طلبك.'}
        </p>
        <p className="text-[#8D8D8D] mb-10">
          {en
            ? "Our team will contact you shortly to confirm delivery and collect your 50% deposit."
            : 'سيتواصل معك فريقنا قريباً لتأكيد التوصيل وتحصيل العربون (50%).'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/track" className="inline-block bg-[#6E44FF] text-white px-8 py-4 text-xs tracking-[0.2em] uppercase hover:bg-[#5a37d6] transition-colors">
            {en ? 'Track This Order' : 'تتبّع هذا الطلب'}
          </Link>
          <Link to="/" className="inline-block bg-[#1D1D1D] text-white px-8 py-4 text-xs tracking-[0.2em] uppercase hover:bg-[#6E44FF] transition-colors">
            {en ? 'Continue Exploring' : 'واصل التصفح'}
          </Link>
        </div>
      </div>
    </Shell>
  );
};

export default OrderConfirmed;

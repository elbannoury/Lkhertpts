import React from 'react';
import { Banknote, CreditCard, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

/**
 * قسم طرق الدفع المعروض في صفحة المنتج قبل زر "أضف للسلة" مباشرة —
 * يعزز الثقة بتوضيح أن الدفع عند الاستلام متاح في كل مدن المغرب.
 *
 * Payment methods trust-signal block shown right before Add to Cart —
 * reinforces trust by clarifying Cash on Delivery is available nationwide.
 */
const PaymentMethods: React.FC = () => {
  const { lang } = useI18n();
  const en = lang === 'en';

  return (
    <div className="mt-6 rounded-xl border border-[#e5ded3] dark:border-[#242424] bg-[#FBF8F2] dark:bg-[#141414] p-4">
      <p className="text-xs tracking-[0.15em] uppercase text-[#8D8D8D] mb-3">
        {en ? 'Payment Options' : 'طرق الدفع'}
      </p>
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-[#1c1c1c] border border-[#eee] dark:border-[#2a2a2a] text-sm text-[#1D1D1D] dark:text-[#F4F1E9]">
          <Banknote size={16} className="text-[#1faa52]" />
          {en ? 'Cash on Delivery' : 'الدفع عند الاستلام'}
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-[#1c1c1c] border border-[#eee] dark:border-[#2a2a2a] text-sm text-[#1D1D1D] dark:text-[#F4F1E9]">
          <CreditCard size={16} className="text-[#FF6A00]" />
          Visa / Mastercard
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-[#1c1c1c] border border-[#eee] dark:border-[#2a2a2a] text-sm text-[#1D1D1D] dark:text-[#F4F1E9]">
          <ShieldCheck size={16} className="text-[#6E44FF]" />
          CMI
        </span>
      </div>
      <p className="mt-3 text-xs text-[#8D8D8D]">
        {en
          ? 'Cash on Delivery available in every city across Morocco.'
          : 'الدفع عند الاستلام متاح لجميع مدن المغرب.'}
      </p>
    </div>
  );
};

export default PaymentMethods;

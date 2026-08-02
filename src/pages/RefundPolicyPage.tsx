import React from 'react';
import Shell from '@/components/Shell';
import SEO from '@/components/SEO';
import { useI18n } from '@/contexts/I18nContext';

const RefundPolicyPage: React.FC = () => {
  const { lang } = useI18n();
  const en = lang === 'en';

  return (
    <Shell>
      <SEO
        title={en ? 'Refund & Return Policy' : 'سياسة الإرجاع والاستبدال'}
        description={
          en
            ? 'PITSIKY 7-day exchange window and print quality guarantee.'
            : 'إمكانية الاستبدال خلال 7 أيام والضمان على جودة الطباعة لدى بيتسيكي.'
        }
        path="/refund-policy"
      />
      <div className="max-w-[900px] mx-auto px-6 lg:px-10 py-16">
        <h1 className="font-serif text-4xl mb-8 text-[#1D1D1D] dark:text-[#F4F1E9]">
          {en ? 'Refund & Return Policy' : 'سياسة الإرجاع والاستبدال'}
        </h1>

        {en ? (
          <div className="space-y-6 text-[#4a4a4a] dark:text-[#c8c8c8] leading-relaxed">
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">7-Day Exchange Window</h2>
            <p>
              If you're not fully satisfied with your PITSIKY piece, you may request an exchange
              within 7 days of delivery. The artwork must be unused and in its original packaging.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">Print Quality Guarantee</h2>
            <p>
              Every piece is checked before shipping. If your artwork arrives damaged or with a
              print defect, we will replace it free of charge — just contact us with a photo of
              the issue within 48 hours of delivery.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">How to Request a Return</h2>
            <p>
              Contact our team via WhatsApp or email at hello@pitsiky.com with your order number
              and reason for return. We'll guide you through the next steps.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">Custom Orders</h2>
            <p>
              Custom/personalized posters are made specifically for you and are non-refundable
              unless they arrive damaged or defective.
            </p>
          </div>
        ) : (
          <div className="space-y-6 text-[#4a4a4a] dark:text-[#c8c8c8] leading-relaxed" dir="rtl">
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">إمكانية الاستبدال خلال 7 أيام</h2>
            <p>
              إذا لم تكن راضياً تماماً عن قطعتك من بيتسيكي، يمكنك طلب استبدالها خلال 7 أيام من
              تاريخ التسليم، بشرط أن تكون غير مستخدمة وفي تغليفها الأصلي.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">الضمان على جودة الطباعة</h2>
            <p>
              يتم فحص كل قطعة قبل الشحن. إذا وصلت لوحتك تالفة أو بها عيب في الطباعة، سنستبدلها
              مجاناً — فقط تواصل معنا مع صورة للمشكلة خلال 48 ساعة من الاستلام.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">كيفية طلب الإرجاع</h2>
            <p>
              تواصل مع فريقنا عبر واتساب أو البريد الإلكتروني hello@pitsiky.com مع ذكر رقم الطلب
              وسبب الإرجاع، وسنرشدك للخطوات التالية.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">الطلبات المخصصة</h2>
            <p>
              الملصقات/اللوحات المخصصة تُصنع خصيصاً لك وغير قابلة للاسترجاع إلا في حال وصولها تالفة
              أو معيبة.
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default RefundPolicyPage;

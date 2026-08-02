import React from 'react';
import Shell from '@/components/Shell';
import SEO from '@/components/SEO';
import { useI18n } from '@/contexts/I18nContext';

const TermsPage: React.FC = () => {
  const { lang } = useI18n();
  const en = lang === 'en';

  return (
    <Shell>
      <SEO
        title={en ? 'Terms of Service' : 'شروط الاستخدام'}
        description={
          en
            ? 'The terms and conditions governing your use of PITSIKY and your purchases.'
            : 'الشروط والأحكام التي تحكم استخدامك لموقع بيتسيكي ومشترياتك.'
        }
        path="/terms-of-service"
      />
      <div className="max-w-[900px] mx-auto px-6 lg:px-10 py-16">
        <h1 className="font-serif text-4xl mb-8 text-[#1D1D1D] dark:text-[#F4F1E9]">
          {en ? 'Terms of Service' : 'شروط الاستخدام'}
        </h1>

        {en ? (
          <div className="space-y-6 text-[#4a4a4a] dark:text-[#c8c8c8] leading-relaxed">
            <p>
              By accessing or using www.pitsiky.com, you agree to be bound by these Terms of
              Service. Please read them carefully before placing an order.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">Orders & Payment</h2>
            <p>
              All prices are listed in Moroccan Dirhams (MAD) and include applicable taxes. We
              accept Cash on Delivery, as well as Visa/Mastercard and CMI payments. Orders are
              confirmed once payment is received or, for Cash on Delivery, once you confirm your
              delivery details.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">Shipping</h2>
            <p>
              We deliver across all cities in Morocco. Standard delivery takes 3–5 business days
              from order confirmation.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">Intellectual Property</h2>
            <p>
              All artwork, product photography, and site content are the property of PITSIKY and
              may not be reproduced without written permission.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">Limitation of Liability</h2>
            <p>
              PITSIKY is not liable for indirect or incidental damages arising from the use of our
              products or website, to the extent permitted by Moroccan law.
            </p>
          </div>
        ) : (
          <div className="space-y-6 text-[#4a4a4a] dark:text-[#c8c8c8] leading-relaxed" dir="rtl">
            <p>
              باستخدامك لموقع www.pitsiky.com فإنك توافق على الالتزام بشروط الاستخدام هذه. يُرجى
              قراءتها بعناية قبل إتمام أي طلب.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">الطلبات والدفع</h2>
            <p>
              جميع الأسعار معروضة بالدرهم المغربي (MAD) وتشمل الضرائب المطبّقة. نقبل الدفع عند
              الاستلام، بالإضافة إلى الدفع عبر Visa/Mastercard و CMI. يتم تأكيد الطلب فور استلام
              الدفع، أو عند تأكيد بيانات التوصيل بالنسبة للدفع عند الاستلام.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">التوصيل</h2>
            <p>نوصّل إلى جميع مدن المغرب. مدة التوصيل الاعتيادية من 3 إلى 5 أيام عمل بعد تأكيد الطلب.</p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">الملكية الفكرية</h2>
            <p>
              جميع الأعمال الفنية والصور ومحتوى الموقع ملك حصري لبيتسيكي، ولا يجوز إعادة إنتاجها
              دون إذن كتابي.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">حدود المسؤولية</h2>
            <p>
              لا تتحمل بيتسيكي المسؤولية عن أي أضرار غير مباشرة أو عرضية ناتجة عن استخدام منتجاتنا
              أو موقعنا، في حدود ما يسمح به القانون المغربي.
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default TermsPage;

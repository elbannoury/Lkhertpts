import React from 'react';
import Shell from '@/components/Shell';
import SEO from '@/components/SEO';
import { useI18n } from '@/contexts/I18nContext';

const PrivacyPolicyPage: React.FC = () => {
  const { lang } = useI18n();
  const en = lang === 'en';

  return (
    <Shell>
      <SEO
        title={en ? 'Privacy Policy' : 'سياسة الخصوصية'}
        description={
          en
            ? 'Learn how PITSIKY collects, uses, and protects your personal information.'
            : 'تعرّف على كيفية جمع بيتسيكي لمعلوماتك الشخصية واستخدامها وحمايتها.'
        }
        path="/privacy-policy"
      />
      <div className="max-w-[900px] mx-auto px-6 lg:px-10 py-16 prose dark:prose-invert">
        <h1 className="font-serif text-4xl mb-8 text-[#1D1D1D] dark:text-[#F4F1E9]">
          {en ? 'Privacy Policy' : 'سياسة الخصوصية'}
        </h1>

        {en ? (
          <div className="space-y-6 text-[#4a4a4a] dark:text-[#c8c8c8] leading-relaxed">
            <p>
              PITSIKY ("we", "our", "us") respects your privacy. This policy explains what
              information we collect when you visit or shop on www.pitsiky.com, and how we use it.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">Information We Collect</h2>
            <p>
              We collect information you provide directly, such as your name, email address,
              phone number, and delivery address when placing an order or contacting us. We also
              collect basic usage data (pages visited, device type) to improve our service.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">How We Use Your Information</h2>
            <p>
              We use your information to process orders, communicate with you about your purchase,
              provide customer support, and — where you've opted in — send you updates and
              promotional offers by email or SMS/WhatsApp.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">Data Sharing</h2>
            <p>
              We never sell your personal data. We only share necessary order details with our
              delivery partners to fulfill your shipment, and with payment providers to process
              secure transactions.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">Your Rights</h2>
            <p>
              You can request access to, correction of, or deletion of your personal data at any
              time by contacting us at hello@pitsiky.com.
            </p>
          </div>
        ) : (
          <div className="space-y-6 text-[#4a4a4a] dark:text-[#c8c8c8] leading-relaxed" dir="rtl">
            <p>
              تحترم بيتسيكي («نحن») خصوصيتك. توضح هذه السياسة المعلومات التي نجمعها عند زيارتك أو
              تسوقك عبر www.pitsiky.com، وكيفية استخدامها.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">المعلومات التي نجمعها</h2>
            <p>
              نجمع المعلومات التي تقدّمها مباشرة، مثل الاسم والبريد الإلكتروني ورقم الهاتف وعنوان
              التوصيل عند إتمام طلب أو التواصل معنا. كما نجمع بيانات استخدام أساسية (الصفحات
              المُزارة، نوع الجهاز) لتحسين خدماتنا.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">كيف نستخدم معلوماتك</h2>
            <p>
              نستخدم معلوماتك لمعالجة الطلبات، والتواصل معك بخصوص مشترياتك، وتقديم الدعم، وإرسال
              التحديثات والعروض الترويجية عبر البريد أو الرسائل النصية/واتساب في حال موافقتك.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">مشاركة البيانات</h2>
            <p>
              لا نبيع بياناتك الشخصية أبداً. نشارك فقط التفاصيل الضرورية للطلب مع شركاء التوصيل
              لإتمام الشحن، ومع مزوّدي الدفع لمعالجة المعاملات بأمان.
            </p>
            <h2 className="font-serif text-xl text-[#1D1D1D] dark:text-[#F4F1E9]">حقوقك</h2>
            <p>
              يمكنك طلب الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها في أي وقت بالتواصل معنا عبر
              hello@pitsiky.com.
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default PrivacyPolicyPage;

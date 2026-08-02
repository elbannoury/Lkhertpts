import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useI18n } from '@/contexts/I18nContext';

interface ProductDetailsProps {
  /** أبعاد دقيقة بالسنتيمتر، مثال: "30 × 42 cm" — تُقرأ من metadata.dimensions إن وُجدت */
  dimensions?: string;
  materials?: string;
}

/**
 * قسم "تفاصيل المنتج" أسفل صفحة المنتج: المواد المستخدمة، الأبعاد الدقيقة،
 * وسياسة الإرجاع/الاستبدال. يستخدم قيم افتراضية عامة إن لم تتوفر بيانات
 * مخصصة في metadata المنتج بقاعدة Supabase.
 *
 * "Product details" section: materials used, precise dimensions, and the
 * return/exchange policy. Falls back to sensible generic defaults when the
 * product's Supabase metadata doesn't specify custom values.
 */
const ProductDetails: React.FC<ProductDetailsProps> = ({ dimensions, materials }) => {
  const { lang } = useI18n();
  const en = lang === 'en';

  const materialsText =
    materials ||
    (en
      ? 'Archival-quality inks on heavyweight matte paper, finished with a sturdy wooden frame.'
      : 'أحبار عالية الجودة على ورق مطفي ثقيل الوزن، مع إطار خشبي متين.');

  const dimensionsText =
    dimensions ||
    (en
      ? 'Available in multiple sizes — see options above. All measurements in centimeters (cm).'
      : 'متوفر بعدة أحجام — انظر الخيارات أعلاه. جميع القياسات بالسنتيمتر (cm).');

  return (
    <div className="mt-8">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="materials">
          <AccordionTrigger className="text-sm text-[#1D1D1D] dark:text-[#F4F1E9]">
            {en ? 'Materials & Craftsmanship' : 'المواد والصناعة'}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-[#6b6b6b] leading-relaxed">
            {materialsText}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="dimensions">
          <AccordionTrigger className="text-sm text-[#1D1D1D] dark:text-[#F4F1E9]">
            {en ? 'Dimensions' : 'الأبعاد'}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-[#6b6b6b] leading-relaxed">
            {dimensionsText}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="returns">
          <AccordionTrigger className="text-sm text-[#1D1D1D] dark:text-[#F4F1E9]">
            {en ? 'Returns & Exchanges' : 'الإرجاع والاستبدال'}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-[#6b6b6b] leading-relaxed">
            {en
              ? 'Exchange within 7 days of delivery if unused and in original packaging. Print quality is guaranteed — damaged or defective pieces are replaced free of charge.'
              : 'إمكانية الاستبدال خلال 7 أيام من الاستلام إذا كانت القطعة غير مستخدمة وفي تغليفها الأصلي. جودة الطباعة مضمونة — يتم استبدال القطع التالفة أو المعيبة مجاناً.'}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ProductDetails;

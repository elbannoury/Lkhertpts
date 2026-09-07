import React from 'react';
import Shell from '@/components/Shell';
import AppLayout from '@/components/AppLayout';
import SEO from '@/components/SEO';
import { buildOrganizationJsonLd } from '@/lib/jsonld';
import { useI18n } from '@/contexts/I18nContext';

const Index: React.FC = () => {
  const { lang } = useI18n();
  const en = lang === 'en';

  return (
    <Shell>
      <SEO
        title={en ? 'PITSIKY Art Gallery — Luxury Wall Art in Morocco' : 'بيتسيكي | معرض فني للوحات الجدارية الفاخرة في المغرب'}
        description={
          en
            ? 'PITSIKY transforms empty walls into stunning art with an elegant and luxurious digital experience, focused on wall art and decoration across Morocco.'
            : 'بيتسيكي تحوّل الجدران الفارغة إلى فن يلهم حياتك اليومية، بتجربة رقمية أنيقة وفاخرة متخصصة في اللوحات الجدارية والديكور، مع توصيل لكل مدن المغرب.'
        }
        path="/"
        jsonLd={buildOrganizationJsonLd()}
      />
      <AppLayout />
    </Shell>
  );
};

export default Index;

import React from 'react';
import Shell from '@/components/Shell';
import AppLayout from '@/components/AppLayout';
import SEO from '@/components/SEO';
import { buildOrganizationJsonLd } from '@/lib/jsonld';

const Index: React.FC = () => (
  <Shell>
    <SEO
      title="PITSIKY Art Gallery — Luxury Wall Art in Morocco"
      description="PITSIKY transforms empty walls into stunning art with an elegant and luxurious digital experience, focused on wall art and decoration across Morocco."
      path="/"
      jsonLd={buildOrganizationJsonLd()}
    />
    <AppLayout />
  </Shell>
);

export default Index;

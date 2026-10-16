import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { faqSchema } from '@/lib/seoShared';

export interface QA { q: string; a: string }

/**
 * Visible FAQ accordion + FAQPage JSON-LD (AEO).
 * Answers are short, direct and self-contained so answer engines (Google AI
 * Overviews, ChatGPT, Perplexity, Claude…) can quote them as-is.
 */
const FAQSection: React.FC<{ items: QA[]; title: string; eyebrow?: string; className?: string }> = ({ items, title, eyebrow, className = '' }) => {
  if (!items.length) return null;
  return (
    <section className={`max-w-[900px] mx-auto px-5 sm:px-6 py-16 ${className}`} aria-labelledby="faq-title">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema(items))}</script>
      </Helmet>
      <div className="text-center mb-8">
        {eyebrow && <p className="text-xs tracking-[0.3em] uppercase text-[#FF6A00] mb-3">{eyebrow}</p>}
        <h2 id="faq-title" className="font-serif text-3xl md:text-4xl text-[#1D1D1D] dark:text-[#F4F1E9]">{title}</h2>
      </div>
      <Accordion type="single" collapsible className="rounded-2xl border border-[#eadfce] dark:border-[#262626] bg-white dark:bg-[#121212] px-5 md:px-7">
        {items.map((it, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-[#efe6d8] dark:border-[#232323]">
            <AccordionTrigger className="text-start text-[15px] md:text-base font-medium text-[#1D1D1D] dark:text-[#F4F1E9] hover:no-underline hover:text-[#FF6A00]">
              {it.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm md:text-[15px] leading-7 text-[#5f5a52] dark:text-[#bdb9ad]">
              {it.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default FAQSection;

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { breadcrumbSchema } from '@/lib/seoShared';

export interface Crumb {
  label: string;
  /** Relative path, e.g. "/shop". The last crumb is the current page (no link). */
  path: string;
}

/**
 * Visible breadcrumb trail + BreadcrumbList JSON-LD.
 * Good for UX, for Google's breadcrumb display, and for AI engines that use
 * the trail to understand where a page sits in the site hierarchy.
 */
const Breadcrumbs: React.FC<{ items: Crumb[]; className?: string }> = ({ items, className = '' }) => {
  if (!items.length) return null;
  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema(items.map((i) => ({ name: i.label, path: i.path }))))}
        </script>
      </Helmet>
      <nav aria-label="breadcrumb" className={`text-xs text-[#8D8D8D] ${className}`}>
        <ol className="flex items-center gap-2 flex-wrap">
          {items.map((c, i) => {
            const last = i === items.length - 1;
            return (
              <li key={c.path + i} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="text-[#1D1D1D] dark:text-[#F4F1E9] font-medium">{c.label}</span>
                ) : (
                  <Link to={c.path} className="hover:text-[#FF6A00] transition-colors">{c.label}</Link>
                )}
                {!last && <span aria-hidden className="text-[#c9c1b5] rtl:rotate-180">›</span>}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumbs;

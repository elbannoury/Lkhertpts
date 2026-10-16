// Thin re-export so older imports keep working. All builders live in seoShared.js
// (shared with the bot pre-render function) — edit them there.
export {
  organizationSchema as buildOrganizationJsonLd,
  websiteSchema as buildWebsiteJsonLd,
  breadcrumbSchema as buildBreadcrumbJsonLd,
  faqSchema as buildFaqJsonLd,
  productSchema as buildProductJsonLd,
  collectionSchema as buildCollectionJsonLd,
} from './seoShared.js';

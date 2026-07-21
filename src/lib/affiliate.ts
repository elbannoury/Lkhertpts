// Affiliate referral helpers.
// A shopper can land on ANY page — most often a shared product link like
// /products/xyz?ref=CODE — and we persist CODE (first-touch: the FIRST valid
// referral wins, so a later click from a different link never steals credit)
// so that whenever they eventually check out, the order is attributed correctly.

const KEY = 'pts_ref';

export function captureRefFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (!ref) return;
    // First-touch attribution: if a still-valid referral is already stored,
    // don't let a later link (even from a different affiliate) overwrite it.
    if (getRefCode()) return;
    localStorage.setItem(
      KEY,
      JSON.stringify({
        code: ref.trim().toLowerCase(),
        ts: Date.now(),
        landing: window.location.pathname + window.location.search,
      }),
    );
  } catch { /* ignore */ }
}

export function getRefCode(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // referrals valid for 30 days
    if (Date.now() - (parsed.ts || 0) > 30 * 24 * 60 * 60 * 1000) return null;
    return parsed.code || null;
  } catch { return null; }
}

export function clearRef() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

// Build a shareable product link that carries an affiliate code (used by the
// admin/affiliate copy-link button). When no code is given the plain link is returned.
export function affiliateLink(handle: string, code?: string | null): string {
  const base = `${window.location.origin}/products/${handle}`;
  return code ? `${base}?ref=${encodeURIComponent(code)}` : base;
}

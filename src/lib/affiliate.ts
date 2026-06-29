// Affiliate referral helpers.
// A shopper lands on /products/xyz?ref=CODE — we persist CODE so that when they
// later check out the order is attributed to the affiliate.

const KEY = 'pts_ref';

export function captureRefFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem(KEY, JSON.stringify({ code: ref.trim().toLowerCase(), ts: Date.now() }));
    }
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

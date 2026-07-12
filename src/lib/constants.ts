// ============================================================================
// PITSIKY — single source of truth for shared, app-wide constants.
// Previously these values were copy-pasted (and DRIFTED) across many files:
//   • The CRM project id was DIFFERENT in 4 places, so leads from the footer,
//     checkout, contact form and custom-poster form were all being sent to the
//     WRONG projects and silently lost. Now there is ONE correct id, here.
//   • The WhatsApp number was hard-coded in ~6 components.
// Import from here everywhere instead of re-declaring.
// ============================================================================

/** Correct Famous CRM project id for this storefront. */
export const CRM_PROJECT_ID = '6a3c359d8c702bb6c419c6d7';

/** Business WhatsApp number (international format, no spaces). */
export const WHATSAPP_NUMBER = '+212702382376';
export const WHATSAPP_DISPLAY = '+212 702 382 376';
export const whatsappLink = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export interface CrmSubscribePayload {
  email?: string;
  name?: string;
  phone?: string;
  sms_opt_in?: boolean;
  source?: string;
  tags?: string[];
  note?: string;
}

/**
 * Subscribe a contact to the project's CRM. Fire-and-forget and fully
 * defensive — it NEVER throws, so a network hiccup can never block a checkout
 * or a form submission. Always resolves.
 */
export const crmSubscribe = async (payload: CrmSubscribePayload): Promise<boolean> => {
  if (!payload.email && !payload.phone) return false;
  try {
    const res = await fetch(`https://famous.ai/api/crm/${CRM_PROJECT_ID}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
};

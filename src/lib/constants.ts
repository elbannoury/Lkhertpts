// ============================================================================
// PITSIKY — single source of truth for shared, app-wide constants.
// Previously these values were copy-pasted (and DRIFTED) across many files:
//   • The CRM project id was DIFFERENT in 4 places, so leads from the footer,
//     checkout, contact form and custom-poster form were all being sent to the
//     WRONG projects and silently lost. Now there is ONE correct id, here.
//   • The WhatsApp number was hard-coded in ~6 components.
// Import from here everywhere instead of re-declaring.
// ============================================================================

/** Business WhatsApp number (international format, no spaces). */
export const WHATSAPP_NUMBER = '+212702382376';
export const WHATSAPP_DISPLAY = '+212 702 382 376';
export const whatsappLink = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

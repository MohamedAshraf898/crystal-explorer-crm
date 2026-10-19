import { crm, crmEnabled, crmHeaders } from '../data/crm.js';

/**
 * Request-information form → CRM lead (brochure-inquiry Edge Function).
 * Without a CRM configured (js/data/crm.js) it behaves as before: a local reference only.
 * Throwing shows the form's existing "Something went wrong" message.
 */
export async function submitInquiry(payload) {
  if (!crmEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return { reference: `CA-${payload.apartmentId.replace('-', '')}-${Date.now().toString(36).slice(-4).toUpperCase()}` };
  }
  const res = await fetch(`${crm.url.replace(/\/$/, '')}/functions/v1/brochure-inquiry`, {
    method: 'POST',
    headers: crmHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      request_id: crypto.randomUUID(),
      project: crm.projectSlug,
      apartment_id: payload.apartmentId,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      message: payload.message,
    }),
  });
  if (!res.ok) throw new Error(`Inquiry failed (${res.status})`);
  const data = await res.json();
  if (!data?.reference) throw new Error('Inquiry failed');
  return { reference: data.reference };
}

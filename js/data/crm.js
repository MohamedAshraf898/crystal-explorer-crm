/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CRM CONNECTION — live availability and inquiries
 * ─────────────────────────────────────────────────────────────────────────────
 *  url:      the Supabase project URL, e.g. 'https://abcd1234.supabase.co'
 *  anonKey:  the project's PUBLIC anon / publishable key. It is safe in the browser:
 *            it can only read the brochure feed (no customer or staff data).
 *            Never put a service-role key here.
 *
 *  Leave url empty to run exactly as before: statuses and prices from
 *  apartments.js, and the request form doesn't send anywhere.
 */
export const crm = {
  url: '',
  anonKey: '',
  projectSlug: 'crystal-alamein',
  // The brochure never waits longer than this for the CRM; after it, the
  // built-in data in apartments.js is shown.
  timeoutMs: 4000,
};

export const crmEnabled = () => Boolean(crm.url && crm.anonKey);

/** Headers for Supabase: new publishable keys go in apikey only; legacy anon JWTs also as a bearer token. */
export function crmHeaders(extra = {}) {
  const h = { apikey: crm.anonKey, ...extra };
  if (!crm.anonKey.startsWith('sb_')) h.Authorization = `Bearer ${crm.anonKey}`;
  return h;
}

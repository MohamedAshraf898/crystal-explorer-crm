import { apartments, apartmentsById, ranges } from './apartments.js';
import { crm, crmEnabled, crmHeaders } from './crm.js';

/**
 * LIVE INVENTORY — current status and price of every apartment from the CRM.
 *
 * Runs once at start-up, while the loading screen is showing, and only changes
 * data: it updates `status`, `price` and `estimated` on the apartment objects in
 * apartments.js before any view is drawn. Nothing about the page changes.
 *
 * If the CRM is not configured, slow (> crm.timeoutMs), unreachable or returns
 * something unexpected, nothing is changed and the brochure shows its built-in
 * data, exactly as before.
 *
 * Returns 'live' | 'static' (for debugging: window.__inventorySource with ?debug).
 */
const STATUSES = new Set(['available', 'reserved', 'sold']);

export async function syncInventory() {
  if (!crmEnabled()) return 'static';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), crm.timeoutMs);
  try {
    const url = `${crm.url.replace(/\/$/, '')}/rest/v1/rpc/brochure_units?p_project_slug=${encodeURIComponent(crm.projectSlug)}`;
    const res = await fetch(url, { headers: crmHeaders(), signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`CRM feed ${res.status}`);
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('CRM feed empty');

    // Validate everything first, then apply: never leave the data half-updated.
    const updates = [];
    for (const row of rows) {
      const apt = apartmentsById.get(row.brochure_key);
      if (!apt || !STATUSES.has(row.status)) continue;
      const price = row.price == null ? null : Number(row.price);
      if (price != null && !(price > 0)) continue;
      updates.push([apt, row.status, price, price == null ? false : Boolean(row.price_is_estimate)]);
    }
    if (updates.length < apartments.length * 0.9) throw new Error('CRM feed incomplete');
    for (const [apt, status, price, estimated] of updates) {
      apt.status = status;
      apt.price = price;
      apt.estimated = estimated;
    }
    // filter bounds follow the live prices
    const priced = apartments.filter((a) => a.price != null).map((a) => a.price);
    if (priced.length) ranges.price = [Math.min(...priced), Math.max(...priced)];
    return 'live';
  } catch (err) {
    console.info('Availability: showing built-in data.', err?.message ?? err);
    return 'static';
  } finally {
    clearTimeout(timer);
  }
}

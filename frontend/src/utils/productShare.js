export function productUrl(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}

export function productImage(value, api) {
  if (!value) return '';
  const remote = productUrl(value);
  if (remote) return remote;
  if (!String(value).startsWith('/uploads/')) return '';
  return new URL(value, api).href;
}

export async function shareProduct(product, { navigator }, photo = null) {
  const url = productUrl(product.link);
  if (!url) throw new Error('This product does not have a valid share link');
  if (!navigator.share) {
    throw new Error('Phone sharing is unavailable in this browser. Open this page over HTTPS in a browser that supports sharing.');
  }
  const data = { title: 'Product', text: product.description || 'Take a look at this product', url };
  if (photo && navigator.canShare?.({ files: [photo] })) data.files = [photo];
  // Invoke directly from the tap: awaiting downloads here would lose activation.
  try { await navigator.share(data); return 'shared'; }
  catch (error) {
    if (error.name === 'AbortError') return 'cancelled';
    if (error.name === 'NotAllowedError') throw new Error('Sharing could not open. Use this page over HTTPS and try again.');
    throw error;
  }
}

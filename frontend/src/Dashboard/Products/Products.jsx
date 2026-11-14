import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { ExternalLink, ImageIcon, Loader2, Pencil, Plus, RefreshCw, X } from 'lucide-react';
import ProductDialog from '../../components/ProductDialog';
import { productImage, productUrl } from '../../utils/productShare';

const API = import.meta.env.VITE_API_BASE_URL;
const empty = { description: '', link: '', active: true };
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('adminTokens') || ''}` });

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(undefined);
  const [form, setForm] = useState(empty);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');
  const fetchProducts = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await axios.get(`${API}/products`, { headers: auth() }); setProducts(data.data || []); }
    catch (err) { setError(err.response?.data?.message || 'Unable to load products'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    if (!photo) { setPreview(''); return; }
    const url = URL.createObjectURL(photo); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  const openEditor = (product = null) => {
    setEditing(product); setPhoto(null); setFormError(''); setMessage('');
    setForm(product ? { description: product.description, link: product.link, active: Boolean(Number(product.active)) } : empty);
  };
  const close = () => { if (!saving) { setEditing(undefined); setPhoto(null); } };
  const save = async event => {
    event.preventDefault();
    if (saving) return;
    if (!productUrl(form.link)) { setFormError('Enter a valid HTTP or HTTPS product link'); return; }
    if (!photo && !editing?.imgLink) { setFormError('Choose a product photo'); return; }
    if (photo && (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size > 5 * 1024 * 1024)) { setFormError('Choose a JPG, PNG or WebP photo, 5 MB or smaller'); return; }
    setSaving(true); setFormError('');
    const payload = new FormData();
    payload.append('description', form.description.trim()); payload.append('link', form.link.trim()); payload.append('active', form.active ? '1' : '0');
    if (photo) payload.append('photo', photo);
    try {
      if (editing) await axios.put(`${API}/products/${editing.id}`, payload, { headers: auth() });
      else await axios.post(`${API}/products`, payload, { headers: auth() });
      setEditing(undefined); setPhoto(null); setMessage(editing ? 'Product updated.' : 'Product added. It is ready for sharing.'); await fetchProducts();
    } catch (err) { setFormError(err.response?.data?.message || 'Unable to save product. Please try again.'); }
    finally { setSaving(false); }
  };
  const disable = async product => {
    if (!window.confirm('Disable this product? It will no longer appear in sharing tasks.')) return;
    try { await axios.delete(`${API}/products/${product.id}`, { headers: auth() }); setMessage('Product disabled.'); await fetchProducts(); }
    catch (err) { setError(err.response?.data?.message || 'Unable to disable product'); }
  };
  return <div className="mx-auto max-w-6xl space-y-6 text-slate-900">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Sharing tasks</p><h1 className="mt-1 text-2xl font-semibold">Products</h1><p className="mt-2 max-w-xl text-sm text-slate-600">Upload a photo and a product link. Members share these products to complete their daily tasks.</p></div><button onClick={() => openEditor()} className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"><Plus size={18} />Add product</button></header>
    {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}<button onClick={fetchProducts} className="ml-3 min-h-11 underline">Retry</button></div>}
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
    <div className="flex items-center justify-between"><p className="text-sm text-slate-600">{products.length} products · {products.filter(p => Number(p.active)).length} active</p><button onClick={fetchProducts} disabled={loading} aria-label="Refresh products" className="grid h-11 w-11 place-items-center rounded-xl border border-slate-300"><RefreshCw size={17} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} /></button></div>
    {loading ? <div role="status" className="flex items-center gap-2 py-12 text-slate-600"><Loader2 className="animate-spin motion-reduce:animate-none" size={20} />Loading products…</div> : products.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center"><ImageIcon className="mx-auto text-slate-400" size={36} /><h2 className="mt-4 font-semibold">Your first product starts here</h2><p className="mt-2 text-sm text-slate-600">Add a photo, description and the link members should share.</p></div> :
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map(product => <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="relative aspect-[4/3] bg-slate-100"><ImageIcon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400" size={32} aria-hidden="true" />{productImage(product.imgLink, API) && <img src={productImage(product.imgLink, API)} alt={product.description} loading="lazy" className="relative h-full w-full object-cover" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />}</div>
        <div className="space-y-3 p-4"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${Number(product.active) ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{Number(product.active) ? 'Active' : 'Disabled'}</span><h2 className="break-words text-base font-semibold">{product.description}</h2>{productUrl(product.link) && <a href={product.link} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-2 text-sm text-slate-600 underline"><span className="truncate">{product.link}</span><ExternalLink size={15} className="shrink-0" /></a>}<div className="flex gap-2"><button onClick={() => openEditor(product)} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-medium hover:bg-slate-50"><Pencil size={16} />Edit</button>{Boolean(Number(product.active)) && <button onClick={() => disable(product)} className="min-h-11 flex-1 rounded-xl bg-slate-100 px-3 text-sm font-medium hover:bg-slate-200">Disable</button>}</div></div>
      </article>)}</div>}
    {editing !== undefined && <ProductDialog titleId="product-editor-title" busy={saving} onClose={close}>
      <form onSubmit={save} className="space-y-5 bg-white p-5 text-slate-900"><div className="flex items-center justify-between"><h2 id="product-editor-title" className="text-lg font-semibold">{editing ? 'Edit product' : 'Add product'}</h2><button type="button" disabled={saving} onClick={close} aria-label="Close product editor" className="grid h-11 w-11 place-items-center rounded-full hover:bg-slate-100"><X size={20} /></button></div>
        {formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{formError}</p>}
        <div><label htmlFor="product-photo" className="block text-sm font-semibold">Product photo</label><p id="photo-help" className="mt-1 text-sm text-slate-500">JPG, PNG or WebP · maximum 5 MB</p><input id="product-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-help" required={!editing?.imgLink} onChange={event => { setPhoto(event.target.files[0] || null); setFormError(''); }} className="mt-3 block w-full text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:text-slate-900" />{(preview || editing?.imgLink) && <img src={preview || productImage(editing.imgLink, API)} alt="Product preview" className="mt-3 h-40 w-full rounded-xl bg-slate-100 object-contain" />}</div>
        <div><label htmlFor="product-description" className="block text-sm font-semibold">Description</label><textarea id="product-description" required maxLength={255} rows={3} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-base focus:outline focus:outline-2 focus:outline-slate-900" /></div>
        <div><label htmlFor="product-link" className="block text-sm font-semibold">Product link</label><input id="product-link" type="url" required maxLength={255} placeholder="https://example.com/product" value={form.link} onChange={event => setForm({ ...form, link: event.target.value })} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 text-base focus:outline focus:outline-2 focus:outline-slate-900" /></div>
        <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })} className="h-5 w-5" />Active and available for sharing</label>
        <div className="flex gap-3"><button type="button" disabled={saving} onClick={close} className="min-h-12 flex-1 rounded-xl border border-slate-300 px-4 text-sm font-semibold disabled:opacity-50">Cancel</button><button type="submit" disabled={saving} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 size={18} className="animate-spin motion-reduce:animate-none" />}{saving ? 'Saving…' : 'Save product'}</button></div>
      </form>
    </ProductDialog>}
  </div>;
}

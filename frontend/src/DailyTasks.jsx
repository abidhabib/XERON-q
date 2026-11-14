import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, ExternalLink, ImageIcon, Loader2, RefreshCw, Share2 } from 'lucide-react';
import { UserContext } from './UserContext/UserContext';
import NavBar from './NavBar';
import { productImage, productUrl, shareProduct } from './utils/productShare';

const API = import.meta.env.VITE_API_BASE_URL;
const money = value => Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 6 });

export default function DailyTasks() {
  const { fetchUserData } = useContext(UserContext);
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(null);
  const [retryItem, setRetryItem] = useState(null);
  const lock = useRef(false);
  const shared = useRef(new Set());
  const photos = useRef(new Map());
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await axios.get(`${API}/fetchClickedProducts`, { withCredentials: true });
      setTasks(data);
    } catch (err) { setError(err.response?.data?.error || 'Unable to load tasks. Please try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => { shared.current.clear(); setRetryItem(null); }, [tasks?.reward_date]);

  // Prepare supported photos ahead of the click so native sharing opens immediately.
  useEffect(() => {
    if (!navigator.canShare || !tasks?.products) return;
    const controller = new AbortController();
    tasks.products.slice(0, 20).forEach(async product => {
      const url = productImage(product.imgLink, API);
      if (!url || photos.current.has(url)) return;
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return;
        const blob = await response.blob();
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(blob.type) || blob.size > 5 * 1024 * 1024) return;
        photos.current.set(url, new File([blob], `product-${product.id}.${blob.type.split('/')[1]}`, { type: blob.type }));
      } catch { /* Link sharing remains available when a photo cannot be attached. */ }
    });
    return () => controller.abort();
  }, [tasks?.products]);

  const finishTask = async product => {
    try {
      const { data } = await axios.post(`${API}/updateBalance`, { productId: product.id }, { withCredentials: true });
      setTasks(data); setRetryItem(null);
      setNotice('Task completed. Your balance has been updated.');
      // Refresh wallet context separately: a refresh failure must not retry payment.
      Promise.resolve(fetchUserData?.()).catch(() => {});
    } catch (err) {
      if (err.response?.status === 409) {
        setRetryItem(null); setNotice('This task is already completed.'); await load();
      } else {
        setRetryItem(product);
        setError(err.response?.data?.error || 'Sharing opened, but the reward could not be confirmed. Retry claiming below.');
      }
    }
  };
  const handleShare = async product => {
    if (lock.current) return;
    lock.current = true; setBusy(product.id); setError(''); setNotice('');
    try {
      if (!shared.current.has(product.id)) {
        const result = await shareProduct(product, { navigator }, photos.current.get(productImage(product.imgLink, API)));
        if (result === 'cancelled') return;
        shared.current.add(product.id);
      }
      await finishTask(product);
    } catch (err) { setError(err.message || 'Sharing failed. Please try again.'); }
    finally { lock.current = false; setBusy(null); }
  };
  const products = tasks?.products || [];
  return <div className="min-h-dvh bg-[#f5f5f4] text-[#17212b]" style={{ fontFamily: "'Inter', sans-serif" }}>
    <div className="mx-auto min-h-dvh max-w-md">
      <header className="rounded-b-[14px] bg-[#20262d] px-3 pb-3 pt-2 text-white shadow-[0_3px_10px_rgba(22,28,35,0.12)]">
        <NavBar />
        <div className="mt-2 flex items-center justify-between gap-2">
          <div><h1 className="text-[15px] font-semibold">Daily tasks</h1><p className="mt-0.5 text-xs text-[#b4c0ce]">Share products to complete your tasks.</p></div>
          <button onClick={load} disabled={loading || busy !== null} aria-label="Refresh tasks" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#303943] text-[#d7dee7] transition-colors hover:bg-[#3a4652] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5c927]"><RefreshCw size={17} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} /></button>
        </div>
        <section className="mt-2 grid grid-cols-2 items-end gap-3 border-t border-white/10 pt-2" aria-label="Balance and task progress">
          <div><p className="text-[11px] text-[#b4c0ce]">Balance</p><p className="mt-0.5 text-[18px] font-semibold leading-tight tabular-nums">${money(tasks?.balance)}</p></div>
          <div className="pb-0.5 text-right"><p className="text-[13px] font-semibold tabular-nums">{tasks?.completed_today || 0}/{tasks?.allowed_tasks || 0}</p><p className="mt-0.5 text-[11px] text-[#b4c0ce]">Completed</p></div>
        </section>
      </header>
      <main className="space-y-2 px-2.5 pb-5 pt-2.5">
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">{error}</div>}
        {notice && <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{notice}</div>}
        {retryItem && <button disabled={busy !== null} onClick={() => handleShare(retryItem)} className="min-h-11 w-full rounded-lg bg-[#20262d] px-3 text-xs font-semibold text-white disabled:opacity-50">Retry claiming reward</button>}
        {loading && !tasks ? <div className="space-y-2" aria-label="Loading tasks">{[1, 2, 3].map(id => <div key={id} className="flex gap-3 rounded-xl bg-white p-2.5"><div className="h-24 w-24 shrink-0 animate-pulse rounded-lg bg-[#edf1f5] motion-reduce:animate-none" /><div className="flex flex-1 flex-col justify-between py-1"><div className="h-3 w-3/4 animate-pulse rounded bg-[#edf1f5] motion-reduce:animate-none" /><div className="h-11 animate-pulse rounded-lg bg-[#edf1f5] motion-reduce:animate-none" /></div></div>)}</div> : tasks?.daily_limit_reached ?
          <div className="rounded-xl bg-white px-3 py-5 text-center shadow-[0_2px_5px_rgba(27,38,49,0.06)]"><CheckCircle2 className="mx-auto text-emerald-700" size={25} /><h2 className="mt-2 text-sm font-semibold">You’re done for today</h2><p className="mt-1 text-xs leading-5 text-[#526277]">{tasks.message || 'Your rewards are in your balance. Come back tomorrow.'}</p></div> : products.length === 0 && !error ?
          <div className="rounded-xl bg-white px-3 py-5 text-center shadow-[0_2px_5px_rgba(27,38,49,0.06)]"><ImageIcon className="mx-auto text-[#778497]" size={25} /><h2 className="mt-2 text-sm font-semibold">No products available</h2><p className="mt-1 text-xs leading-5 text-[#526277]">New products will appear here when available.</p></div> :
          <section className="space-y-2" aria-label="Products to share">{products.map(product => <article key={product.id} className="flex gap-2.5 rounded-xl bg-white p-2.5 shadow-[0_2px_5px_rgba(27,38,49,0.06)] ring-1 ring-black/[0.02]">
            <div className="relative h-24 w-24 shrink-0 self-start overflow-hidden rounded-lg bg-[#edf1f5]">
              <ImageIcon aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8a99ac]" size={23} />
              {productImage(product.imgLink, API) && <img src={productImage(product.imgLink, API)} alt={product.description} loading="lazy" className="relative h-full w-full object-cover" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 break-words text-[13px] font-semibold leading-[18px]">{product.description}</h2>
              <div className="flex flex-wrap items-center justify-between gap-x-2">
                {productUrl(product.link) && <a href={product.link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 text-[11px] font-medium text-[#526277] underline underline-offset-2">View product <ExternalLink size={12} aria-hidden="true" /></a>}
              </div>
              <button onClick={() => handleShare(product)} disabled={busy !== null || Number(tasks.reward_per_task) <= 0} aria-label="Share product" className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[#f5c927] px-2 text-xs font-semibold text-[#20262d] transition-colors hover:bg-[#e6ba17] disabled:cursor-not-allowed disabled:bg-[#edf1f5] disabled:text-[#68788b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20262d]">
                {busy === product.id ? <Loader2 size={15} className="animate-spin motion-reduce:animate-none" /> : <Share2 size={15} />} {busy === product.id ? 'Processing…' : 'Share product'}
              </button>
              {Number(tasks.reward_per_task) <= 0 && <p className="mt-1 text-[11px] leading-4 text-[#526277]">Backend funds needed to earn.</p>}
            </div>
          </article>)}</section>}
      </main>
    </div>
  </div>;
}

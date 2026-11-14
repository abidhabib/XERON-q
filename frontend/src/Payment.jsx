import axios from 'axios';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock3, Copy, LogOut, QrCode, RefreshCw, ShieldCheck, Wallet } from 'lucide-react';
import { UserContext } from './UserContext/UserContext';

const formatAmount = amount => {
  const value = Number(amount || 0);
  return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 8 }) : '0';
};

const Payment = () => {
  const navigate = useNavigate();
  const { logout } = useContext(UserContext);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('Creating your secure payment address…');
  const [copied, setCopied] = useState(false);

  const createInvoice = async () => {
    setCreating(true);
    setError('');
    setNotice('Creating your secure payment address…');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/crypto-invoice`, {}, { withCredentials: true });
      setInvoice(response.data);
      setNotice('Send USDT to this address. We will confirm the payment automatically.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to create a payment address.');
      setNotice('');
    } finally {
      setCreating(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/getUserIdFromSession`, { withCredentials: true })
      .then(response => {
        if (!response.data.userId) throw new Error('Login required');
        if (active) createInvoice();
      })
      .catch(() => { if (active) navigate('/'); });
    return () => { active = false; };
  }, [navigate]);

  useEffect(() => {
    if (!invoice?.invoice_id) return undefined;
    let cancelled = false;
    const checkStatus = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/crypto-invoice/${invoice.invoice_id}`, { withCredentials: true });
        if (cancelled) return;
        const current = response.data;
        setInvoice(previous => previous ? { ...previous, ...current } : previous);
        const complete = Number(current.remaining_amount || 0) <= 0;
        if (current.status === 'paid' || (current.status === 'swept' && complete)) {
          setNotice('Payment confirmed. Your account has been activated.');
          window.setTimeout(() => window.location.replace('/waiting'), 1200);
        } else if (current.status === 'expired' || current.status === 'swept') {
          setNotice('This invoice expired before the full amount arrived. Your account was not activated.');
        } else if (Number(current.received_amount || 0) > 0) {
          setNotice(`Received ${formatAmount(current.received_amount)} USDT. Please send the remaining ${formatAmount(current.remaining_amount)} USDT to this same address.`);
        } else {
          setNotice('Waiting for USDT payment and 15 blockchain confirmations…');
        }
      } catch (_) {
        if (!cancelled) setNotice('Checking blockchain payment status…');
      }
    };
    checkStatus();
    const interval = window.setInterval(checkStatus, 10_000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [invoice?.invoice_id]);

  const copyAddress = async () => {
    if (!invoice?.address) return;
    await navigator.clipboard.writeText(invoice.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isExpired = invoice?.status === 'expired' || invoice?.status === 'swept';
  const hasPartial = Number(invoice?.received_amount || 0) > 0 && Number(invoice?.remaining_amount || 0) > 0;
  const qrUrl = useMemo(() => invoice?.address ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(invoice.address)}` : '', [invoice?.address]);

  if (loading) return <div className="min-h-dvh grid place-items-center bg-[#f5f5f3]"><span className="h-7 w-7 rounded-full border-2 border-slate-200 border-t-[#d5a927] animate-spin" /></div>;

  return (
    <div className="min-h-dvh bg-[#f5f5f3] text-slate-900">
      <header className="relative overflow-hidden rounded-b-[5px] bg-[#20252b] px-3 pb-5 pt-3.5 shadow-[0_8px_24px_rgba(25,31,38,0.15)]">
        <div className="mx-auto flex max-w-md items-center justify-between"><div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-[#efbf34] ring-1 ring-white/10"><ShieldCheck size={18} /></div><img src="/logo.png" alt="Rovexking" className="h-10 w-auto object-contain" /><button onClick={handleLogout} type="button" aria-label="Log out" className="grid h-9 w-9 place-items-center rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"><LogOut size={17} /></button></div>
        <div className="mx-auto mt-3 flex max-w-md items-center justify-center gap-2 text-center"><span className="h-1.5 w-5 rounded-full bg-[#efbf34]" /><span className="h-1.5 w-5 rounded-full bg-[#efbf34]" /><span className="h-1.5 w-5 rounded-full bg-[#efbf34]" /><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-300">Account activation</span></div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 py-4 sm:py-5">
        {invoice?.address && !isExpired ? <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2.5"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f9f1d5] text-[#977000]"><Wallet size={18} /></div><div><h2 className="text-sm font-bold">Pay with USDT</h2><p className="text-xs text-slate-500">BEP20 · BSC network</p></div></div><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Required</p><p className="text-lg font-bold text-slate-900">{formatAmount(invoice.amount)} <span className="text-xs text-[#977000]">USDT</span></p></div></div>
          <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-4 rounded-xl bg-slate-50 p-3"><div className="min-w-0"><p className="text-xs font-medium text-slate-500">Scan from your wallet</p><p className="mt-1 text-sm font-semibold text-slate-800">Unique payment address</p>{hasPartial && <p className="mt-1 text-xs font-semibold text-[#8a6800]">Remaining: {formatAmount(invoice.remaining_amount)} USDT</p>}</div><div className="rounded-xl border border-slate-200 bg-white p-1.5"><img src={qrUrl} alt="QR code for the unique BEP20 USDT payment address" className="h-28 w-28 rounded-lg" /></div></div>
          <div className="mt-4"><div className="mb-1 flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-600">Payment address</span><button type="button" onClick={copyAddress} className="flex min-h-[36px] shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-bold text-[#8a6800] hover:bg-[#f9f1d5] focus:outline-none focus:ring-2 focus:ring-[#d5a927]/30">{copied ? <CheckCircle2 size={15} className="text-emerald-600" /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy'}</button></div><button type="button" onClick={copyAddress} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left font-mono text-[10px] leading-4 text-slate-700 break-all hover:border-[#d5a927]/50 focus:outline-none focus:ring-4 focus:ring-[#d5a927]/15">{invoice.address}</button></div>
          {hasPartial && <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"><span>Received: {formatAmount(invoice.received_amount)} USDT</span><strong>Remaining: {formatAmount(invoice.remaining_amount)}</strong></div>}
        </section> : <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">{creating ? <RefreshCw className="mx-auto animate-spin text-[#977000]" size={28} /> : <QrCode className="mx-auto text-[#977000]" size={32} />}<h2 className="mt-4 text-lg font-bold">{isExpired ? 'Payment address expired' : 'Address unavailable'}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{isExpired ? 'Create a new payment address to start a fresh activation payment.' : 'We could not prepare a payment address right now.'}</p>{isExpired && <button type="button" onClick={createInvoice} disabled={creating} className="mt-5 min-h-[44px] rounded-xl bg-[#20252b] px-4 text-sm font-bold text-white hover:bg-[#313840] disabled:opacity-60">Create new address</button>}</section>}

        {(notice || error) && <section aria-live="polite" className={`mt-3 flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-xs leading-5 ${error ? 'border-rose-100 bg-rose-50 text-rose-700' : isExpired ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-600'}`}>{error ? <AlertCircle aria-hidden="true" size={16} className="mt-0.5 shrink-0" /> : <Clock3 aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-[#977000]" />}<p>{error || notice}</p></section>}
        <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">USDT is verified automatically after 15 confirmations. Use BEP20 only.</p>
      </main>
    </div>
  );
};

export default Payment;

import { useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle2, Copy, Loader2, Wallet, X } from 'lucide-react';
import { UserContext } from '../UserContext/UserContext';
import NavBar from '../NavBar';

const API = import.meta.env.VITE_API_BASE_URL;
const CHAINS = { bep20: { name: 'BEP20 (BSC)', pattern: /^0x[a-fA-F0-9]{40}$/ } };

export default function WalletManager() {
  const { Userid } = useContext(UserContext);
  const [wallets, setWallets] = useState({});
  const [inputs, setInputs] = useState({});
  const [saving, setSaving] = useState({});
  const [fetching, setFetching] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(null);

  const loadWallets = useCallback(async () => {
    if (!Userid) return;
    setFetching(true); setLoadError('');
    try {
      const { data } = await axios.get(`${API}/api/wallets`, { withCredentials: true });
      if (!data.success) throw new Error(data.error || 'Unable to load your wallet');
      setWallets(data.wallets || {});
      setInputs(data.wallets || {});
    } catch (error) {
      setLoadError(error.response?.data?.error || error.message || 'Unable to load your wallet');
    } finally { setFetching(false); }
  }, [Userid]);
  useEffect(() => { loadWallets(); }, [loadWallets]);

  const saveAddress = async (event, chain) => {
    event.preventDefault();
    const address = (inputs[chain] || '').trim();
    if (saving[chain] || fetching || loadError) return;
    if (!CHAINS[chain].pattern.test(address)) {
      setNotice({ type: 'error', message: 'Enter a valid BEP20 address starting with 0x.' }); return;
    }
    if (address === (wallets[chain] || '')) return;
    setSaving(previous => ({ ...previous, [chain]: true })); setNotice(null);
    try {
      const { data } = await axios.put(`${API}/api/wallets`, { chain, address }, { withCredentials: true });
      if (!data.success) throw new Error(data.error || 'Unable to save your address');
      setWallets(previous => ({ ...previous, [chain]: address }));
      setInputs(previous => ({ ...previous, [chain]: address }));
      setNotice({ type: 'success', message: 'Withdrawal address saved.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.response?.data?.error || error.message || 'Unable to save your address' });
    } finally { setSaving(previous => ({ ...previous, [chain]: false })); }
  };
  const copyAddress = async address => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Copy is unavailable. Select and copy the address below.');
      await navigator.clipboard.writeText(address);
      setNotice({ type: 'success', message: 'Address copied.' });
    } catch { setNotice({ type: 'error', message: 'Could not copy. Select and copy the address below.' }); }
  };

  return <div className="min-h-dvh bg-[#f5f5f4] text-[#17212b]" style={{ fontFamily: "'Inter', sans-serif" }}>
    <div className="mx-auto min-h-dvh max-w-md">
      <header className="rounded-b-[14px] bg-[#20262d] px-3 pb-3 pt-2 text-white shadow-[0_3px_10px_rgba(22,28,35,0.12)]">
        <NavBar />
        <div className="mt-3 flex items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#303943] text-[#f5c927]"><Wallet size={19} aria-hidden="true" /></span>
          <div className="min-w-0 flex-1"><h1 className="text-[15px] font-semibold">Withdrawal wallet</h1><p className="mt-0.5 text-xs leading-5 text-[#b4c0ce]">Manage your withdrawal address.</p></div>
          <span className="rounded-full bg-[#4c4330] px-2 py-1 text-[11px] font-semibold text-[#f5c927]">BEP20</span>
        </div>
      </header>
      <main className="space-y-2.5 px-2.5 pb-5 pt-2.5">
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" /><p className="text-xs leading-5 text-amber-900">Use a BEP20 address on BNB Smart Chain. Check the address and network before saving.</p></div>
        {notice && <div role={notice.type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs leading-5 ${notice.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
          {notice.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />}
          <p className="flex-1">{notice.message}</p><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message" className="grid min-h-8 min-w-8 shrink-0 place-items-center rounded-lg hover:bg-black/5"><X size={14} /></button>
        </div>}
        {loadError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">{loadError}<button onClick={loadWallets} className="ml-2 inline-flex min-h-9 items-center font-semibold underline">Retry</button></div>}
        {fetching ? <div role="status" className="flex items-center gap-2 rounded-xl bg-white p-3 text-xs text-[#526277]"><Loader2 size={17} className="animate-spin motion-reduce:animate-none" />Loading your wallet…</div> : !loadError && Object.entries(CHAINS).map(([chain, config]) => {
          const saved = wallets[chain] || '';
          const input = inputs[chain] || '';
          const address = input.trim();
          const invalid = Boolean(address) && !config.pattern.test(address);
          const canSave = Boolean(address) && !invalid && address !== saved;
          return <form key={chain} onSubmit={event => saveAddress(event, chain)} className="space-y-3 rounded-xl bg-white p-3 shadow-[0_2px_5px_rgba(27,38,49,0.06)] ring-1 ring-black/[0.02]">
            <div className="flex items-center justify-between gap-2"><div><h2 className="text-[13px] font-semibold">{config.name}</h2><p className="mt-0.5 text-[11px] text-[#526277]">BNB Smart Chain</p></div><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${saved ? 'bg-emerald-50 text-emerald-800' : 'bg-[#edf1f5] text-[#526277]'}`}>{saved ? 'Linked' : 'Not set'}</span></div>
            {saved && <div className="rounded-lg bg-[#f5f7f9] px-2.5 py-2"><p className="text-[11px] font-medium text-[#526277]">Current address</p><div className="flex items-center gap-2"><p className="min-w-0 flex-1 select-all break-all font-mono text-xs leading-5 text-[#263545]">{saved}</p><button type="button" onClick={() => copyAddress(saved)} aria-label="Copy address" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-[#526277] hover:bg-[#e7ecf1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#20262d]"><Copy size={16} /></button></div></div>}
            <div><label htmlFor={`address-${chain}`} className="block text-xs font-semibold">{saved ? 'Update withdrawal address' : 'Withdrawal address'}</label><textarea id={`address-${chain}`} value={input} onChange={event => { setInputs(previous => ({ ...previous, [chain]: event.target.value })); setNotice(null); }} placeholder="0x…" spellCheck={false} autoCapitalize="none" autoCorrect="off" autoComplete="off" rows={2} disabled={saving[chain]} aria-invalid={invalid} aria-describedby={`address-help-${chain}${invalid ? ` address-error-${chain}` : ''}`} className={`mt-1.5 block w-full resize-none rounded-lg border bg-white px-2.5 py-2 font-mono text-sm leading-5 text-[#263545] outline-none disabled:opacity-60 ${invalid ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-[#dce4ec] focus:border-[#b89512] focus:ring-2 focus:ring-[#f5c927]/25'}`} />
              <p id={`address-help-${chain}`} className="mt-1 text-[11px] leading-4 text-[#526277]">42 characters, starting with 0x.</p>
              {invalid && <p id={`address-error-${chain}`} className="mt-1 text-xs leading-5 text-red-700">Enter a valid BEP20 address.</p>}
            </div>
            <button type="submit" disabled={!canSave || saving[chain]} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#f5c927] px-3 text-xs font-semibold text-[#20262d] transition-colors hover:bg-[#e6ba17] disabled:cursor-not-allowed disabled:bg-[#edf1f5] disabled:text-[#68788b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20262d]">{saving[chain] && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" />}{saving[chain] ? 'Saving…' : 'Save address'}</button>
          </form>;
        })}
      </main>
    </div>
  </div>;
}

import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../UserContext/UserContext';
import axios from 'axios';
import NavBar from '../NavBar';
import { Copy, AlertTriangle, RotateCw, DollarSign } from 'lucide-react';
import { FaEthereum } from 'react-icons/fa';
import { BiBitcoin, BiSolidCoin } from 'react-icons/bi';

const CHAINS = {
  bep20: { name: 'BEP20 (BSC)', icon: DollarSign, pattern: /^0x[a-fA-F0-9]{40}$/ },
  trc20: { name: 'TRC20 (TRON)', icon: BiSolidCoin, pattern: /^T[a-zA-Z0-9]{33}$/ },
  eth:   { name: 'ETH (Ethereum)', icon: FaEthereum, pattern: /^0x[a-fA-F0-9]{40}$/ },
  btc:   { name: 'BTC (Bitcoin)', icon: BiBitcoin, pattern: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/ },
};

const WalletManager = () => {
  const { Userid } = useContext(UserContext);
  const [wallets, setWallets] = useState({});
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2500);
  };

  useEffect(() => {
    if (!Userid) return;
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/api/wallets`, { withCredentials: true })
      .then((res) => {
        if (res.data.success) setWallets(res.data.wallets || {});
      })
      .catch(() => showToast('Failed to load wallets', 'error'));
  }, [Userid]);

  const validate = (chain, address) => CHAINS[chain]?.pattern.test(address.trim());

  const handleSave = async (chain) => {
    const address = inputs[chain]?.trim();
    if (!address || !validate(chain, address)) return showToast('Invalid address format', 'error');
    setLoading((prev) => ({ ...prev, [chain]: true }));
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/wallets`, { chain, address }, { withCredentials: true });
      setWallets((prev) => ({ ...prev, [chain]: address }));
      showToast('Address saved successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save address', 'error');
    } finally {
      setLoading((prev) => ({ ...prev, [chain]: false }));
    }
  };

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address);
    showToast('Copied to clipboard', 'success');
  };

  return (
    <div className="min-h-screen bg-[#161618]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Inter:wght@400;500;600;700&display=swap');
        .fd { font-family: 'Cormorant', serif; }
        .fi { font-family: 'Inter', sans-serif; }
        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <NavBar />

      <main className="lg:pl-[300px] pb-28 lg:pb-12">
        <div className="relative max-w-md mx-auto px-4 sm:px-6 pt-3 lg:pt-10">

          <div className="pointer-events-none absolute inset-x-0 top-0 h-56"
            style={{ background: 'radial-gradient(70% 100% at 50% 0%, rgba(198,161,91,0.05), transparent 70%)' }} />

          {/* Header */}
          <div className="rise relative">
            <h1 className="fd text-[26px] sm:text-[28px] font-medium text-[#EDEDEE] leading-tight">Wallet Addresses</h1>
            <p className="fi text-[13px] text-[#A0A0A6] mt-0.5">Manage your withdrawal address for each network</p>
          </div>

          {/* Security note */}
          <div className="rise relative flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-[#C6A15B]/[0.06] ring-1 ring-[#C6A15B]/15 mt-5" style={{ animationDelay: '0.05s' }}>
            <AlertTriangle size={15} className="text-[#C6A15B] flex-shrink-0 mt-[1px]" />
            <p className="fi text-[11.5px] text-[#A0A0A6] leading-relaxed">
              Always double-check the network. Funds sent to an incorrect address cannot be recovered.
            </p>
          </div>

          {/* Chains */}
          <div className="relative flex flex-col gap-3 mt-4">
            {Object.entries(CHAINS).map(([chain, config], i) => {
              const Icon = config.icon;
              const savedAddress = wallets[chain] || '';
              const inputVal = inputs[chain] || '';
              const isDirty = inputVal !== savedAddress;
              const isValid = inputVal ? validate(chain, inputVal) : true;
              const canSave = isDirty && isValid && inputVal.trim();
              const ringCls = !isValid && inputVal ? 'ring-2 ring-[#E2A896]/40' : 'focus:ring-2 focus:ring-[#C6A15B]/30';

              return (
                <div key={chain} className="rise rounded-xl bg-[#1B1B1E] ring-1 ring-white/[0.04] p-4" style={{ animationDelay: `${0.08 + i * 0.05}s` }}>
                  {/* Chain header */}
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-[#212125] flex items-center justify-center text-[#C6A15B] flex-shrink-0">
                      <Icon className="w-[17px] h-[17px]" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="fi text-[13.5px] font-semibold text-[#EDEDEE] leading-tight">{config.name}</h3>
                      {savedAddress ? (
                        <span className="fi flex items-center gap-1.5 text-[10px] font-medium text-[#8FC7A0] mt-0.5">
                          <span className="w-1 h-1 rounded-full bg-[#8FC7A0]" /> Linked
                        </span>
                      ) : (
                        <span className="fi flex items-center gap-1.5 text-[10px] font-medium text-[#6F6F76] mt-0.5">
                          <span className="w-1 h-1 rounded-full bg-[#6F6F76]" /> Not set
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Current address */}
                  {savedAddress && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#161618] ring-1 ring-white/[0.04]">
                      <span className="fi font-mono text-[11px] text-[#A0A0A6] truncate flex-1">{savedAddress}</span>
                      <button
                        onClick={() => copyAddress(savedAddress)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-[#6F6F76] hover:text-[#C6A15B] hover:bg-[#212125] transition-colors flex-shrink-0"
                        aria-label="Copy address"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  )}

                  {/* Input + save */}
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={inputVal}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [chain]: e.target.value }))}
                      placeholder={`Enter ${config.name} address`}
                      spellCheck={false}
                      className={`fi flex-1 min-w-0 h-11 px-3.5 text-[12.5px] font-mono text-[#EDEDEE] bg-[#212125] rounded-xl outline-none transition-all placeholder:text-[#57575D] placeholder:font-sans focus:bg-[#27272C] ${ringCls}`}
                    />
                    <button
                      onClick={() => handleSave(chain)}
                      disabled={loading[chain] || !canSave}
                      className={`fi h-11 px-4 rounded-xl text-[12.5px] font-semibold flex-shrink-0 flex items-center justify-center transition-all ${
                        canSave && !loading[chain]
                          ? 'bg-[#C6A15B] text-[#161618] hover:bg-[#D8BA7C] active:scale-[0.98]'
                          : 'bg-[#212125] text-[#57575D] cursor-not-allowed'
                      }`}
                    >
                      {loading[chain] ? <RotateCw size={14} className="animate-spin" /> : 'Save'}
                    </button>
                  </div>

                  {!isValid && inputVal && (
                    <p className="fi flex items-center gap-1.5 text-[11.5px] text-[#E2A896] mt-2">
                      <AlertTriangle size={12} className="flex-shrink-0" /> Invalid {config.name} address format
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]">
          <div className={`fi flex items-center gap-2.5 px-4 py-2.5 rounded-xl ring-1 shadow-[0_12px_32px_rgba(0,0,0,0.4)] ${
            toast.type === 'success' ? 'bg-[#1E2A22] ring-[#8FC7A0]/20' : 'bg-[#241619] ring-[#E2A896]/20'
          }`}>
            <span className={`w-5 h-5 flex items-center justify-center rounded-md text-[11px] font-bold ${
              toast.type === 'success' ? 'bg-[#8FC7A0]/15 text-[#8FC7A0]' : 'bg-[#E2A896]/15 text-[#E2A896]'
            }`}>
              {toast.type === 'success' ? '✓' : '✕'}
            </span>
            <span className="fi text-[13px] text-[#EDEDEE] font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletManager;
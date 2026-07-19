import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../UserContext/UserContext';
import axios from 'axios';
import {
  Copy,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  DollarSign
} from 'lucide-react';
import BalanceCard from './BalanceCard';
import { FaEthereum } from 'react-icons/fa';
import { BiBitcoin, BiSolidCoin } from 'react-icons/bi';

const CHAINS = {
  bep20: { name: 'BEP20 (BSC)', icon: DollarSign, pattern: /^0x[a-fA-F0-9]{40}$/ },
  trc20: { name: 'TRC20 (TRON)', icon: BiSolidCoin, pattern: /^T[a-zA-Z0-9]{33}$/ },
  eth:   { name: 'ETH (Ethereum)', icon: FaEthereum, pattern: /^0x[a-fA-F0-9]{40}$/ },
  btc:   { name: 'BTC (Bitcoin)', icon: BiBitcoin, pattern: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/ }
};

const WalletManager = () => {
  const { Userid } = useContext(UserContext);
  const [wallets, setWallets] = useState({});
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (!Userid) return;
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/wallets`, { withCredentials: true })
      .then(res => {
        if (res.data.success) setWallets(res.data.wallets || {});
      })
      .catch(() => showToast('Failed to load wallets', 'error'));
  }, [Userid]);

  const validate = (chain, address) => CHAINS[chain]?.pattern.test(address.trim());

  const handleSave = async (chain) => {
    const address = inputs[chain]?.trim();
    if (!address || !validate(chain, address)) {
      showToast('Invalid address format', 'error');
      return;
    }

    setLoading(prev => ({ ...prev, [chain]: true }));
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/wallets`,
        { chain, address },
        { withCredentials: true }
      );
      setWallets(prev => ({ ...prev, [chain]: address }));
      showToast('Address saved successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save address', 'error');
    } finally {
      setLoading(prev => ({ ...prev, [chain]: false }));
    }
  };

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address);
    showToast('Copied to clipboard', 'success');
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 2500);
  };

  const toastStyles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    error: 'bg-red-50 border-red-200 text-red-600'
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
      <BalanceCard />

      <div className="px-4 pb-6 pt-3">
        <div className="space-y-3">
          {Object.entries(CHAINS).map(([chain, config]) => {
            const Icon = config.icon;
            const savedAddress = wallets[chain] || '';
            const inputVal = inputs[chain] || '';
            const isDirty = inputVal !== savedAddress;
            const isValid = inputVal ? validate(chain, inputVal) : true;
            const canSave = isDirty && isValid && inputVal.trim();

            return (
              <div key={chain} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#fafafa] flex items-center justify-center">
                    <Icon className="w-[18px] h-[18px] text-[#1e2329]" />
                  </div>
                  <div>
                    <h3 className="text-[#1e2329] text-sm font-semibold">{config.name}</h3>
                    <span className="text-[11px] font-medium text-[#f0b90b] bg-[#f0b90b]/10 px-2 py-0.5 rounded-full inline-block mt-0.5">Active</span>
                  </div>
                </div>

                {savedAddress && (
                  <div className="mb-3 flex items-center gap-2 p-2.5 bg-[#fafafa] rounded-xl">
                    <span className="text-[#1e2329] text-xs font-mono break-all flex-1">
                      {savedAddress}
                    </span>
                    <button
                      onClick={() => copyAddress(savedAddress)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f0f0f0] text-[#848e9c] hover:text-[#1e2329] transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={e => setInputs(prev => ({ ...prev, [chain]: e.target.value }))}
                    placeholder={`Enter ${config.name} address`}
                    className={`w-full h-12 px-3.5 bg-[#fafafa] rounded-xl text-[#1e2329] placeholder-[#c1c7cd] text-sm font-mono outline-none transition-shadow ${
                      isValid ? 'focus:ring-2 focus:ring-[#f0b90b]' : 'focus:ring-2 focus:ring-[#f6465d]'
                    }`}
                  />

                  {!isValid && inputVal && (
                    <p className="text-[#f6465d] text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Invalid format
                    </p>
                  )}

                  <button
                    onClick={() => handleSave(chain)}
                    disabled={loading[chain] || !canSave}
                    className={`w-full h-11 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] ${
                      canSave
                        ? 'bg-[#f0b90b] text-[#0b0e11] active:opacity-90'
                        : 'bg-[#f5f5f5] text-[#c1c7cd] cursor-not-allowed'
                    }`}
                  >
                    {loading[chain] ? (
                      <RotateCw className="w-4 h-4 animate-spin mx-auto" />
                    ) : canSave ? (
                      'Save Address'
                    ) : savedAddress ? (
                      'No Changes'
                    ) : (
                      'Enter Valid Address'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {toast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border shadow-lg ${toastStyles[toast.type]}`}>
            <CheckCircle className={`w-4 h-4 ${toast.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`} />
            <span className="text-[#1e2329] text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletManager;
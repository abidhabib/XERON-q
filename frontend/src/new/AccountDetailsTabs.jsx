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

// Chain Config — extend as needed
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
  const [toast, setToast] = useState({ show: false, message: '' });

  // Fetch all wallets
  useEffect(() => {
    if (!Userid) return;
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/wallets/${Userid}`)
      .then(res => setWallets(res.data.wallets || {}))
      .catch(() => showToast('Failed to load wallets'));
  }, [Userid]);

  const validate = (chain, address) => {
    return CHAINS[chain]?.pattern.test(address.trim());
  };

  const handleSave = async (chain) => {
    const address = inputs[chain]?.trim();
    if (!address || !validate(chain, address)) {
      showToast('Invalid address format');
      return;
    }

    setLoading(prev => ({ ...prev, [chain]: true }));
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/wallets`, { userId: Userid, chain, address });
      setWallets(prev => ({ ...prev, [chain]: address }));
      showToast('Address saved successfully');
    } catch (err) {
      showToast('Failed to save address');
    } finally {
      setLoading(prev => ({ ...prev, [chain]: false }));
    }
  };

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address);
    showToast('Copied to clipboard');
  };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#111827]">
      <div className="bg-[#111827]">
        <BalanceCard />
      </div>

      <div className="px-2 pb-6 pt-2">
        <div className="space-y-4">
          {Object.entries(CHAINS).map(([chain, config]) => {
            const Icon = config.icon;
            const savedAddress = wallets[chain] || '';
            const inputVal = inputs[chain] || '';
            const isDirty = inputVal !== savedAddress;
            const isValid = inputVal ? validate(chain, inputVal) : true;
            const canSave = isDirty && isValid && inputVal.trim();

            return (
              <div key={chain} className="bg-[#19202a] rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1c2a3a] flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-medium">{config.name}</h3>
                    <p className="text-[#D4AF37]/60 text-xs">Active</p>
                  </div>
                </div>

                {savedAddress && (
                  <div className="mb-3 flex items-center gap-2 p-2.5 bg-[#1c2a3a] rounded-xl">
                    <span className="text-[#D4AF37]/80 text-xs font-mono break-all flex-1">
                      {savedAddress}
                    </span>
                    <button onClick={() => copyAddress(savedAddress)} className="text-[#D4AF37]/60 hover:text-[#D4AF37]">
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
                    className={`w-full px-3 py-2.5 bg-[#1c2a3a] rounded-xl text-white placeholder-[#D4AF37]/40 text-sm focus:outline-none focus:ring-1 ${
                      isValid ? 'focus:ring-[#D4AF37]' : 'focus:ring-rose-500'
                    }`}
                  />
                  
                  {!isValid && inputVal && (
                    <p className="text-rose-400 text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Invalid format
                    </p>
                  )}

                  <button
                    onClick={() => handleSave(chain)}
                    disabled={loading[chain] || !canSave}
                    className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${
                      canSave
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#c69c2e] text-gray-900 hover:from-[#e8c04e]'
                        : 'bg-[#1c2a3a] text-[#D4AF37]/50 cursor-not-allowed'
                    }`}
                  >
                    {loading[chain] ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin mx-auto" />
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

      {/* Toast */}
      {toast.show && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#c9a030]/30 backdrop-blur-sm rounded-lg shadow-lg">
            <CheckCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-white text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletManager;
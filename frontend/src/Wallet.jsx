import { useEffect, useContext } from 'react';
import { UserContext } from './UserContext/UserContext';
import NavBAr from './NavBAr';
import { Toaster } from 'react-hot-toast';
import { WithdrwaHistory } from './MyWithdrwal';
import { useNavigate } from 'react-router-dom';
import { RemoveTrailingZeros } from '../utils/utils';

const Wallet = () => {
  const { userData, fetchUserData } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const toWithdraw = () => { 
    navigate('/cashout');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavBAr />
      </div>

      {/* Main Content Container - Takes remaining space */}
      <div className="flex flex-col flex-1 pt-16">
        {/* Wallet Cards - Auto height based on content */}
        <div className="wallet-card rounded-b-xl bg-[#19202a] px-4 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center text-white">
              <p className="text-sm font-medium text-gray-400">CURRENT USD</p>
              <p className="text-2xl font-bold mt-1">
                ${RemoveTrailingZeros(Number(userData?.balance))}
              </p>
            </div>
            
            <div className="text-center text-white">
              <p className="text-sm font-medium text-gray-400">TOTAL WITHDRAWN</p>
              <p className="text-2xl font-bold mt-1">
                ${RemoveTrailingZeros(Number(userData?.total_withdrawal))}
              </p>
            </div>
          </div>
          
          <button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 mt-4 text-sm rounded-lg font-medium shadow-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={toWithdraw}
          >
            Withdraw Funds
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <WithdrwaHistory />
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  );
};

export default Wallet;
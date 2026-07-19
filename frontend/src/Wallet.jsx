import { useEffect, useContext } from 'react';
import { UserContext } from './UserContext/UserContext';
import { Toaster } from 'react-hot-toast';
import  WithdrwaHistory  from './MyWithdrwal';
import BalanceCard from './new/BalanceCard';
import { Link } from 'react-router-dom';

// ✅ Lucide Icons
import { Home, History } from 'lucide-react';

const Wallet = () => {
  const { fetchUserData } = useContext(UserContext);

  useEffect(() => {
    fetchUserData();
  }, []);

  // ✅ Minimal, premium action card component

  return (
    <>
        {/* ✅ Top Action Cards */}
                <BalanceCard />

       

        <WithdrwaHistory />
      
      <Toaster />
    </>
  );
};

export default Wallet;
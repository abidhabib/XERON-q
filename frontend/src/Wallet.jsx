import { useEffect, useContext } from 'react';
import { UserContext } from './UserContext/UserContext';
import NavBAr from './NavBAr';
import { Toaster } from 'react-hot-toast';
import { WithdrwaHistory } from './MyWithdrwal';
import BalanceCard from './new/BalanceCard';

const Wallet = () => {
  const { fetchUserData } = useContext(UserContext);

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <>

      <div className="bg-[#111827] ">
        <BalanceCard />
      </div>

      <WithdrwaHistory />
      
      <Toaster />
    </>
  );
};

export default Wallet;
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
      <NavBAr />

      {/* ✅ Container with #111827 background — matches WithdrwaHistory */}
      <div className="bg-[#111827] ">
        <BalanceCard />
      </div>

      {/* WithdrwaHistory starts immediately after — same bg */}
      <WithdrwaHistory />
      
      <Toaster />
    </>
  );
};

export default Wallet;
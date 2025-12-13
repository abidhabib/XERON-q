import { useEffect, useContext } from 'react';
import { UserContext } from './UserContext/UserContext';
import NavBAr from './NavBAr';
import { Toaster } from 'react-hot-toast';
import { WithdrwaHistory } from './MyWithdrwal';
import { useNavigate } from 'react-router-dom';
import BalanceCard from './new/BalanceCard';

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

<>

    <NavBAr />
        

      <div className="flex flex-col flex-1 pt-16">

          <BalanceCard />
      </div>
            <WithdrwaHistory />

      <Toaster />

</>


  );
};

export default Wallet;
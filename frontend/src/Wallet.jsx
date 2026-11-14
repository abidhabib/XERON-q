import { useEffect, useContext } from 'react';
import { UserContext } from './UserContext/UserContext';
import { Toaster } from 'react-hot-toast';
import WithdrwaHistory from './MyWithdrwal';

// ✅ Lucide Icons

const Wallet = () => {
  const { fetchUserData } = useContext(UserContext);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // ✅ Minimal, premium action card component

  return (
    <>

       

        <WithdrwaHistory />
      
      <Toaster />
    </>
  );
};

export default Wallet;

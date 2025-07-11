import { createContext, useState, useCallback } from 'react';
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // User-related state
  const [userData, setUserData] = useState(null);
  const [Userid, setUserid] = useState(null);
  const [NewName, setNewName] = useState('');
  const [dp, setDp] = useState(null);
  const [level, setLevel] = useState(0);
  const [team, setTeam] = useState(0);
  const [today_team, setToday_team] = useState(0);
  const [team_earning  , setTeam_earning] = useState(0);
  const [bonus_earning, setBonus_earning] = useState(0);
  const [level_earning, setLevel_earning] = useState(0);
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [approved, setApproved] = useState(0);
  const [isRejected, setIsRejected] = useState(false);

  // Financial state
  const [currBalance, setCurrBalance] = useState(0);
  const [backend_wallet, setBackend_wallet] = useState(0);
  const [paymentOk, setPaymentOk] = useState(0);
  const [total_withdrawal, setTotal_withdrawal] = useState(0);
  const [withdrawalAttempts, setWithdrawalAttempts] = useState(0);
  const [trx_id,setTrxid]=useState(null)
  // Fetch user data (Optimized)
  const fetchUserData = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/getUserData`, {
        withCredentials: true,
      });

      if (response.data.Status === 'Success') {
        const user = response.data.Data;

        setUserData(user);
        setUserid(user.id);
        setNewName(user.name);
        setDp(user.profile_picture);
        setLevel(user.level);
        setTeam(user.team);
        setToday_team(user.today_team);
        setCurrBalance(user.balance);
        setBackend_wallet(user.backend_wallet);
        setPaymentOk(user.payment_ok);
        setApproved(user.approved);
        setIsRejected(user.rejected);
        setTotal_withdrawal(user.total_withdrawal);
        setWithdrawalAttempts(user.withdrawalAttempts);
        setIsAuthenticated(true);
        setTeam_earning(user.team_earning);
        setBonus_earning(user.bonus_earning);
        setLevel_earning(user.level_earning);
        setTrxid(user.trx_id)
        
        // Store authentication status in local storage
        localStorage.setItem('userApproved', user.approved);
        localStorage.setItem('userAuthenticated', true);
      } else {
        console.error('Error:', response.data.Error);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('An error occurred while fetching user data:', error);
      setIsAuthenticated(false);
    } finally {
      setIsAuthCheckComplete(true);
    }
  }, []);

  // Logout function (Optimized)
  const logout = useCallback(async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/logout`, {}, { withCredentials: true });

      if (response.data.Status === 'Success') {
        // Clear user data and reset authentication state
        setUserData(null);
        setUserid(null);
        setNewName('');
        setDp(null);
        setLevel(0);
        setTeam(0);
        setToday_team(0);
        setCurrBalance(0);
        setBackend_wallet(0);
        setPaymentOk(0);
        setApproved(0);
        setIsRejected(false);
        setTotal_withdrawal(0);
        setWithdrawalAttempts(0);
        setIsAuthenticated(false);
        setAdminAuthenticated(false);
        
        // Remove authentication status from local storage
        localStorage.removeItem('userApproved');
        localStorage.removeItem('userAuthenticated');
      } else {
        console.error('Logout failed:', response.data.Error);
      }
    } catch (error) {
      console.error('An error occurred while logging out:', error);
    }
  }, []);

  return (
    <UserContext.Provider value={{
      userData,
      Userid,
      NewName,
      dp,
      level,
      team,
      today_team,
      currBalance,
      backend_wallet,
      paymentOk,
      approved,
      isRejected,
      total_withdrawal,
      withdrawalAttempts,
      isAuthenticated,
      isAuthCheckComplete,
      adminAuthenticated,
      setAdminAuthenticated,
      fetchUserData,
      logout,
      team_earning,
      bonus_earning,
      level_earning,
      trx_id
    }}>
      {children}
    </UserContext.Provider>
  );
};
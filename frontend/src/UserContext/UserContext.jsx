import { createContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { RemoveTrailingZeros } from '../../utils/utils';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [Userid, setUserid] = useState(null);
  const [NewName, setNewName] = useState('');
  const [dp, setDp] = useState(null);
  const [level, setLevel] = useState(0);
  const [team, setTeam] = useState(0);
  const [today_team, setToday_team] = useState(0);
  const [team_earning, setTeam_earning] = useState(0);
  const [bonus_earning, setBonus_earning] = useState(0);
  const [level_earning, setLevel_earning] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [approved, setApproved] = useState(0);
  const [isRejected, setIsRejected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [currBalance, setCurrBalance] = useState(0);
  const [backend_wallet, setBackend_wallet] = useState(0);
  const [paymentOk, setPaymentOk] = useState(0);
  const [total_withdrawal, setTotal_withdrawal] = useState(0);
  const [withdrawalAttempts, setWithdrawalAttempts] = useState(0);
  const [trx_id, setTrxid] = useState(null);

  // Function to fetch notifications globally
  const fetchGlobalNotifications = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      setIsLoadingNotifications(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/${userId}`,
        { withCredentials: true }
      );
      
      if (response.data?.status === 'success') {
        const notifications = response.data.data || [];
        const unread = notifications.filter(n => n.is_read === 0).length;
        setUnreadCount(unread);
      } else if (response.data?.Error) {
        console.error('Error fetching notifications:', response.data.Error);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't throw error here - we don't want to break the app if notifications fail
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  // Function to mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        { withCredentials: true }
      );
      // Update local count immediately (optimistic update)
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Re-fetch notifications to sync with server
      if (Userid) {
        fetchGlobalNotifications(Userid);
      }
    }
  }, [Userid, fetchGlobalNotifications]);

  // Function to mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/${userId}/read-all`,
        {},
        { withCredentials: true }
      );
      // Update local count immediately
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Re-fetch notifications to sync with server
      fetchGlobalNotifications(userId);
    }
  }, [fetchGlobalNotifications]);

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
        setCurrBalance(RemoveTrailingZeros(user.balance));
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
        setTrxid(user.trx_id);
        
        localStorage.setItem('userApproved', user.approved);
        localStorage.setItem('userAuthenticated', true);

        // Fetch notifications after user data is loaded
        if (user.id) {
          fetchGlobalNotifications(user.id);
        }
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
  }, [fetchGlobalNotifications]);

  // Auto-refresh notifications periodically when user is authenticated
  useEffect(() => {
    if (!Userid) return;

    // Initial fetch
    fetchGlobalNotifications(Userid);

    // Set up interval to refresh notifications every 2 minutes
    const interval = setInterval(() => {
      fetchGlobalNotifications(Userid);
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [Userid, fetchGlobalNotifications]);

  const logout = useCallback(async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/logout`, {}, { withCredentials: true });

      if (response.data.Status === 'Success') {
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
        setUnreadCount(0); // Reset notification count on logout
        
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
      setCurrBalance,
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
      trx_id,
      // Notification related values
      unreadCount,
      setUnreadCount,
      isLoadingNotifications,
      fetchGlobalNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead
    }}>
      {children}
    </UserContext.Provider>
  );
};
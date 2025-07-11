import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from './UserContext/UserContext';
import { ToastProvider } from './ToastContext';
import { jwtDecode } from 'jwt-decode';
// User Components
import {Login} from './Login';
import Signup from './Signup';
import Payment from './Payment';
import Waiting from './Waiting';
import About from './About';
import UserProfileUpdate from './UserProfileUpdate';
import DailyTasks from './DailyTasks';
import Wallet from './Wallet';
import Team from './Team';
import WithdrawPage from './new/WithdrawPage';
import LevelsData from './LevelsData';
import AccountDetailsTabs from './new/AccountDetailsTabs';
import ReferralProgram from './ReferralProgram';

// Admin Components
import AdminLogin from './Dashboard/AdminLogin';
import ApprovedUsers from './Dashboard/Users/ApprovedUsers';
import EasyPaisa from './Dashboard/EasyPaisa/EasyPaisa';
import RejectedUsers from './Dashboard/RejectedUser/RejectedUsers';
import TodayApproved from './Dashboard/TodayApproved/TodayApproved';
import WithdrwaReques from './Dashboard/WithdrawRequest/WithdrwaReques';
import ApprovedWithdraw from './Dashboard/ApprovedWithdraw/ApprovedWithdraw';
import Product from './Dashboard/Products/Products';
import Widgets from './Dashboard/Widgets/Widgets';
import PendingUsers from './Dashboard/PendingUsers/PendingUsers';
import { AccountSetting } from './Dashboard/AccountSetting/AccountSetting';
import RejectWithdraw from './Dashboard/RejectWithdraw/RejectWithdraw';
import Level from './Dashboard/Levels/Levels';
import {WithdrawLimits} from './Dashboard/WithdrawLimits/WithdrawLimits';
import Commission from './Dashboard/Commission/Commission';
import Bonus from './Dashboard/BonusSetting/Bonus';
import Bep20Settings from './Dashboard/AdminWallet/AdminWallet';
import Settings from './Dashboard/Setting/InitialSettings';
import SubAdminsManagement from './Dashboard/Subadmin/SubAdmin';
import FindUser from './Dashboard/FindUser/FindUser';
import PushNotificationManager from './Dashboard/SendNotification/SendNotification';
import usePushNotifications from './Dashboard/Hooks/usePushNotifications';

function App() {
  const [isLoading, setIsLoading] = useState(true);  
  const { isRejected, Userid, setAdminAuthenticated, currBalance, approved, adminAuthenticated, isAuthenticated, fetchUserData } = useContext(UserContext);
  usePushNotifications();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        console.log('Service Worker ready:', registration);
      });
    }
  }, []);

  
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setAdminAuthenticated(true);
        } else {
          localStorage.removeItem('adminToken');
        }
      } catch (error) {
        localStorage.removeItem('adminToken');
      }
    }
    if (localStorage.getItem('adminAuth')) {
      localStorage.removeItem('adminAuth');
    }
    fetchUserData().finally(() => setIsLoading(false)); 
  }, []); 

  if (isLoading) { 
    return (
      <div className="loading-container">
        <div className="loader-bar"></div>
      </div>
    );
  }
  
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin Routes - Protected by JWT */}
          <Route path='/users' element={adminAuthenticated ? <ApprovedUsers /> : <AdminLogin />} />
          <Route path='/easypaisa' element={adminAuthenticated ? <EasyPaisa /> : <AdminLogin />} />
          <Route path='/rejecteduser' element={adminAuthenticated ? <RejectedUsers /> : <AdminLogin />} />
          <Route path='/todayApproved' element={adminAuthenticated ? <TodayApproved /> : <AdminLogin />} />
          <Route path='/withdrwa' element={adminAuthenticated ? <WithdrwaReques /> : <AdminLogin />} />
          <Route path='/ApprovedWithdrwa' element={adminAuthenticated ? <ApprovedWithdraw /> : <AdminLogin />} />
          <Route path='/products' element={adminAuthenticated ? <Product /> : <AdminLogin />} />
          <Route path='/adminpanel' element={adminAuthenticated ? <Widgets /> : <AdminLogin />} />
          <Route path='/pending' element={adminAuthenticated ? <PendingUsers /> : <AdminLogin />} />
          <Route path='/accountsetting' element={adminAuthenticated ? <AccountSetting /> : <AdminLogin />} />
          <Route path='/rejectwithdrwa' element={adminAuthenticated ? <RejectWithdraw /> : <AdminLogin />} />
          <Route path='/levels' element={adminAuthenticated ? <Level /> : <AdminLogin />} />
          <Route path='/commission' element={adminAuthenticated ? <Commission /> : <AdminLogin />} />
          <Route path='/withdrawalLimits' element={adminAuthenticated ? <WithdrawLimits /> : <AdminLogin />} />
          <Route path='/bonussettingforusers' element={adminAuthenticated ? <Bonus /> : <AdminLogin />} />
          <Route path='/accounts' element={adminAuthenticated ? <Bep20Settings /> : <AdminLogin />} />
          <Route path='/initialSettings' element={adminAuthenticated ? <Settings /> : <AdminLogin />} />
          <Route path='/SubAdminsManagement' element={adminAuthenticated ? <SubAdminsManagement /> : <AdminLogin />} />
          <Route path='/finduser' element={adminAuthenticated ? <FindUser /> : <AdminLogin />} />
          <Route path='/sendNotification' element={adminAuthenticated ? <PushNotificationManager /> : <AdminLogin />} />

          {/* User Routes */}
          <Route path='/' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/Payment' element={<Payment Userid={Userid} isRejected={isRejected} />} />
          <Route path='/waiting' element={isAuthenticated ? <Waiting /> : <Login />} />
          <Route path='/cashout' element={approved === 1 && isAuthenticated ? <WithdrawPage /> : <Login />} />
          <Route path='/ReferralProgram' element={approved === 1 && isAuthenticated ? <ReferralProgram /> : <Login />} />
          <Route path='/Bank-And-Crypto' element={approved === 1 && isAuthenticated ? <AccountDetailsTabs /> : <Login />} />
          <Route path="/wallet-page" element={approved === 1 && isAuthenticated ? <About /> : <Login />} />
          <Route path="/setting" element={approved === 1 && isAuthenticated ? <UserProfileUpdate /> : <Login />} />
          <Route path="/tasks" element={approved === 1 && isAuthenticated ? <DailyTasks Userid={Userid} currBalance={currBalance} /> : <Login />} />
          <Route path="/wallet" element={approved === 1 && isAuthenticated ? <Wallet /> : <Login />} />
          <Route path='/team' element={approved === 1 && isAuthenticated ? <Team /> : <Login />} />
          <Route path='/collect' element={approved === 1 && isAuthenticated ? <LevelsData /> : <Login />} />
        </Routes>
      </BrowserRouter>
     
    </ToastProvider>
  );
}

export default App;
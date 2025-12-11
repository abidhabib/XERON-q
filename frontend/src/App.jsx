import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
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
import SalaryCollection from './new/WeekSalary';
import Notifications from './new/Notifications';
import MonthlyLevelsManager from './Dashboard/MonthlyLevelsManager./MonthlyLevelsManager';
import MonthlySalaryDashboard from './new/MonthlySalary';
import ProfileCard from './new/ProfileCard';
import AdminProfileManager from './Dashboard/AdminCard/AdminProfileManager';
import AdminLayout from './Dashboard/AdminLayout';
import { SidebarProvider } from './Dashboard/SidebarContext';

function App() {
  const [isLoading, setIsLoading] = useState(true);  
  const { isRejected, Userid, setAdminAuthenticated, currBalance, approved, adminAuthenticated, isAuthenticated, fetchUserData } = useContext(UserContext);
  // ❌ REMOVED: const Navigate = useContext(UserContext);

  useEffect(() => {
    const registerServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) {
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/service-worker.js");

        // --- Detailed State Monitoring ---
        const sw = registration.installing || registration.waiting || registration.active;
        if (sw) {
            sw.addEventListener('statechange', (e) => {
                if (e.target.state === 'activated') {
                    console.log("🔔 [APP DEBUG] Service Worker is now activated!");}
            });
        }

        // --- Check navigator.serviceWorker.ready ---
        const readyRegistration = await navigator.serviceWorker.ready;
        console.log('✅ [APP DEBUG] navigator.serviceWorker.ready RESOLVED!', { scope: readyRegistration.scope });

      } catch (error) {
        // Provide specific hints based on common errors
        if (error.message && error.message.includes('404')) {
            console.error("   -> This usually means '/service-worker.js' was not found on the server. Check if it's deployed correctly and accessible at https://checking.run.place/service-worker.js  ");
        }
      }
    };

    registerServiceWorker();
  }, []); // Empty dependency array: run once on mount

  usePushNotifications();

  
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
              <SidebarProvider> 

        <Routes>

{/* Admin Auth Routes */}

<Route path="/admin/login" element={<AdminLogin />} />

<Route path="/adminpanel" element={
  adminAuthenticated ? <AdminLayout><Widgets /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/users" element={
  adminAuthenticated ? <AdminLayout><ApprovedUsers /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/easypaisa" element={
  adminAuthenticated ? <AdminLayout><EasyPaisa /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/rejecteduser" element={
  adminAuthenticated ? <AdminLayout><RejectedUsers /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/todayApproved" element={
  adminAuthenticated ? <AdminLayout><TodayApproved /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/withdrwa" element={
  adminAuthenticated ? <AdminLayout><WithdrwaReques /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/ApprovedWithdrwa" element={
  adminAuthenticated ? <AdminLayout><ApprovedWithdraw /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/products" element={
  adminAuthenticated ? <AdminLayout><Product /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/pending" element={
  adminAuthenticated ? <AdminLayout><PendingUsers /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/accountsetting" element={
  adminAuthenticated ? <AdminLayout><AccountSetting /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/rejectwithdrwa" element={
  adminAuthenticated ? <AdminLayout><RejectWithdraw /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/w_salary" element={
  adminAuthenticated ? <AdminLayout><Level /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/commission" element={
  adminAuthenticated ? <AdminLayout><Commission /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/withdrawalLimits" element={
  adminAuthenticated ? <AdminLayout><WithdrawLimits /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/bonussettingforusers" element={
  adminAuthenticated ? <AdminLayout><Bonus /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/accounts" element={
  adminAuthenticated ? <AdminLayout><Bep20Settings /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/initialSettings" element={
  adminAuthenticated ? <AdminLayout><Settings /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/SubAdminsManagement" element={
  adminAuthenticated ? <AdminLayout><SubAdminsManagement /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/finduser" element={
  adminAuthenticated ? <AdminLayout><FindUser /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/sendNotification" element={
  adminAuthenticated ? <AdminLayout><PushNotificationManager /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/monthlyLevels" element={
  adminAuthenticated ? <AdminLayout><MonthlyLevelsManager /></AdminLayout> : <Navigate to="/admin/login" replace />
} />
<Route path="/admin-profile-manager" element={
  adminAuthenticated ? <AdminLayout><AdminProfileManager /></AdminLayout> : <Navigate to="/admin/login" replace />
} />

          {/* User Routes - Protected by JWT */}
          <Route path='/' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/Payment' element={<Payment Userid={Userid} isRejected={isRejected} />} />
          <Route path='/waiting' element={isAuthenticated ? <Waiting /> : <Login />} />
          <Route path='/cashout' element={approved === 1 && isAuthenticated ? <WithdrawPage /> : <Login />} />
          <Route path='/ReferralProgram' element={approved === 1 && isAuthenticated ? <ReferralProgram /> : <Login />} />
          <Route path='/UserWalletSettings' element={approved === 1 && isAuthenticated ? <AccountDetailsTabs /> : <Login />} />
          <Route path="/wallet-page" element={approved === 1 && isAuthenticated ? <About /> : <Login />} />
          <Route path="/setting" element={approved === 1 && isAuthenticated ? <UserProfileUpdate /> : <Login />} />
          <Route path="/tasks" element={approved === 1 && isAuthenticated ? <DailyTasks Userid={Userid} currBalance={currBalance} /> : <Login />} />
          <Route path="/wallet" element={approved === 1 && isAuthenticated ? <Wallet /> : <Login />} />
          <Route path='/team' element={approved === 1 && isAuthenticated ? <Team /> : <Login />} />
          <Route path='/week-salary' element={approved === 1 && isAuthenticated ? <SalaryCollection /> : <Login />} />
          <Route path='/alerts' element={approved === 1 && isAuthenticated ? <Notifications /> : <Login />} />
          <Route path='/SalaryofMonth' element={approved === 1 && isAuthenticated ? <MonthlySalaryDashboard /> : <Login />} />
          <Route path='/admin-profile/:token' element={approved === 1 && isAuthenticated ? <ProfileCard /> : <Login />} />

        </Routes>
                       </SidebarProvider>

      </BrowserRouter>
     
    </ToastProvider>
  );
}

export default App;
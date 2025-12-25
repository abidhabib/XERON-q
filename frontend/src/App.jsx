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
import MonthlySalaryDashboard from './new/MonthlySalary';
import ProfileCard from './new/ProfileCard';
import AdminProfileManager from './Dashboard/AdminCard/AdminProfileManager';
import AdminLayout from './Dashboard/AdminLayout';
import { SidebarProvider } from './Dashboard/SidebarContext';

// Import UserLayout
import UserLayout from './UserLayout';
import MiningHistory from './MiningHistory';
import SalaryHistory from './SalaryHistory';
import MonthlySalaryAdmin from './Dashboard/MonthlySalaryAdmin/MonthlySalaryAdmin';

function App() {
  const [isLoading, setIsLoading] = useState(true);  
  const { isRejected, Userid, setAdminAuthenticated, currBalance, approved, adminAuthenticated, isAuthenticated, fetchUserData } = useContext(UserContext);

  useEffect(() => {
    const registerServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) {
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/service-worker.js");

        const sw = registration.installing || registration.waiting || registration.active;
        if (sw) {
            sw.addEventListener('statechange', (e) => {
                if (e.target.state === 'activated') {
                    console.log("🔔 [APP DEBUG] Service Worker is now activated!");}
            });
        }

        const readyRegistration = await navigator.serviceWorker.ready;
        console.log('✅ [APP DEBUG] navigator.serviceWorker.ready RESOLVED!', { scope: readyRegistration.scope });

      } catch (error) {
        if (error.message && error.message.includes('404')) {
            console.error(" ❌ [APP ERROR] Service Worker registration failed: service-worker.js not found (404). Ensure the file exists at the root of your public directory.");
        }
      }
    };

    registerServiceWorker();
  }, []);

  usePushNotifications();

  
  useEffect(() => {
    const token = localStorage.getItem('adminTokens');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setAdminAuthenticated(true);
        } else {
          localStorage.removeItem('adminTokens');
        }
      } catch (error) {
        localStorage.removeItem('adminTokens');
      }
    }
    if (localStorage.getItem('adminsAuth')) {
      localStorage.removeItem('adminsAuth');
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

            <Route path="/admin" element={
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
            <Route path="/admin/monthly-salary" element={
              adminAuthenticated ? <AdminLayout><MonthlySalaryAdmin /></AdminLayout> : <Navigate to="/admin/login" replace />
            } />
            <Route path="/admin-profile-manager" element={
              adminAuthenticated ? <AdminLayout><AdminProfileManager /></AdminLayout> : <Navigate to="/admin/login" replace />
            } />

            {/* Public Routes */}
            <Route path='/' element={<Login />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/Payment' element={<Payment Userid={Userid} isRejected={isRejected} />} />

            {/* Protected User Routes with Navbar */}
            <Route element={isAuthenticated ? <UserLayout /> : <Navigate to="/" replace />}>
              <Route path='/waiting' element={<Waiting />} />
              <Route path='/cashout' element={approved === 1 ? <WithdrawPage /> : <Navigate to="/work" replace />} />
              <Route path='/ReferralProgram' element={approved === 1 ? <ReferralProgram /> : <Navigate to="/work" replace />} />
              <Route path='/UserWalletSettings' element={approved === 1 ? <AccountDetailsTabs /> : <Navigate to="/work" replace />} />
              <Route path="/wallet-page" element={approved === 1 ? <About /> : <Navigate to="/work" replace />} />
              <Route path="/setting" element={approved === 1 ? <UserProfileUpdate /> : <Navigate to="/work" replace />} />
              <Route path="/work" element={approved === 1 ? <DailyTasks Userid={Userid} currBalance={currBalance} /> : <Navigate to="/" replace />} />
              <Route path="/wallet" element={approved === 1 ? <Wallet /> : <Navigate to="/work" replace />} />
              <Route path='/team' element={approved === 1 ? <Team /> : <Navigate to="/work" replace />} />
              <Route path='/alerts' element={approved === 1 ? <Notifications /> : <Navigate to="/work" replace />} />
              <Route path='/SalaryofMonth' element={approved === 1 ? <MonthlySalaryDashboard /> : <Navigate to="/work" replace />} />
              <Route path='/admin-profile/:token' element={approved === 1 ? <ProfileCard /> : <Navigate to="/work" replace />} />
              <Route path='/mining-history' element={approved === 1 ? <MiningHistory /> : <Navigate to="/work" replace />} />
{/* -----------------------New */}
        <Route path="/salary-history" element={<SalaryHistory />} />
              <Route path='/week-salary' element={approved === 1 ? <SalaryCollection /> : <Navigate to="/work" replace />} />


                  

            </Route>

          </Routes>
        </SidebarProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
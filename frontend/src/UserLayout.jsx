import { matchPath, Outlet, useLocation } from 'react-router-dom';
import NavBar from './NavBar'; // Import your navbar component

const UserLayout = () => {
  const location = useLocation();
  const hasPageHeader = ['/wallet-page', '/wallet', '/work', '/team', '/alerts', '/cashout', '/ReferralProgram', '/SalaryofMonth', '/salaryofMonth', '/contact-us', '/setting', '/UserWalletSettings'].some(path => matchPath({ path, end: true }, location.pathname));

  return (
    <div className="min-h-screen bg-gray-50">
      {!hasPageHeader && <div className="sticky top-0 left-0 right-0 z-50"><NavBar /></div>}
      
      {/* Main content area */}
      <main className=""> {/* Adjust pt based on your navbar height */}
        <Outlet /> {/* This renders the child route components */}
      </main>
    </div>
  );
};

export default UserLayout;

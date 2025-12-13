
import React from 'react'
import { useContext } from 'react';
import { UserContext } from '../UserContext/UserContext';
import { 
  FiHome, 
  FiMail, 
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { AiOutlineVerified } from 'react-icons/ai';
import { RiNotificationBadgeFill } from 'react-icons/ri';
import { Wallet } from 'lucide-react';
function BalanceCard() {

      const { NewName, currBalance, backend_wallet } = useContext(UserContext);
      const menuItems = [
    { 
      name: "Wallet", 
      link: "/wallet", 
      icon: <Wallet className="w-5 h-5" />,
      label: "Dashboard Home"
    },
    { 
      name: "Alerts", 
      link: "/alerts", 
      icon: <RiNotificationBadgeFill iconClass="w-5 h-5" />,
      label: "View Notifications"
    },
    { 
      name: "Contact", 
      link: "/contact", 
      icon: <FiMail className="w-5 h-5" />,
      label: "Contact Support"
    },
    { 
      name: "Team", 
      link: "/team", 
      icon: <FiUsers className="w-5 h-5" />,
      label: "View Team"
    }
  ];

  // Calculate progress (backend_wallet / 3)
  const progress = backend_wallet ? Math.min(Math.round((backend_wallet / 3) * 100), 100) : 0;

  // Format currency properly
  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  return (

<>

  <div className="py-6 bg-[#19202a] rounded-b-2xl">
          <div className="flex items-center px-4 mb-4 mt-2">
            <p className="text-white uppercase flex items-center text-lg font-medium">
              {NewName || 'User'} 
              <span className="text-green-500 ml-1">
                <AiOutlineVerified className="w-5 h-5" />
              </span>
            </p>
          </div>

          <div className="flex justify-between items-center px-4 mb-6">
            <p className="text-white text-2xl font-bold">
              ${formatCurrency(currBalance)}
            </p>
            <div className="px-3 py-1.5 font-bold text-green-400 bg-transparent border border-green-400 rounded-full text-xs">
              Progress {progress}%
            </div>
          </div>

          <div className="px-4 pb-2">
            <div className="grid grid-cols-4 gap-2">
              {menuItems.map((item, index) => (
                <Link 
                  key={index}
                  to={item.link} 
                  className="flex flex-col items-center p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label={item.label}
                >
                  <div className="border border-white/20 rounded-full p-2.5 mb-1 flex items-center justify-center bg-white/5">
                    {item.icon}
                  </div>
                  <span className="text-xs text-center mt-1">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

</>

)
}

export default BalanceCard
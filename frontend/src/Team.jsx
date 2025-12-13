import React, { useContext, useState, useEffect } from 'react';
import { MdOutlineWhatsapp } from "react-icons/md";
import { FiHome, FiMail, FiUsers } from "react-icons/fi";
import { AiOutlineVerified } from "react-icons/ai";
import { UserContext } from './UserContext/UserContext';
import NavBAr from './NavBAr';
import NotificationBell from './NotificationBell';
import { useNavigate } from 'react-router-dom';
import BalanceCard from './new/BalanceCard';

const Team = () => {
  const { Userid, NewName, currBalance, backend_wallet } = useContext(UserContext);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const menuItems = [
    { 
      name: "Home", 
      link: "/wallet-page", 
      icon: <FiHome className="w-5 h-5" />,
      label: "Dashboard Home"
    },
    { 
      name: "Alerts", 
      link: "/alerts", 
      icon: <NotificationBell iconClass="w-5 h-5" />,
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

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/approvedUserNames/${Userid}`);
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data.users);
          setLoading(false);
        } else {
          throw new Error('No Miners');
        }
      } catch (error) {
        console.error('Error fetching Miners:', error);
      }
    };

    if (Userid) {
      fetchTeamMembers();
    }
  }, [Userid]);

  // Format date to readable format
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavBAr />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 pt-16">
        {/* Mini Dashboard */}
      <BalanceCard/>
        {/* Team Content */}
        <div className="px-4 py-6 flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Team</h1>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">Manage your team members</p>
              {teamMembers.length > 0 && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {teamMembers.length} Members
                </span>
              )}
            </div>
          </div>

          {loading && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-700 font-medium">Loading Team...</p>
              </div>
            </div>
          )}

          {teamMembers.length > 0 ? (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div 
                  key={member.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium text-lg">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        {/* Member Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {member.name}
                          </h3>
                          
                          {/* Progress Bar */}
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500">Progress</span>
                              <span className="text-xs font-medium text-gray-700">
                                {parseFloat(member.backend_wallet).toFixed(0)}%
                              </span>
                            </div>
                            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="absolute h-full bg-gradient-to-r from-green-400 to-cyan-400 rounded-full"
                                style={{ width: `${Math.min(parseFloat(member.backend_wallet) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp Button */}
                      <button
                        className="p-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors flex-shrink-0 ml-2"
                        onClick={() => window.open(`https://wa.me/${member.phoneNumber}`, '_blank')}
                      >
                        <MdOutlineWhatsapp className="w-5 h-5 text-green-600" />
                      </button>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-around gap-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-2">
                          <FiUsers className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Team Size</p>
                          <p className="text-sm font-medium text-gray-900">{member.team || 0} members</p>
                        </div>
                      </div>
                      
                     
                      <div className="flex items-center col-span-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mr-2">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Joined</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(member.approved_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading && (
            <div className="text-center py-12">
              <div className="max-w-xs mx-auto">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Members</h3>
                <p className="text-gray-500">Start building your team by inviting new members.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Team;
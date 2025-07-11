import React, { useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdOutlineWhatsapp } from "react-icons/md";
import { UserContext } from './UserContext/UserContext';
import NavBAr from './NavBAr';
import './team.css';


const Team = () => {
  const { Userid } = useContext(UserContext);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBAr />
      
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
              <motion.div
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              <p className="mt-4 text-gray-700 font-medium">Loading Team...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-2 py-3">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className=" text-gray-900 flex items-center font-bold">
            {teamMembers.length > 0 && (
              <span className="w-full ml-3 px-3 py-1 bg-blue-100 text-blue-600 rounded-md text-center text-sm">
           Total     <span className=''>{teamMembers.length}</span> members
              </span>
            )}
          </h1>
        </motion.div>

        {teamMembers.length > 0 ? (
          <div className="grid gap-4">
            {teamMembers.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                        {member.name[0]}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {member.name.length > 21 
                          ? `${member.name.substring(0, 18)}...` 
                          : member.name}
                      </h3>
                      <div className="mt-1 flex items-center space-x-2">
                        <div className="relative w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="absolute h-full bg-gradient-to-r from-green-400 to-cyan-400"
                            style={{ width: `${parseFloat(member.backend_wallet).toFixed(0)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">
                          {parseFloat(member.backend_wallet).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                    onClick={() => window.open(`https://wa.me/${member.phoneNumber}`, '_blank')}
                  >
                    <MdOutlineWhatsapp className="w-6 h-6 text-green-600" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="max-w-xs mx-auto">
              <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Miners Available</h3>
              <p className="text-gray-500">Start building your team by inviting new members.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Team;
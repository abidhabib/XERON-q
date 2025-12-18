import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from './UserContext/UserContext';
import BalanceCard from './new/BalanceCard';

// Lucide-style icons (clean, consistent)
import { Users, Calendar,  } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';

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
        setLoading(false);
      }
    };

    if (Userid) {
      fetchTeamMembers();
    }
  }, [Userid]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#111827]">
    

      <BalanceCard />

      {/* Team Content */}
      <div className="px-4 pt-6 pb-8 flex-1">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white mb-2">My Team</h1>
          <div className="flex items-center justify-between">
            <p className="text-[#D4AF37]/70 text-sm">Manage your team members</p>
            {teamMembers.length > 0 && (
              <span className="px-3 py-1 bg-[#19202a] text-[#D4AF37] rounded-full text-xs font-medium">
                {teamMembers.length} Members
              </span>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-[#19202a] p-5 rounded-2xl flex flex-col items-center">
              <div className="w-8 h-8 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-[#D4AF37] text-sm font-medium">Loading Team...</p>
            </div>
          </div>
        )}

        {/* Team List */}
        {teamMembers.length > 0 ? (
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-[#19202a] rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium text-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">
                        {member.name}
                      </h3>

                      {/* Progress */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-[#D4AF37]/70">Progress</span>
                          <span className="text-[11px] font-medium text-[#D4AF37]">
                            {Math.min(parseFloat(member.backend_wallet || 0) * 100, 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#26303b] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-cyan-300 rounded-full"
                            style={{ width: `${Math.min(parseFloat(member.backend_wallet || 0) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <button
                    className="p-2 rounded-lg bg-[#1c2a22] hover:bg-[#1f3228] transition-colors flex-shrink-0"
                    onClick={() => window.open(`https://wa.me/${member.phoneNumber}`, '_blank')}
                    aria-label="Message on WhatsApp"
                  >
                    <SiWhatsapp className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>

                {/* Stats */}
                <div className="mt-4 pt-3 border-t border-[#26303b] flex gap-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-[#1c2a3a] flex items-center justify-center mr-2">
                      <Users className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-[11px] text-[#D4AF37]/70">Team Size</p>
                      <p className="text-sm text-white font-medium">{member.team || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-[#1c2836] flex items-center justify-center mr-2">
                      <Calendar className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-[11px] text-[#D4AF37]/70">Joined</p>
                      <p className="text-sm text-white font-medium">{formatDate(member.approved_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto bg-[#1c2a3a] rounded-full flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-[#D4AF37]/50" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No Team Members</h3>
            <p className="text-[#D4AF37]/70 text-sm max-w-[240px] mx-auto">
              Start building your team by inviting new members.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Team;
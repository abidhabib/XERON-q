import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from './UserContext/UserContext';
import BalanceCard from './new/BalanceCard';
import { Users, Calendar } from 'lucide-react';
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
          setTeamMembers(data.users || []);
        }
      } catch (error) {
        console.error('Error fetching team:', error);
      } finally {
        setLoading(false);
      }
    };

    if (Userid) fetchTeamMembers();
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

      <div className="px-3 pt-4 pb-6 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-white">My Team</h1>
            <p className="text-[#D4AF37]/60 text-xs mt-0.5">Approved members</p>
          </div>
          {teamMembers.length > 0 && (
            <span className="px-2.5 py-1 bg-[#1c2a3a] text-[#D4AF37] rounded-full text-[11px] font-medium">
              {teamMembers.length} Members
            </span>
          )}
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-[#19202a] p-4 rounded-xl flex flex-col items-center">
              <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-[#D4AF37] text-sm">Loading...</p>
            </div>
          </div>
        )}

        {/* Team List */}
        {teamMembers.length > 0 ? (
          <div className="space-y-2.5">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-[#19202a] rounded-xl p-3.5"
              >
                {/* Name + WhatsApp */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white text-sm truncate">
                    {member.name}
                  </h3>
                  <button
                    onClick={() => window.open(`https://wa.me/${member.phoneNumber}`, '_blank')}
                    className="p-1.5 rounded-lg bg-[#1c2a3a] hover:bg-[#202e3a] transition-colors"
                    aria-label={`Message ${member.name} on WhatsApp`}
                  >
                    <SiWhatsapp className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-2.5">
                  <div className="flex justify-between text-[10px] text-[#D4AF37]/70 mb-1">
                    <span>Progress</span>
                    <span>
                      {Math.min(parseFloat(member.backend_wallet || 0) * 100, 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1 bg-[#1c2a3a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-400 rounded-full"
                      style={{ width: `${Math.min(parseFloat(member.backend_wallet || 0) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#D4AF37]/70" />
                    <span className="text-white font-medium">{member.team || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#D4AF37]/70">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(member.approved_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 mx-auto bg-[#1c2a3a] rounded-full flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-[#D4AF37]/50" />
            </div>
            <h3 className="text-white font-medium text-sm mb-1">No Team Members</h3>
            <p className="text-[#D4AF37]/60 text-xs px-4">
              Invite users to grow your team.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Team;
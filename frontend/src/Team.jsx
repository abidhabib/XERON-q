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
    <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
      <BalanceCard />

      <div className="px-4 pt-4 pb-6 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-base font-semibold text-[#1e2329]">My Team</h1>
            <p className="text-xs text-[#848e9c] mt-0.5">Approved members</p>
          </div>
          {teamMembers.length > 0 && (
            <span className="px-2.5 py-1 text-[11px] font-medium text-[#f0b90b] bg-[#f0b90b]/10 rounded-full">
              {teamMembers.length} Members
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white p-5 rounded-xl flex flex-col items-center shadow-xl">
              <div className="w-6 h-6 border-2 border-[#f0f0f0] border-t-[#f0b90b] rounded-full animate-spin" />
              <p className="mt-2.5 text-sm text-[#848e9c]">Loading...</p>
            </div>
          </div>
        )}

        {/* Team List */}
        {teamMembers.length > 0 ? (
          <div className="space-y-2.5">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-white rounded-xl p-3.5 shadow-sm">
                {/* Name + WhatsApp */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm text-[#1e2329] truncate max-w-[200px]">
                    {member.name}
                  </h3>
                  <button
                    onClick={() => window.open(`https://wa.me/${member.phoneNumber}`, '_blank')}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    aria-label={`Message ${member.name} on WhatsApp`}
                  >
                    <SiWhatsapp className="w-4 h-4 text-emerald-500" />
                  </button>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] text-[#848e9c] mb-1.5">
                    <span>Progress</span>
                    <span>{Math.min(parseFloat(member.backend_wallet || 0) * 100, 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1 bg-[#f5f5f5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f0b90b] rounded-full"
                      style={{ width: `${Math.min(parseFloat(member.backend_wallet || 0) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#848e9c]">
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-semibold text-[#1e2329]">{member.team || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#848e9c]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(member.approved_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 mx-auto bg-[#fafafa] rounded-full flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-[#c1c7cd]" />
            </div>
            <h3 className="text-sm font-medium text-[#1e2329] mb-1">No Team Members</h3>
            <p className="text-xs text-[#848e9c] px-8">
              Invite users to grow your team.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Team;
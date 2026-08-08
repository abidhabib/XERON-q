import { Copy, Check, Link2 } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../UserContext/UserContext";

const InviteCard = () => {
  const { Userid } = useContext(UserContext);

  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (Userid) {
      setInviteLink(`https://webthree.run.place/signup?ref=${Userid}`);
    }
  }, [Userid]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="rise mt-4 rounded-xl bg-[#1E1E22] ring-1 ring-white/[0.04] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="fi text-[11px] font-medium text-[#6F6F76]">
            Referral link
          </p>

          <p className="fi text-[13px] text-[#EDEDEE] mt-1">
            Invite friends and earn rewards.
          </p>
        </div>

        <div className="w-10 h-10 rounded-xl bg-[#212125] flex items-center justify-center">
          <Link2 size={18} className="text-[#C6A15B]" />
        </div>
      </div>

      <div className="mt-4 h-11 rounded-lg bg-[#18181B] ring-1 ring-white/[0.05] px-3 flex items-center overflow-hidden">
        <p className="truncate fi text-[12px] text-[#A0A0A6]">
          {inviteLink}
        </p>
      </div>

      <button
        onClick={copyLink}
        className={`mt-3 w-full h-11 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 fi text-[13px] font-semibold ${
          copied
            ? "bg-[#1F2B22] text-[#8FC7A0]"
            : "bg-[#C6A15B] text-[#161618] hover:bg-[#D5B675]"
        }`}
      >
        {copied ? (
          <>
            <Check size={16} />
            Copied
          </>
        ) : (
          <>
            <Copy size={15} />
            Copy Invite Link
          </>
        )}
      </button>
    </div>
  );
};


export default InviteCard;
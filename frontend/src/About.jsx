import NavBAr from "./NavBAr";
import BalanceCard from "./new/BalanceCard";

const About = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#111827]">
      <NavBAr />

      {/* BalanceCard — no extra wrapper needed */}
      <BalanceCard />

      {/* Content Sections — clean, padded, consistent */}
      <div className="px-4 pb-6 space-y-6 flex-1">
        <div className="mt-4 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-white mb-2">Activity</h2>
            <p className="text-gray-400 text-sm">
              Track your transactions, interactions, and progress.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">Rewards</h2>
            <p className="text-gray-400 text-sm">
              Earn benefits based on your activities and contributions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">About</h2>
            <p className="text-gray-400 text-sm">
              Secure platform for managing your financial progress.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
import NavBar from "./NavBar";
import BalanceCard from "./new/BalanceCard";

const About = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f5]">
      <NavBar />

      <BalanceCard />

      <div className="px-3 pb-6 space-y-4 flex-1 mt-3">
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-base font-semibold text-[#1e2329] mb-1.5">Activity</h2>
          <p className="text-sm text-[#848e9c] leading-relaxed">
            Track your transactions, interactions, and progress.
          </p>
        </section>

        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-base font-semibold text-[#1e2329] mb-1.5">Rewards</h2>
          <p className="text-sm text-[#848e9c] leading-relaxed">
            Earn benefits based on your activities and contributions.
          </p>
        </section>

        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-base font-semibold text-[#1e2329] mb-1.5">About</h2>
          <p className="text-sm text-[#848e9c] leading-relaxed">
            Secure platform for managing your financial progress.
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;
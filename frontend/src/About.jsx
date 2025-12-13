import NavBAr from "./NavBAr";
import BalanceCard from "./new/BalanceCard";


const About = () => {
  

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavBAr />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 pt-16">
        {/* Mini Dashboard - EXACT SAME HEIGHT AS REFERRAL PROGRAM */}
      <BalanceCard />

        {/* Content Sections */}
        <div className="px-4 mt-6 space-y-6 pb-6 flex-1">
          <section>
            <h2 className="text-xl font-bold mb-2">Activity</h2>
            <p className="text-gray-400 text-sm">
              Track your transactions, interactions, and progress.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">Rewards</h2>
            <p className="text-gray-400 text-sm">
              Earn benefits based on your activities and contributions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">About</h2>
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
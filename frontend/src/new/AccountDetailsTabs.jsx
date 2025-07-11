import NavBAr from '../NavBAr';
import OthersCountry from './OthersCountry';

const AccountDetailsTabs = () => {
  return (
    <>

        <NavBAr />
        
        <main className="py- md:py-6 lg:py-20">
     

          <div className="max-w-4xl mx-auto bg-white/5 rounded-xl transition-opacity duration-300">
            <div className="p-2 sm:p-8 md:p-10">
           
              <OthersCountry />
            </div>
          </div>
        </main>
    </>
  );
};

export default AccountDetailsTabs;

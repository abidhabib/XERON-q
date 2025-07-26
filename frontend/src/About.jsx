import { AiOutlineVerified } from "react-icons/ai";
import NavBAr from "./NavBAr";
import { 
  FiHome, 
  FiMail, 
  FiUsers,
} from "react-icons/fi";
import { UserContext } from "./UserContext/UserContext";
import { useContext } from "react";
import { Link } from "react-router-dom";
import NotificationBell from "./NotificationBell";

const About = () => {
  const { NewName } = useContext(UserContext);
  const menuItems = [
    { 
      name: "Home", 
      link: "/wallet", 
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

  return (
    <>
      <div className="logo-m">
        <NavBAr />
      </div>

      <div className="wallet-card1 py-6 card-1">
        <div className="flex items-center px-4 mb-4">
          <p className="text-white uppercase flex items-center">
            {NewName} 
            <span className="text-success ml-1">
              <AiOutlineVerified className="w-5 h-5" />
            </span>
          </p>
        </div>

        <div className="flex justify-between items-center px-4 mb-6">
          <p className="text-white text-lg">USD 321.12</p>
          <div className="px-4 py-2 font-bold text-white bg-transparent border border-success rounded-full">
            Progress 87%
          </div>
        </div>

        <div className="px-4">
          <div className="flex justify-between space-x-1">
            {menuItems.map((item, index) => (
              <Link 
                key={index}
                to={item.link} 
                className="flex flex-col items-center p-2 text-white hover:bg-white/10 rounded-lg transition-colors w-full"
                aria-label={item.label}
              >
                <div className="border border-white/20 rounded-full p-3 mb-1 flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="text-sm text-center">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="content px-4 mt-6 space-y-6">
        <section>
          <h2 className="text-xl font-bold text-gray mb-2">Activity</h2>
          <p className="text-white/180">
            Track your transactions, interactions, and progress.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray mb-2">Rewards</h2>
          <p className="text-white/110">
            Earn benefits based on your activities and contributions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray mb-2">About</h2>
          <p className="text-white/180">
            Secure platform for managing your financial progress.
          </p>
        </section>
      </div>
    </>
  );
};

export default About;
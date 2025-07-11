import { AiOutlineVerified } from "react-icons/ai";
import NavBAr from "./NavBAr";
import { 
  FiHome, 
  FiInfo, 
  FiMail, 
  FiUsers,

} from "react-icons/fi";
import { UserContext } from "./UserContext/UserContext";
import { useContext } from "react";
import { Link } from "react-router-dom";

const About = () => {
  const {NewName}=useContext(UserContext)
  const menuItems = [
    { name: "Home", link: "/wallet", icon: <FiHome className="w-5 h-5"/> },
    { name: "About", link: "/about", icon: <FiInfo className="w-5 h-5"/> },
    { name: "Contact", link: "/contact", icon: <FiMail className="w-5 h-5"/> },
    { name: "Team", link: "/team", icon: <FiUsers className="w-5 h-5"/> }
  ];

  return (
    <>
      <div className="logo-m">
        <NavBAr />
      </div>

      <div className="wallet-card1 py-6 card-1">
        <p className="text-white d-flex px-2 uppercase">
          {NewName} <span className="text-success"><AiOutlineVerified /></span>
        </p>

        <div className="d-flex justify-content-between px-2 mb-2">
          <p className="text-white">USD 321.12</p>
          <div className="progress p-3 text-bold flex align-items-center text-white mt-3 justify-content-center bg-transparent border border-success rounded-pill">
            Progress 87%
          </div>
        </div>

        <div className="menuItems text-white mt-1">
  {menuItems.map((item, index) => (
    <Link to={item.link} key={index} className="menuItem-imgs flex items-center gap-2">
      <span className="border rounded-full p-2">{item.icon}</span>
      <label className="text-3xl cursor-pointer">{item.name}</label>
    </Link>
  ))}
</div>
      </div>

      {/* New Sections */}
      <div className="content px-3  mt-4">
        <h2 className="text-2xl font-bold">Activity</h2>
        <p>
          This section covers all user activities, including transactions, interactions, and progress.
          Stay updated with your latest achievements and earnings.
        </p>

        <h2 className="text-2xl font-bold  mt-4">Rewards</h2>
        <p>
          Earn rewards based on your activities and contributions. The more active you are, the better
          the benefits you receive. Stay engaged to maximize your rewards.
        </p>

        <h2 className="text-2xl font-bold mt-4">About</h2>
        <p>
          Our platform is designed to empower users by providing a seamless experience in earning, managing, 
          and tracking their financial progress. We prioritize security, transparency, and user satisfaction.
        </p>
      </div>
    </>
  );
};

export default About;

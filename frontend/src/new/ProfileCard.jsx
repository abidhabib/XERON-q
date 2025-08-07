import { MessageCircle, Camera, Send } from "lucide-react";
import profileImage from "../assets/react.svg";

const ProfileCard = () => {
  const socialLinks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-500",
      href: "#"
    },
    {
      name: "Snapchat",
      icon: Camera,
      color: "bg-yellow-400",
      href: "#"
    },
    {
      name: "Telegram",
      icon: Send,
      color: "bg-blue-500",
      href: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Main Profile Card */}
        <div className="relative overflow-hidden rounded-3xl shadow-lg">
          {/* Gradient Header */}
          <div className="h-40 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />

          {/* Profile Content */}
          <div className="bg-white px-6 pb-8 -mt-16 relative z-10 rounded-b-3xl shadow-inner">
            {/* Profile Image */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1499714608240-22fc6ad53fb2?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=76&q=80"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-800 mb-1">Brick Gold</h1>
              <p className="text-sm text-gray-500">Sir. Rohan Zafar</p>
            </div>
          </div>
        </div>

        {/* Connect Section */}
        <div className="text-center mt-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-700">Connect with me</h2>
        </div>

        {/* Social Links */}
        <div className="flex justify-center gap-6">
          {socialLinks.map((social) => {
            const IconComponent = social.icon;
            return (
              <a
                key={social.name}
                href={social.href}
                className="group flex flex-col items-center"
                aria-label={social.name}
              >
                <div
                  className={`${social.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-110 group-active:scale-95 shadow-md`}
                >
                  <IconComponent className="w-6 h-6" />
                </div>
                <span className="text-xs text-gray-500 mt-2">{social.name}</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserContext } from "./UserContext/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { RemoveTrailingZeros } from "../utils/utils";

export const BonusCard = () => {
  const { level, team } = useContext(UserContext);
  const [levelsData, setLevelsData] = useState([]);  
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionStatus, setCollectionStatus] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const fetchLevelData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/getBonusDetails`,
          { withCredentials: true }
        );
        if (response.data.status === "success") {
          const filteredLevels = response.data.levels.filter(levelData => levelData.level !== 110);
          setLevelsData(filteredLevels);
        }
      } catch (error) {
        console.error("Error fetching level data:", error);
      }
    };

    fetchLevelData();
  }, []);

  // ADDED: Get current level data
  const currentLevelData = levelsData.find((data) => data.level === level);
  const nextLevelData = levelsData.find((data) => data.level === level + 1);

  const calculateProgress = () => {
    if (!levelsData || levelsData.length === 0 || level < 0) return 0;

    const currentLevel = levelsData.find((data) => data.level === level);
    const nextLevel = levelsData.find((data) => data.level === level + 1);

    if (!currentLevel) return 0; 

    const minTeam = currentLevel.minTeam || 0;
    const maxTeam = nextLevel ? nextLevel.minTeam - 1 : currentLevel.minTeam + 10;

    if (team < minTeam) {
      return Math.min(((team / minTeam) * 100), 100);
    }

    const progress = ((team - minTeam) / (maxTeam - minTeam)) * 100;
    return Math.min(progress, 100);  
  };

  const handleCollectBonus = async () => {
    setIsCollecting(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/collectBonus`,
        {},
        { withCredentials: true }
      );

      if (response.data.status === "success") {
        setCollectionStatus("success"); 
      } else if (response.data.status === 403) {
        setCollectionStatus("failure"); 
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setCollectionStatus("failure"); 
      }
    } finally {
      setIsCollecting(false);
      setShowAnimation(true);
      setTimeout(() => {
        setShowAnimation(false);
      }, 2000);
    }
  };

  // Custom SVG Icons
  const SuccessIcon = () => (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-20 h-20 text-emerald-500"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <motion.path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
    </motion.svg>
  );

  const FailureIcon = () => (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-20 h-20 text-amber-500"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <motion.path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
    </motion.svg>
  );

  // Color scheme
  const colors = {
    primary: "#4F46E5",       // Indigo
    secondary: "#2563eb",     // Emerald
    accent: "#F59E0B",        // Amber
    background: "#F9FAFB",    // Gray-50
    dark: "#19202a",          // Gray-800
    text: "#374151",          // Gray-700
    lightText: "#6B7280",     // Gray-500
    currentReward: "#0EA5E9"  // Sky-500 - ADDED for current reward
  };

  return (
    <div className="min-h-screen pb-8 " style={{ backgroundColor: colors.background }}>
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden pb-12 pt-8 -mt-1 rounded-b-2xl"
        style={{ backgroundColor: colors.dark }}
      >
        <div className="container mx-auto px-4 max-w-md ">
          {/* Level Badge */}
          <div className="flex justify-center mb-6">
            <motion.div 
              className="relative w-24 h-24 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg"></div>
              
              <div className="relative z-10 text-center">
                <motion.span 
                  className="block text-3xl font-bold text-white"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {level}
                </motion.span>
                <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wide">Level</span>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-400 rounded-full animate-ping"></div>
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-6"
          >
            <div className="flex justify-between text-sm font-medium mb-2" style={{ color: colors.lightText }}>
              <span>Lv.{level}</span>
              <span>Lv.{level + 1}</span>
            </div>
            
            <div className="relative h-10 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="absolute h-full rounded-full"
                style={{ 
                  width: `${calculateProgress()}%`,
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${calculateProgress()}%` }}
                transition={{ duration: 0.8 }}
              >
                <div className="absolute right-0 -mr-1.5 w-10  h-9 bg-white rounded-full shadow-sm" style={{ top: '50%', transform: 'translateY(-50%)' }} />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ADDED: Current Reward Card */}
      {currentLevelData && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="container mx-auto px-2 mt-6"
        >
          <div 
            className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)' }}
          >
            <h3 className="text-lg font-semibold text-center mb-5" style={{ color: colors.dark }}>
              Current Reward
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-lg" style={{ backgroundColor: '#E0F2FF' }}>
                <span className="text-sm font-medium" style={{ color: colors.text }}>
                  Reward Amount
                </span>
                <span className="text-base font-bold" style={{ color: colors.currentReward }}>
                  ${RemoveTrailingZeros(currentLevelData.bonus)}
                </span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              className={`w-full mt-6 py-2 text-sm rounded-lg font-medium transition-colors flex items-center justify-center ${
                isCollecting 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                  : `text-white shadow-md hover:opacity-90`
              }`}
              style={{ 
                background: isCollecting 
                  ? undefined 
                  : `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`
              }}
              onClick={handleCollectBonus}
              disabled={isCollecting}
            >
              <div className="flex items-center justify-center space-x-2">
                {isCollecting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{isCollecting ? "Collecting..." : "Claim Reward"}</span>
              </div>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Next Reward Card */}
      {nextLevelData && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="container mx-auto px-2 mt-6"
        >
          <div 
            className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02)' }}
          >
            <h3 className="text-lg font-semibold text-center mb-5" style={{ color: colors.dark }}>
              Next Reward
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-lg" style={{ backgroundColor: '#E0E7FF' }}>
                <span className="text-sm font-medium" style={{ color: colors.text }}>
                  Required Members
                </span>
                <span className="text-base font-bold" style={{ color: colors.primary }}>
                  {nextLevelData.minTeam - team}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 rounded-lg" style={{ backgroundColor: '#D1FAE5' }}>
                <span className="text-sm font-medium" style={{ color: colors.text }}>
                  Reward Amount
                </span>
                <span className="text-base font-bold" style={{ color: colors.secondary }}>
                  ${RemoveTrailingZeros(nextLevelData.bonus)}
                </span>
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* Animation Overlay */}
      <AnimatePresence>
        {showAnimation && collectionStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white p-8 rounded-xl shadow-xl max-w-xs w-full mx-4 text-center"
            >
              <div className="flex justify-center mb-4">
                {collectionStatus === "success" ? <SuccessIcon /> : <FailureIcon />}
              </div>
              <p className="text-lg font-medium" style={{ color: colors.text }}>
                {collectionStatus === "success" ? (
                  <span className="text-emerald-600">Successfully Claimed!</span>
                ) : (
                  <span className="text-amber-600">Already Collected</span>
                )}
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="mt-6 py-2 px-6 rounded-lg font-medium text-white"
                style={{ backgroundColor: colors.primary }}
                onClick={() => setShowAnimation(false)}
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};  
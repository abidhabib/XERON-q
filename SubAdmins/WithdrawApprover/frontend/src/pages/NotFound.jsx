import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-indigo-500/10"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              width: Math.random() * 100 + 20,
              height: Math.random() * 100 + 20,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 5 + 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>
      
      {/* Main content */}
      <div className="relative z-10 max-w-4xl w-full text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-10"
        >
          <SpaceIllustration />
        </motion.div>
        
        <motion.h1 
          className="text-9xl md:text-[12rem] font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          404
        </motion.h1>
        
        <motion.h2 
          className="text-3xl md:text-5xl font-bold mb-6"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          Lost in the Digital Cosmos
        </motion.h2>
        
        <motion.p 
          className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          The page you're looking for has drifted into the void. It might have been moved, deleted, or perhaps it never existed in this universe.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.8 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-lg font-semibold shadow-lg overflow-hidden"
            onClick={() => navigate('/')}
          >
            <span className="relative z-10 flex items-center gap-3">
              <motion.svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 group-hover:animate-pulse"
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </motion.svg>
              Return to Home
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </motion.button>
        </motion.div>
        
        <motion.div 
          className="mt-16 flex flex-wrap justify-center gap-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1 }}
        >
          <div className="flex flex-col items-center">
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-full mb-2">
              <PlanetIcon />
            </div>
            <span className="text-gray-400">Explore</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-full mb-2">
              <TelescopeIcon />
            </div>
            <span className="text-gray-400">Discover</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-full mb-2">
              <RocketIcon />
            </div>
            <span className="text-gray-400">Navigate</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Custom SVG components
const SpaceIllustration = () => (
  <svg width="320" height="180" viewBox="0 0 320 180" className="w-full max-w-md">
    <motion.path
      d="M160,20 C180,40 200,50 220,40 C240,30 260,20 280,30 C300,40 310,60 300,80 C290,100 270,110 250,100 C230,90 210,80 190,90 C170,100 150,110 130,100 C110,90 90,70 100,50 C110,30 130,20 150,30 C170,40 180,50 160,20 Z"
      fill="none"
      stroke="#818cf8"
      strokeWidth="2"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.3 }}
      transition={{ duration: 2, delay: 0.5 }}
    />
    
    <motion.circle 
      cx="160" 
      cy="90" 
      r="40" 
      fill="#4f46e5" 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    />
    
    <motion.circle 
      cx="100" 
      cy="60" 
      r="10" 
      fill="#c084fc" 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5, delay: 0.7 }}
    />
    
    <motion.circle 
      cx="220" 
      cy="120" 
      r="8" 
      fill="#60a5fa" 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5, delay: 0.9 }}
    />
    
    <motion.circle 
      cx="280" 
      cy="70" 
      r="6" 
      fill="#38bdf8" 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5, delay: 1.1 }}
    />
    
    <motion.circle 
      cx="70" 
      cy="120" 
      r="5" 
      fill="#a78bfa" 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5, delay: 1.3 }}
    />
    
    <motion.circle 
      cx="240" 
      cy="40" 
      r="4" 
      fill="#818cf8" 
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5, delay: 1.5 }}
    />
  </svg>
);

const PlanetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <motion.path 
      d="M2 12h20"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
    />
    <motion.path 
      d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
    />
  </svg>
);

const TelescopeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <motion.path 
      d="M12 10l-3 3"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
    />
    <motion.path 
      d="M14 12l1.5 1.5"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.2, repeat: Infinity, repeatType: "reverse" }}
    />
    <motion.path 
      d="M3 21l2.5-6.5L12 3l3.5 4.5L21 9"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
    />
    <motion.path 
      d="M21 9l-3 3"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.4, repeat: Infinity, repeatType: "reverse" }}
    />
    <motion.path 
      d="M12 3v18"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
    />
  </svg>
);

const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <motion.path 
      d="M12.9 19.07L5 12l7.9-7.07"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
    />
    <motion.path 
      d="M17 16l-3-3 3-3"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.2, repeat: Infinity, repeatType: "reverse" }}
    />
    <motion.path 
      d="M8 16l3-3-3-3"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.4, repeat: Infinity, repeatType: "reverse" }}
    />
    <motion.path 
      d="M12 19l3-3-3-3"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.6, repeat: Infinity, repeatType: "reverse" }}
    />
  </svg>
);

export default NotFound;
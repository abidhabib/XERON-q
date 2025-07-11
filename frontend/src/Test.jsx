import React, { useContext, useEffect } from 'react';
import { UserContext } from './UserContext/UserContext';  // Import UserContext

const Test = () => {
  const { userData, fetchUserData } = useContext(UserContext);  // Destructure userData and fetchUserData from context

  useEffect(() => {
    fetchUserData();
    
    // Fetch user data when the component mounts
  }, []);  // Empty dependency array means this useEffect runs once after initial render

  return (
    <div>
      {userData ? (
        <div>
          <h1>Welcome, {userData.name}!</h1>
          {/* Render more user data as needed */}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Test;


























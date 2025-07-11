import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './BonusHistory.css'; // Create this CSS file for styling

const BonusHistory = () => {
  const [bonusHistory, setBonusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBonusHistory = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/bonusHistory`, {
          withCredentials: true,
        });
        setBonusHistory(response.data);
      } catch (error) {
        console.error('Error fetching bonus history:', error);
        setError('Failed to load bonus history.');
      } finally {
        setLoading(false);
      }
    };

    fetchBonusHistory();
  }, []);

  // Function to format the date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-danger">{error}</div>;
  }

  return (
    <div className="bonus-history">
      <h3>Bonus Collected History</h3>
      {bonusHistory.length === 0 ? (
        <p>No bonus history available.</p>
      ) : (
        bonusHistory.map((bonus, index) => (
          <div className="bonus-card" key={index}>
            <p>Bonus Amount: <strong>${bonus.bonus_amount}</strong></p>
            <p>Collected At: <strong>{formatDate(bonus.collected_at)}</strong></p>
          </div>
        ))
      )}
    </div>
  );
};

export default BonusHistory;

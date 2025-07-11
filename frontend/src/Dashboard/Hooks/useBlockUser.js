import axios from 'axios';
import { useState } from 'react';

export default function useBlockUser() {
  const [loading, setLoading] = useState(false);

  const toggleBlock = async (userId, currentStatus, updateLocalState) => {
    try {
      setLoading(true);
      const newStatus = currentStatus === 1 ? 0 : 1;

      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/blockUser/${userId}`, {
        blocked: newStatus,
      });

      // Callback to update component state
      if (typeof updateLocalState === 'function') {
        updateLocalState(userId, newStatus);
      }

      return { success: true, blocked: newStatus };
    } catch (error) {
      console.error('Error toggling block status:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return { toggleBlock, loading };
}

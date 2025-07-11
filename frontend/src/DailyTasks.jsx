import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserContext } from "./UserContext/UserContext";
import { motion } from "framer-motion";
import CircularProgress from "./CheckMark";
import NavBAr from "./NavBAr";

const DailyTasks = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedTasks, setCompletedTasks] = useState({});
  const [disabledButtons, setDisabledButtons] = useState({});
  const { Userid } = useContext(UserContext);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/fetchClickedProducts`,
          { withCredentials: true }
        );
        if (data.status === "success") {
          setProducts(data.products);
          setCompletedTasks(
            data.products.reduce((acc, product) => {
              if (product.last_clicked) acc[product.id] = true;
              return acc;
            }, {})
          );
        } else throw new Error(data.error);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [Userid]);

  const handleComplete = async (productId) => {
    setShowProcessing(true);
    setDisabledButtons((prev) => ({ ...prev, [productId]: true }));

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/updateBalance`,
        { productId },
        { withCredentials: true }
      );
      if (data.status === "success") {
        setTimeout(() => {
          setShowProcessing(false);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        }, 1000);
        setCompletedTasks((prev) => ({ ...prev, [productId]: true }));
      } else toast.error(data.error);
    } catch {
      toast.error("Error updating balance!");
    } finally {
      setDisabledButtons((prev) => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) return <div className="flex justify-center h-screen">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <>
      <NavBAr />
      <div className="container mx-auto p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {products.map(({ id, imgLink, description }) => (
          <div key={id} className="bg-white shadow-lg rounded-lg p-3 text-center">
            <img src={imgLink} alt={description} className="w-full h-40 object-cover rounded-md" />
            <p className="mt-2 text-gray-700">{description}</p>
            <button
              className={`mt-2 w-full py-2 rounded text-white ${
                completedTasks[id] ? "bg-gray-500" : "bg-[#19202a] "
              }`}
              onClick={() => handleComplete(id)}
              disabled={completedTasks[id] || disabledButtons[id]}
            >
              {completedTasks[id] ? "Completed" : "Complete"}
            </button>
          </div>
        ))}
      </div>
      <ToastContainer position="top-center" />
      {showProcessing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-5 rounded-lg">Processing...</div>
        </div>
      )}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
            <CircularProgress progress={100} />
          </motion.div>
          <p className="text-green-500">Success!</p>
        </div>
      )}
    </>
  );
};

export default DailyTasks;

import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext/UserContext";


const Waiting = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { paymentOk, approved, isRejected, fetchUserData,trx_id, logout } =
    useContext(UserContext);
    const [displayText, setDisplayText] = useState("");
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    fetchUserData().then(() => {
      setLoading(false);
    });
  }, []);
  const phrases = [
    "Finalizing your payment...",
    "Completing verification...",
    "Securing your transaction...",
  ];

  // Custom Typewriter Effect
  useEffect(() => {
    const typeSpeed = isDeleting ? 30 : 100;
    const currentPhrase = phrases[currentPhraseIndex];

    if (!isDeleting) {
      if (displayText.length < currentPhrase.length) {
        const timeout = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        }, typeSpeed);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => setIsDeleting(true), 1500);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length - 1));
        }, typeSpeed);
        return () => clearTimeout(timeout);
      } else {
        setIsDeleting(false);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }
  }, [displayText, isDeleting, currentPhraseIndex]);

  useEffect(() => {
    if (!loading) {
      if (isRejected === 1 || paymentOk === 0) {
        navigate("/payment");
      } else if (approved === 1) {
        navigate("/wallet-page");
      } else if (paymentOk === 1 && approved === 0) {
        navigate("/waiting");
      }
    }
  }, [isRejected, approved, paymentOk, navigate, loading]);

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-2">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-3">
    
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2 h-12">
            {displayText}
            <span className="ml-1 w-1 h-6 bg-blue-500 inline-block animate-pulse"></span>
          </h1>
          <p className="text-gray-500 text-sm">
            Typically completes in 10-30 minutes
          </p>
        </div>

        {/* Status Steps */}
        <div className="space-y-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-gray-800 font-medium">Payment Confirming ...</p>
              <p className="text-gray-500 text-sm mt-1">
                #HASH{"_"}
                <span className="font-mono text-blue-600 break-all">{trx_id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 opacity-50">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-gray-800 font-medium">Security Check</p>
              <p className="text-gray-500 text-sm mt-1">
                Verifying transaction details
              </p>
            </div>
          </div>
        </div>

        {/* Support Card */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-gray-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <div>
              <p className="text-gray-800 text-sm">
                Need help?{" "}
                <a
                  href="mailto:support@company.com"
                  className="text-blue-600 hover:underline"
                >
                  Contact support
                </a>
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Average response time: 15 minutes
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Sign Out</span>
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-2 text-sm rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default Waiting;
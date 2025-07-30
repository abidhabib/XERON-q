import { useState, useEffect } from 'react';
import registerPushNotifications from './../../../utils/pushNotifications';
import unregisterPushNotifications from './../../../utils/pushNotifications';
import { FiBell, FiSend, FiCheckCircle, FiXCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { Sidebar } from '../SideBarSection/Sidebar';

const PushNotificationManager = () => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Notification form state
  const [form, setForm] = useState({
    title: '',
    message: '',
    url: '',
  });

  useEffect(() => {
    const init = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);
      if (!supported) return setStatus('unsupported');

      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          setStatus('subscribed');
        } else {
          setStatus('registering');
          const result = await registerPushNotifications();
          setStatus(result ? 'subscribed' : 'error');
        }
      } catch (err) {
        console.error('Auto registration error:', err);
        setStatus('error');
        setError(err.message);
      }
    };
    init();
  }, []);
console.log(status);

  const handleManualSubscribe = async () => {
    setStatus('registering');
    const result = await registerPushNotifications();
    setStatus(result ? 'subscribed' : 'error');
  };

  const handleUnsubscribe = async () => {
    setStatus('unregistering');
    const result = await unregisterPushNotifications();
    setStatus(result ? 'unsubscribed' : 'error');
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const sendPush = async () => {
    setIsSending(true);
    const { title, message, url } = form;
    if (!title || !message) {
      alert('Please enter title and message');
      setIsSending(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/broadcast-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, url }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Notification sent to ${data.sent} users`);
      } else {
        alert('❌ Failed to send push notification');
      }
    } catch (err) {
      console.error('Send push failed:', err);
      alert('❌ Push notification send error');
    } finally {
      setIsSending(false);
    }
  };

  const statusConfig = {
    checking: { 
      text: 'Checking subscription status...', 
      icon: <FiLoader className="animate-spin" />,
      color: 'text-blue-500'
    },
    registering: { 
      text: 'Registering push notifications...', 
      icon: <FiLoader className="animate-spin" />,
      color: 'text-blue-500'
    },
    unregistering: { 
      text: 'Unregistering push notifications...', 
      icon: <FiLoader className="animate-spin" />,
      color: 'text-blue-500'
    },
    subscribed: { 
      text: 'Push notifications enabled', 
      icon: <FiCheckCircle />,
      color: 'text-green-500'
    },
    unsubscribed: { 
      text: 'Push notifications disabled', 
      icon: <FiXCircle />,
      color: 'text-red-500'
    },
    unsupported: { 
      text: 'Push notifications not supported', 
      icon: <FiXCircle />,
      color: 'text-red-500'
    },
    error: { 
      text: `Error: ${error}`, 
      icon: <FiAlertCircle />,
      color: 'text-red-500'
    }
  };

  const currentStatus = statusConfig[status] || { text: 'Unknown status', icon: null, color: 'text-gray-500' };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
     <Sidebar/>
      {/* Main Content */}
      <div className="flex-1 p-4 ml-10 md:p-6 ml-0 md:ml-64">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-xl mr-4">
                <FiBell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Push Notification</h1>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subscription Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Subscription Status</h2>
              
              <div className={`flex items-center mb-6 ${currentStatus.color}`}>
                {currentStatus.icon}
                <span className="ml-2">{currentStatus.text}</span>
              </div>
              
              <div className="flex gap-3">
                {(status === 'unsubscribed' || status === 'error') && (
                  <button 
                    onClick={handleManualSubscribe} 
                    disabled={!isSupported || status === 'registering'}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      !isSupported || status === 'registering'
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {status === 'registering' ? 'Registering...' : 'Enable Notifications'}
                  </button>
                )}

                {status === 'subscribed' && (
                  <button 
                    onClick={handleUnsubscribe}
                    disabled={status === 'unregistering'}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      status === 'unregistering'
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {status === 'unregistering' ? 'Unregistering...' : 'Disable Notifications'}
                  </button>
                )}

                {!isSupported && (
                  <div className="px-4 py-2 bg-red-100 text-red-700 rounded-lg">
                    ❌ Your browser doesn't support push notifications
                  </div>
                )}
              </div>
            </div>
            
            {/* Send Notification Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Send Notification</h2>
              <p className="text-gray-600 mb-6">Broadcast a message to all subscribed users</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Notification Title"
                    value={form.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    name="message"
                    placeholder="Notification Message"
                    value={form.message}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL (optional)</label>
                  <input
                    type="text"
                    name="url"
                    placeholder="https://example.com"
                    value={form.url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button 
                  onClick={sendPush}
                  disabled={isSending || !form.title || !form.message}
                  className={`flex items-center justify-center gap-2 w-full px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                    isSending || !form.title || !form.message
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isSending ? (
                    <>
                      <FiLoader className="animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <FiSend /> Broadcast Notification
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
       
        </div>
      </div>
    </div>
  );
};

export default PushNotificationManager;
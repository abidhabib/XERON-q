// Dashboard/Hooks/usePushNotifications.js
import { useEffect, useState } from 'react';
import registerPushNotifications from './../../../utils/pushNotifications';

const usePushNotifications = () => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    console.log("🔔 [PROD DEBUG] usePushNotifications hook EFFECT started"); // <--- Add this
    const init = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      console.log("🔔 [PROD DEBUG] Push Supported check:", supported); // <--- Add this
      setIsSupported(supported);
      if (!supported) {
        setStatus('unsupported');
        console.log("🔔 [PROD DEBUG] Push NOT supported, exiting hook"); // <--- Add this
        return;
      }

      try {
        console.log("🔔 [PROD DEBUG] Waiting for Service Worker ready..."); // <--- Add this
        const reg = await navigator.serviceWorker.ready;
        console.log("🔔 [PROD DEBUG] Service Worker ready, checking for existing subscription..."); // <--- Add this
        const existing = await reg.pushManager.getSubscription();
        console.log("🔔 [PROD DEBUG] Existing subscription check result:", existing); // <--- Add this

        if (existing) {
          setStatus('subscribed');
          console.log("🔔 [PROD DEBUG] Already subscribed, exiting hook"); // <--- Add this
          return;
        }
        console.log("🔔 [PROD DEBUG] No existing subscription, calling registerPushNotifications..."); // <--- Add this
        const result = await registerPushNotifications(); // ⬅️ this must return true/false
        console.log("🔔 [PROD DEBUG] registerPushNotifications returned:", result); // <--- Add this
        if (result) {
          setStatus('subscribed');
        } else {
          setStatus('failed');
          setError('User denied or registration failed');
        }
      } catch (err) {
        console.error('🔔 [PROD DEBUG] Auto registration error:', err);
        setStatus('error');
        setError(err.message || 'Something went wrong');
      }
    };

    init();
  }, []);

  // Optionally log state changes
  console.log("🔔 [PROD DEBUG] usePushNotifications hook state:", { status, error, isSupported }); // <--- Add this

  return { status, error, isSupported };
};

export default usePushNotifications;
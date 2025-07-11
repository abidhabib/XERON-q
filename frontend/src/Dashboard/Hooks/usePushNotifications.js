import { useEffect, useState } from 'react';
import registerPushNotifications from './../../../utils/pushNotifications';

const usePushNotifications = () => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);
      if (!supported) return setStatus('unsupported');

      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (!existing) {
          await registerPushNotifications();
        }
        setStatus('subscribed');
      } catch (err) {
        console.error('Auto registration error:', err);
        setStatus('error');
        setError(err.message);
      }
    };
    init();
  }, []);

  return { status, error, isSupported };
};

export default usePushNotifications;

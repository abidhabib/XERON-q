import { useEffect, useState } from 'react';
import registerPushNotifications from './../../../utils/pushNotifications';

const usePushNotifications = () => {
  const [status, setStatus] = useState('checking'); // checking, subscribed, failed, unsupported, error
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);
      if (!supported) {
        setStatus('unsupported');
        console.log('Push notifications not supported');
        
        return;
      }

      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();

        if (existing) {
          setStatus('subscribed');
                  console.log('Push notifications not supported');

          return;
        }

        const result = await registerPushNotifications(); // ⬅️ this must return true/false
        if (result) {
          console.log('Subscribed');
          
          setStatus('subscribed');
        } else {
          setStatus('failed');
          setError('User denied or registration failed');
        }
      } catch (err) {
        console.error('Auto registration error:', err);
        setStatus('error');
        setError(err.message || 'Something went wrong');
      }
    };

    init();
  }, []);

  return { status, error, isSupported };
};

export default usePushNotifications;

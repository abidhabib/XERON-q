import axios from "axios";
import { urlBase64ToUint8Array } from "./urlBase64ToUint8Array";

const registerPushNotifications = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications not supported");
    return false;
  }

  try {
    // 🧹 DEV ONLY: Unregister old service workers (prevent stale workers)
    if (import.meta.env.DEV) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      console.log("🧹 Old service workers unregistered");
    }

    const registration = await navigator.serviceWorker.register("/service-worker.js");
    console.log("✅ Service Worker registered");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("🔒 Notification permission denied");
      return false;
    }

    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log("🔁 Already subscribed");
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/save-subscription`, {
        subscription: existingSubscription,
      });
      return true;
    }

    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    const convertedKey = urlBase64ToUint8Array(publicKey);
    console.log("🔑 VAPID public key converted");

    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });

    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/save-subscription`, {
      subscription: newSubscription,
    });

    console.log("✅ Push subscription registered and sent to server");
    return true;
  } catch (error) {
    console.error("❌ Push registration failed:", error);
    return false;
  }
};



export default registerPushNotifications;

import axios from "axios";
import { urlBase64ToUint8Array } from "./urlBase64ToUint8Array";

 const registerPushNotifications = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications not supported");
    return false;
  }

  try {
    // ✅ Register Service Worker from public directory
    const registration = await navigator.serviceWorker.register("/service-worker.js");
    console.log("✅ Service Worker registered");

    // ✅ Ask for Notification Permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("🔒 Notification permission denied");
      return false;
    }

    // ✅ Convert the public VAPID key
    const publicKey ="BMEoNncfAMacnLB-tFNjGrZKW8XYAT0IJrP2e_D0A7eHqxGq21jozZasgS6artXBTH89tiLBtWvtXQH9XEqWn-w";
    const convertedKey = urlBase64ToUint8Array(publicKey);
    console.log("🔑 VAPID public key converted");

    // ✅ Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });

    // ✅ Send to server
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/save-subscription`, {
      subscription,
    });

    console.log("✅ Push subscription registered and sent to server");
    return true;
  } catch (error) {
    console.error("❌ Push registration failed:", error);
    return false;
  }
};

export default registerPushNotifications;
 
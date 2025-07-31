// utils/registerPushNotifications.js
import axios from "axios";
import { urlBase64ToUint8Array } from "./urlBase64ToUint8Array";

const registerPushNotifications = async () => {
  console.log("🔔 [DEBUG] registerPushNotifications function STARTED");

  // 1. Feature Detection
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("🔔 [DEBUG] Push notifications not supported by this browser.");
    return false;
  }
  console.log("🔔 [DEBUG] Push API and Service Worker are supported.");

  try {
    // 2. Development Cleanup (Optional but helpful)
    if (import.meta.env.DEV) {
      console.log("🧹 [DEV] Checking for old service workers...");
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        await Promise.all(registrations.map(r => r.unregister()));
        console.log("🧹 [DEV] Old service workers unregistered.");
      } else {
        console.log("🧹 [DEV] No old service workers found.");
      }
    }

    // 3. Service Worker Registration
    console.log("🔔 [DEBUG] Attempting to register Service Worker at '/service-worker.js'...");
    const registration = await navigator.serviceWorker.register("/service-worker.js");
    console.log("✅ Service Worker registered successfully with scope:", registration.scope);

    // 4. Request Notification Permission
    console.log("🔔 [DEBUG] Requesting Notification Permission from user...");
    const permission = await Notification.requestPermission();
    console.log("🔔 [DEBUG] Notification permission result:", permission);
    if (permission !== "granted") {
      console.warn("🔒 Notification permission was denied or not granted by the user.");
      // Consider returning a specific status if needed, e.g., 'denied'
      return false;
    }
    console.log("🔔 [DEBUG] Notification permission GRANTED.");

    // 5. Check for Existing Subscription
    console.log("🔔 [DEBUG] Checking for existing push subscription...");
    const existingSubscription = await registration.pushManager.getSubscription();
    console.log("🔔 [DEBUG] Existing subscription check completed.");

    if (existingSubscription) {
      console.log("🔁 User is already subscribed. Endpoint:", existingSubscription.endpoint);
      try {
        console.log("🔁 Sending existing subscription to backend for verification/update...");
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/save-subscription`, {
          subscription: existingSubscription,
        });
        console.log("🔁 Existing subscription confirmed/sent to server.");
      } catch (sendError) {
        console.error("❌ Failed to send existing subscription to server:", sendError.response?.data || sendError.message);
        // Depending on requirements, you might want to re-subscribe or fail here.
        // For now, we'll assume the subscription exists client-side.
      }
      return true; // Successfully checked/reported existing subscription
    }

    // 6. Get VAPID Key and Convert
    const publicKeyEnv = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    console.log("🔔 [DEBUG] VITE_VAPID_PUBLIC_KEY present in env:", !!publicKeyEnv);
    if (!publicKeyEnv) {
      console.error("❌ VITE_VAPID_PUBLIC_KEY is missing in the frontend environment variables (.env file).");
      return false;
    }
    console.log("🔑 VAPID public key (first 20 chars):", publicKeyEnv.substring(0, 20) + '...');

    let convertedKey;
    try {
      convertedKey = urlBase64ToUint8Array(publicKeyEnv);
      console.log("🔑 VAPID public key successfully converted to Uint8Array.");
    } catch (conversionError) {
      console.error("❌ Error converting VAPID public key:", conversionError.message);
      return false;
    }

    // 7. Create New Subscription
    console.log("🔔 [DEBUG] Creating new push subscription...");
    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });
    console.log("✅ New Push subscription created successfully. Endpoint:", newSubscription.endpoint);

    // 8. Send New Subscription to Backend
    console.log("🔔 [DEBUG] Sending new subscription to backend server...");
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/save-subscription`, {
        subscription: newSubscription,
      });
      console.log("✅ New push subscription registered and sent to server successfully.");
      return true;
    } catch (sendError) {
      console.error("❌ Failed to send new subscription to server:", sendError.response?.data || sendError.message);
      // If sending fails, the subscription isn't persisted server-side.
      return false;
    }

  } catch (error) {
    // 9. Catch Any Unexpected Errors
    console.error("❌ Push registration failed unexpectedly:", error);
    // Provide more context if it's related to subscription creation
    if (error.name === 'NotAllowedError') {
        console.error("   -> This usually means the user denied the permission prompt or permission is blocked.");
    } else if (error.name === 'InvalidStateError') {
        console.error("   -> This might indicate an issue with the Service Worker state or PushManager.");
    } else if (error.name === 'NotFoundError' || error.name === 'AbortError') {
         console.error("   -> This might be related to Service Worker issues or aborted operations.");
    }
    return false;
  }
};

export default registerPushNotifications;
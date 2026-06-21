import { useEffect, useState } from "react";

export default function NotificationManager() {
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    // Register service worker on mount
    const registerSW = async () => {
      if (!('serviceWorker' in navigator)) return;
      
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration.scope);
        setRegistered(true);
        
        // Check if already subscribed
        const checkSubscription = () => {
          const pa = window.PushAlertCo || window.pa_push;
          const isSub = pa?.isSubscribed?.() || localStorage.getItem("pa_subscription_active") === "1";
          if (isSub) {
            localStorage.setItem("pa_subscription_active", "1");
          }
        };
        
        // Wait for SDK to load then check
        setTimeout(checkSubscription, 2000);
        const interval = setInterval(checkSubscription, 3000);
        setTimeout(() => clearInterval(interval), 15000);
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerSW();
  }, []);

  return null;
}
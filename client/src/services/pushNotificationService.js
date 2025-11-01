const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';


export function isPushNotificationSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}


export async function checkNotificationPermission() {
  if (!('Notification' in window)) {
    return 'not-supported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  } else if (Notification.permission === 'denied') {
    return 'denied';
  } else {
    return 'default';
  }
}


export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  const permission = await Notification.requestPermission();
  return permission;
}


export async function getVapidPublicKey() {
  try {
    const response = await fetch(`${API_BASE}/notifications/public-key`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.publicKey;
    }
    
    throw new Error('Failed to get VAPID public key');
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    throw error;
  }
}


function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Workers are not supported');
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
}


export async function subscribeToPushNotifications(token) {
  try {
    if (!isPushNotificationSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await checkNotificationPermission();
    if (permission !== 'granted') {
      const result = await requestNotificationPermission();
      if (result !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await registerServiceWorker();
    }
    await navigator.serviceWorker.ready;

    const vapidPublicKey = await getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });

    const subscriptionJson = subscription.toJSON();
    const keys = subscriptionJson.keys;

    const userAgent = navigator.userAgent;
    let browser = 'unknown';
    if (userAgent.indexOf('Chrome') > -1) browser = 'chrome';
    else if (userAgent.indexOf('Firefox') > -1) browser = 'firefox';
    else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) browser = 'safari';
    else if (userAgent.indexOf('Edge') > -1) browser = 'edge';

    const response = await fetch(`${API_BASE}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify({
        endpoint: subscriptionJson.endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth
        },
        browser: browser,
        deviceInfo: navigator.platform
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('Subscribed to push notifications');
      return subscription;
    } else {
      throw new Error(data.message || 'Failed to subscribe');
    }
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }
}


export async function unsubscribeFromPushNotifications(token, endpoint) {
  try {
    if (!endpoint) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        endpoint = subscription.endpoint;
        await subscription.unsubscribe();
      }
    }

    if (endpoint) {
      await fetch(`${API_BASE}/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ endpoint })
      });
    }

    console.log('Unsubscribed from push notifications');
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    throw error;
  }
}


export async function checkSubscription() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}


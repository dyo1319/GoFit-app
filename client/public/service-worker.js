const CACHE_NAME = 'gofit-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');

  let data = {
    title: 'GoFit',
    body: 'You have a new notification',
    icon: '/assests/logo.svg',
    badge: '/assests/logo.svg',
    tag: 'gofit-notification',
    data: {
      url: '/'
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || data.data,
        requireInteraction: payload.requireInteraction || false,
        vibrate: payload.vibrate || [200, 100, 200]
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    requireInteraction: data.requireInteraction,
    vibrate: data.vibrate,
    dir: 'rtl', 
    lang: 'he',
    renotify: true,
    silent: false
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, notificationOptions),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'NEW_NOTIFICATION',
            notification: data
          });
        });
      })
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/app';
  const type = event.notification.data?.type || null;
  const notificationId = event.notification.data?.notificationId || null;

  if (notificationId) {
    const apiBase = self.location.origin.includes('localhost') 
      ? 'http://localhost:5000' 
      : self.location.origin.replace(/:\d+$/, ':5000');
    
    fetch(`${apiBase}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    }).catch(err => console.error('Error marking notification as read:', err));
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const urlToOpenParsed = new URL(urlToOpen, self.location.origin);
      const baseUrl = urlToOpenParsed.pathname;
      
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        const clientUrl = new URL(client.url);
        
        if (clientUrl.origin === urlToOpenParsed.origin) {
          client.postMessage({
            type: 'NAVIGATE_TO_NOTIFICATION',
            url: urlToOpen
          });
          if ('focus' in client) {
            return client.focus();
          }
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed');
});


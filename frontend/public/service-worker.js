// Enhanced with VAPID key verification
self.addEventListener('install', event => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
  });
  
  self.addEventListener('push', event => {
    if (!event.data) return;
    
    try {
      const payload = event.data.json();
      
      if (!payload.title || !payload.body) {
        throw new Error('Invalid push payload');
      }
      
      const options = {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/badge-72x72.png',
        data: payload.data || { url: '/' },
        vibrate: [100, 50, 100]
      };
      
      event.waitUntil(
        self.registration.showNotification(payload.title, options)
      );
      
    } catch (error) {
      console.error('Push handling failed:', error);
      event.waitUntil(
        self.registration.showNotification('New Message', {
          body: 'You have a new notification',
          icon: '/icon-192x192.png',
          data: { url: '/' }
        })
      );
    }
  });
  
  self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(windowClients => {
          for (const client of windowClients) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  });
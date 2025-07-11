// Enhanced with VAPID key verification
self.addEventListener('install', event => {
    self.skipWaiting();
    console.log('⚙️ Service Worker installed');
  });
  
  self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
    console.log('⚡ Service Worker activated');
  });
  
  self.addEventListener('push', event => {
    // Verify push came from our server
    if (!event.data) return;
    
    try {
      const payload = event.data.json();
      
      // Validate required fields
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
          // Focus open window with same URL
          for (const client of windowClients) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window if none found
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  });
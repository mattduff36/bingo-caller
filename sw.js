// Basic Service Worker

// On install, activate immediately
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting(); // Forces the waiting service worker to become the active service worker
});

// On activation, take control of all clients immediately
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(self.clients.claim()); // Ensures that updates to the service worker take effect immediately for all active clients
});

// Optional: A basic fetch handler to make it a "real" PWA for some audit tools,
// but not strictly necessary for "Add to Home Screen" standalone mode on iOS.
// For a simple app like this without offline needs, it can be kept minimal.
/*
self.addEventListener('fetch', (event) => {
  // console.log('Service Worker: Fetching ', event.request.url);
  // Basic cache-first or network-first strategy could go here if offline support was desired.
  // For now, just respond with the network request.
  event.respondWith(fetch(event.request));
});
*/

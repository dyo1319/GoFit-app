// Script to generate VAPID keys for push notifications
// Run: node utils/generateVapidKeys.js

const webpush = require('web-push');

console.log('Generating VAPID keys...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Add these to your .env file:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('\nVAPID Contact Email (add to .env):');
console.log('VAPID_CONTACT_EMAIL=your-email@example.com');





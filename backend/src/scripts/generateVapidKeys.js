#!/usr/bin/env node

/**
 * Script to generate VAPID keys for web push notifications
 * Usage: node src/scripts/generateVapidKeys.js
 */

import webpush from 'web-push';

console.log('🔐 Generating VAPID keys for web push notifications...\n');

try {
  const vapidKeys = webpush.generateVAPIDKeys();
  
  console.log('✅ VAPID keys generated successfully!\n');
  console.log('📋 Add these to your .env file:\n');
  console.log('VAPID_EMAIL=mailto:your-email@example.com');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log('\n⚠️  Keep the private key secure and never commit it to git!');
  console.log('✅ Public key can be safely exposed in client-side code.\n');
} catch (error) {
  console.error('❌ Error generating VAPID keys:', error);
  process.exit(1);
}

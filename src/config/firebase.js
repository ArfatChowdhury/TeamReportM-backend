const admin = require('firebase-admin');
const path = require('path');

const initializeFirebase = () => {
  try {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (serviceAccountPath && require('fs').existsSync(serviceAccountPath)) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('✅ Firebase Admin SDK Initialized');
    } else {
      console.warn('⚠️ Firebase serviceAccountKey.json not found. Auth middleware may fail.');
      // Initialize with default credentials if available, or just log warning
      if (process.env.FIREBASE_PROJECT_ID) {
         admin.initializeApp({
           projectId: process.env.FIREBASE_PROJECT_ID
         });
         console.log('✅ Firebase Admin SDK Initialized (Project ID only)');
      }
    }
  } catch (error) {
    console.error(`❌ Firebase Initialization Error: ${error.message}`);
  }
};

module.exports = { admin, initializeFirebase };

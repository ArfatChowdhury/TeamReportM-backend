const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase Admin SDK Already Initialized');
      return;
    }

    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const isLocalFile = serviceAccountPath && (serviceAccountPath.startsWith('./') || serviceAccountPath.startsWith('../'));
    const fullPath = serviceAccountPath ? path.resolve(process.cwd(), serviceAccountPath) : null;
    
    if (serviceAccountPath && !isLocalFile && fs.existsSync(fullPath)) {
      console.log('📂 Attempting to initialize with Service Account File:', fullPath);
      const serviceAccount = require(fullPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('✅ Firebase Admin SDK Initialized with Service Account File');
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('🌐 Attempting to initialize with Environment Variables');
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token"
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('✅ Firebase Admin SDK Initialized with Environment Variables');
    } else {
      console.log('⚠️ No full credentials found, initializing with Project ID only (Limited Mode)');
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('✅ Firebase Admin SDK Initialized (Limited Mode)');
    }
  } catch (error) {
    console.error(`❌ Firebase Initialization Error: ${error.message}`);
  }
};

module.exports = { admin, initializeFirebase };

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
    const fullPath = path.resolve(process.cwd(), serviceAccountPath);
    
    if (serviceAccountPath && fs.existsSync(fullPath)) {
      const serviceAccount = require(fullPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('✅ Firebase Admin SDK Initialized with Service Account');
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // For Vercel deployment, we might need to use environment variables instead
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token"
      };
      
      if (serviceAccount.private_key && serviceAccount.client_email) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        console.log('✅ Firebase Admin SDK Initialized with Environment Variables');
      } else {
        // Fallback for development without full credentials
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        console.log('⚠️ Firebase Admin SDK Initialized (Limited Mode - No Auth)');
      }
    } else {
      console.error('❌ No Firebase configuration found');
    }
  } catch (error) {
    console.error(`❌ Firebase Initialization Error: ${error.message}`);
  }
};

module.exports = { admin, initializeFirebase };

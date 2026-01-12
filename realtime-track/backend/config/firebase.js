const admin = require('firebase-admin');

/**
 * Initialize Firebase Admin SDK
 * 
 * Supports both JSON file and environment variables.
 * Environment variables are preferred for production.
 */
const initializeFirebase = () => {
    try {
        if (admin.apps.length > 0) return admin.app();

        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!projectId || !clientEmail || !privateKey || privateKey.includes('XXXXX')) {
            console.warn('⚠️ Firebase Admin credentials missing or incomplete. Auth token verification will be disabled.');
            return null;
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            })
        });

        console.log('✅ Firebase Admin SDK initialized');
        return admin.app();
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
        return null;
    }
};

module.exports = {
    admin,
    initializeFirebase,
};

const admin = require("firebase-admin");
// const serviceAccount = require("./service-account.json");

/* initialise app */
// const firebaseConfig = {
//   apiKey: process.env.FIREBASE_API_KEY,
//   authDomain: process.env.FIREBASE_AUTH_DOMAIN,
//   databaseURL: process.env.FIREBASE_DATABASE_URL,
//   projectId: process.env.FIREBASE_PROJECT_ID,
//   storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.FIREBASE_SENDER_ID,
//   appId: process.env.FIREBASE_APP_ID,
//   token_uri: "https://oauth2.googleapis.com/token"
// };
// admin.initializeApp(firebaseConfig);

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  // private_key: process.env.FIREBASE_PRIVATE_KEY, // for development
  private_key: JSON.parse(process.env.FIREBASE_PRIVATE_KEY), // for deploy
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URL,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/* initialise firestore */
const firestore = admin.firestore();
firestore.settings({
  timestampsInSnapshots: true
});
const FIRESTORE_TOKEN_COLLECTION = "instance_tokens";

async function storeAppInstanceToken(token) {
  try {
    return await firestore
      .collection(FIRESTORE_TOKEN_COLLECTION)
      .add({ token, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  } catch (err) {
    console.log(`Error storing token [${token}] in firestore`, err);
    return null;
  }
}

async function deleteAppInstanceToken(token) {
  try {
    const deleteQuery = firestore
      .collection(FIRESTORE_TOKEN_COLLECTION)
      .where("token", "==", token);
    const querySnapshot = await deleteQuery.get();
    querySnapshot.docs.forEach(async doc => {
      await doc.ref.delete();
    });
    return true;
  } catch (err) {
    console.log(`Error deleting token [${token}] in firestore`, err);
    return null;
  }
}

// Sending User Notifications
const messaging = admin.messaging();

async function sendNotification(token, title = "", body = "", link = "") {
  try {
    const message = {
      notification: {
        title: title,
        body: body
      },
      webpush: {
        headers: {
          TTL: "0"
        },
        notification: {
          icon: "https://img.icons8.com/color/96/e74c3c/ireland.png"
        },
        fcm_options: {
          link: link
        }
      },
      token: token
    };

    await messaging.send(message);

    console.log("Successfully sent message:");
  } catch (err) {
    console.log(err);
  }
}

// Topic Subscription
async function subscribeAppInstanceToTopic(token, topic) {
  try {
    return await messaging.subscribeToTopic(token, topic);
  } catch (err) {
    console.log(`Error subscribing token [${token}] to topic: `, err);
    return null;
  }
}

async function unsubscribeAppInstanceFromTopic(token, topic) {
  try {
    return await messaging.unsubscribeFromTopic(token, topic);
  } catch (err) {
    console.log(`Error unsubscribing token [${token}] from topic: `, err);
    return null;
  }
}

module.exports = {
  storeAppInstanceToken,
  deleteAppInstanceToken,
  subscribeAppInstanceToTopic,
  unsubscribeAppInstanceFromTopic,
  sendNotification
};

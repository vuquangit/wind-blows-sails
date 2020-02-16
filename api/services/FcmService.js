const admin = require("firebase-admin");

console.log(process.env.FIREBASE_PRIVATE_KEY);

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  // private_key: process.env.FIREBASE_PRIVATE_KEY, // for development
  private_key: JSON.parse(process.env.FIREBASE_PRIVATE_KEY), // for production
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
          icon:
            "https://res.cloudinary.com/dnzsa2z7b/image/upload/v1581590799/the-wind-blows/icon/favicon_si4agl.ico"
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

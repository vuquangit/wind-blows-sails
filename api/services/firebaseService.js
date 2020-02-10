const serviceAccount = require("./service-account.json");
const admin = require("firebase-admin");

/* initialise app */
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

function buildCommonMessage(title, body) {
  return {
    notification: {
      title: title,
      body: body
    }
  };
}

/**
 * Builds message with platform specific options
 * Link: https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages
 */
function buildPlatformMessage(token, title, body) {
  const fcmMessage = buildCommonMessage(title, body);

  const webpush = {
    headers: {
      TTL: "0"
    },
    notification: {
      icon: "https://img.icons8.com/color/96/e74c3c/ireland.png"
    },
    fcm_options: {
      link: "https://gnib-visa-app.rharshad.com"
    }
  };

  fcmMessage["token"] = token;
  fcmMessage["webpush"] = webpush;
  return fcmMessage;
}

async function sendFcmMessage(fcmMessage) {
  try {
    await messaging.send(fcmMessage);

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
  buildPlatformMessage,
  storeAppInstanceToken,
  deleteAppInstanceToken,
  subscribeAppInstanceToTopic,
  unsubscribeAppInstanceFromTopic,
  sendFcmMessage
};

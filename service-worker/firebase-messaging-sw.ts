import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

const firebaseApp = initializeApp({
  apiKey: "AIzaSyBZCRpj9smnz-yIpXC4KVi9RFs23qcxH7M",
  authDomain: "topictrade-8b711.firebaseapp.com",
  projectId: "topictrade-8b711",
  storageBucket: "topictrade-8b711.appspot.com",
  messagingSenderId: "993631591207",
  appId: "1:993631591207:web:d7bec5f0e54efdfe2ee702",
  measurementId: "G-9CNQ54G1CY",
});

let db: any;
const request = indexedDB.open("signedUserIdDatabase");
request.onupgradeneeded = (event) => {
  db = (event.target as any)?.result;
  if (!db.objectStoreNames.contains("userIds")) {
    db.createObjectStore("userIds", { keyPath: "id" });
  }
};
request.onsuccess = function () {
  db = request.result;
  console.log("Database opened successfully");
};
request.onerror = (event) => {
  console.error("Database error: ", (event.target as any)?.error);
};

const messaging = getMessaging(firebaseApp);

onBackgroundMessage(messaging, (payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload,
  );

  if (db) {
    const transaction = db.transaction(["userIds"]);
    const store = transaction.objectStore("userIds");
    const request = store.get("signedUserId");
    request.onsuccess = () => {
      if (request.result) {
        if (
          payload.data &&
          payload.data.userId !== request.result.signedUserId
        ) {
          (self as any).registration.showNotification(payload.data.title, {
            data: payload.data,
            body: payload.data.content,
            icon: payload.data.icon,
          });
        } else {
          console.log("Notification not shown because signed user Id matched");
        }
      } else {
        console.error("Signed user Id not found in indexedDB");
      }
    };
    request.onerror = (event: any) => {
      console.error("Database error: ", event.target?.error);
    };
  }
});

self.addEventListener("notificationclick", (event: any) => {
  console.log("On notification click: ", event.notification);
  event.notification.close();

  event.waitUntil(
    (self as any).clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList: any) => {
        for (const client of clientList) {
          console.log(client);
          if ("focus" in client) {
            client.postMessage({
              action: "redirect-from-notificationclick",
              topic: event.notification.data.topic,
            });
            return client.focus();
          }
        }
        if ((self as any).clients.openWindow) {
          return (self as any).clients.openWindow("/");
        }
      }),
  );
});

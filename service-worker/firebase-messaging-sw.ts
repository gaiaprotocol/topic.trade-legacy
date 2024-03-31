import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

const firebaseApp = initializeApp({
  apiKey: "AIzaSyBZCRpj9smnz-yIpXC4KVi9RFs23qcxH7M",
  authDomain: "topictrade-8b711.firebaseapp.com",
  projectId: "topictrade-8b711",
  storageBucket: "topictrade-8b711.appspot.com",
  messagingSenderId: "993631591207",
  appId: "1:993631591207:web:d7bec5f0e54efdfe2ee702",
  measurementId: "G-9CNQ54G1CY",
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
              action: "notificationclick",
              data: event.notification.data,
            });
            return client.focus();
          }
        }
        if ((self as any).clients.openWindow) {
          const fcmData = event.notification.data?.FCM_MSG?.data;
          return (self as any).clients.openWindow(
            "/?redirectTo=" + fcmData.redirectTo,
          );
        }
      }),
  );
});

getMessaging(firebaseApp);

console.log("Firebase messaging service worker loaded");

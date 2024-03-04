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

getMessaging(firebaseApp);

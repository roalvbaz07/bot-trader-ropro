import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Public Firebase config — safe to ship to the client.
const firebaseConfig = {
  apiKey: "AIzaSyDLbYQHt_05eVhd11P_uNY35-EBCT4rn6o",
  authDomain: "botinversor-ropro.firebaseapp.com",
  projectId: "botinversor-ropro",
  storageBucket: "botinversor-ropro.firebasestorage.app",
  messagingSenderId: "175600850996",
  appId: "1:175600850996:web:d179ace7a8cb22c5469261",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

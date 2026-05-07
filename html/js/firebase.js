import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAt6xD_cMCRk5DVCWA90Xz1lFVyI6Fo2CI",
  authDomain: "mind-in-ease.firebaseapp.com",
  projectId: "mind-in-ease",
  storageBucket: "mind-in-ease.firebasestorage.app",
  messagingSenderId: "87088655577",
  appId: "1:87088655577:web:5bc730a7f7548d491d62c8",
  measurementId: "G-8JNW80KLR6"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit
};
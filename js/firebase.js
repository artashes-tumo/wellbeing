import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
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
const CLIENT_KEY = "mae-client-id";

function getClientId() {
  let id = localStorage.getItem(CLIENT_KEY);

  if (!id) {
    id =
      "c-" +
      (crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now());

    localStorage.setItem(CLIENT_KEY, id);
  }

  return id;
}

export {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where
};

export async function saveMoodEntry(data) {
  await addDoc(collection(db, "moods"), {
    ...data,
    client_id: getClientId(),
    created_at: new Date().toISOString()
  });
}

export async function getMoodHistory() {
  const q = query(
    collection(db, "moods"),
    where("client_id", "==", getClientId())
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 30);
}

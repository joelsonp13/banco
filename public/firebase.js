import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCMpZOPrbxLIkacakFrWm3sEWqdnzP9mbg",
  authDomain: "sublyme-1ff2c.firebaseapp.com",
  projectId: "sublyme-1ff2c",
  storageBucket: "sublyme-1ff2c.appspot.com",
  messagingSenderId: "1045003534494",
  appId: "1:1045003534494:web:d1ae2db2e2d957060ffb8f",
  measurementId: "G-RPNF4GKLBJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

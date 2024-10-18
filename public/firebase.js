// Importe os módulos necessários do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCMpZOPrbxLIkacakFrWm3sEWqdnzP9mbg",
  authDomain: "sublyme-1ff2c.firebaseapp.com",
  projectId: "sublyme-1ff2c",
  storageBucket: "sublyme-1ff2c.appspot.com",
  messagingSenderId: "1045003534494",
  appId: "1:1045003534494:web:d1ae2db2e2d957060ffb8f",
  measurementId: "G-RPNF4GKLBJ"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Obtenha as instâncias de auth e firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Exporte as instâncias de auth e firestore
export { auth, db };

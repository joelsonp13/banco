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
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Exporte a instância do Firestore
const db = firebase.firestore();

// Verifique se db está definido

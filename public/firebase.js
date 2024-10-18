console.log('Iniciando configuração do Firebase');

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

console.log('Configuração do Firebase definida');

// Inicialize o Firebase
if (!firebase.apps.length) {
  console.log('Inicializando Firebase');
  firebase.initializeApp(firebaseConfig);
} else {
  console.log('Firebase já inicializado');
}



// Exporte a instância do Firestore
const db = firebase.firestore();
console.log('Instância do Firestore criada');

// Verifique se db está definido
if (db) {
  console.log('db está definido');
} else {
  console.error('db não está definido');
}

import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  setDoc 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBviDqZcv2h85QrcMcP19vbN7zueDRbygA",
  authDomain: "baf-ub.firebaseapp.com",
  projectId: "baf-ub",
  storageBucket: "baf-ub.appspot.com",
  messagingSenderId: "783346421981",
  appId: "1:783346421981:web:32984844eabfc2119c8b34",
  measurementId: "G-FC16X2Z6HV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Set persistence to LOCAL to avoid too many auth requests
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

// Export initialized services
export { auth, db, storage };

// Export Firestore functions
export {
  doc,
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc
};
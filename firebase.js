import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { 
    getAuth, 
    signInAnonymously 
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { 
    getFirestore 
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyByksL_uNMUTngkzFA3kpOpIE2a2RirPC0",
  authDomain: "turnbackend.firebaseapp.com",
  projectId: "turnbackend",
  storageBucket: "turnbackend.firebasestorage.app",
  messagingSenderId: "1043001598269",
  appId: "1:1043001598269:web:f4c709ac9ab5cc5c776554",
  measurementId: "G-CF1SMHNB7C"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);


export async function login()
{
    if(!auth.currentUser)
    {
        await signInAnonymously(auth);
    }

    console.log("Logged in:", auth.currentUser.uid);
}

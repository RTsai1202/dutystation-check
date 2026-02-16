import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyAns07Sj4fQxJuUPXWt-iWsFTfkVcDVYFA",
    authDomain: "dutystation-check.firebaseapp.com",
    databaseURL: "https://dutystation-check-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "dutystation-check",
    storageBucket: "dutystation-check.firebasestorage.app",
    messagingSenderId: "862087163168",
    appId: "1:862087163168:web:d660c14c96b2043759fb45",
    measurementId: "G-EXP7H74X3X"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

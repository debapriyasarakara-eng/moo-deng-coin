// This file should contain your actual Firebase project configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyBRitTsyqXfk6XNh3t1j0boebQa1LNQkKs",
    authDomain: "moo-deng-coin.firebaseapp.com",
    projectId: "moo-deng-coin",
    storageBucket: "moo-deng-coin.firebasestorage.app",
    messagingSenderId: "629636349388",
    appId: "1:629636349388:web:a9a7924aaea9354a09f169",
    measurementId: "G-T7FVX8DW2Z"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);


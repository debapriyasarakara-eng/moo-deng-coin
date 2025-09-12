// Import Firebase SDK
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { app } from "./firebase-config.js";

const auth = getAuth(app);
const db = getFirestore(app);

const authContainer = document.getElementById('auth-container');
const miningContainer = document.getElementById('mining-container');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const mineBtn = document.getElementById('mine-btn');
const mineStatus = document.getElementById('mine-status');
const userEmail = document.getElementById('user-email');

// Signup
if (signupBtn) {
    signupBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                await setDoc(doc(db, "users", user.uid), {
                    email: email,
                    minedTokens: 0
                });
                console.log("User signed up!");
            })
            .catch(error => {
                console.error("Error signing up:", error.message);
            });
    });
}

// Login
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                console.log("Logged in!");
            })
            .catch(error => {
                console.error("Error logging in:", error.message);
            });
    });
}

// Auth state listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (authContainer && miningContainer) {
            authContainer.classList.add('hidden');
            miningContainer.classList.remove('hidden');
            userEmail.textContent = `Logged in as: ${user.email}`;
        }
    } else {
        if (authContainer && miningContainer) {
            authContainer.classList.remove('hidden');
            miningContainer.classList.add('hidden');
        }
    }
});

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            console.log("Logged out!");
        });
    });
}

// Mining simulation
if (mineBtn) {
    mineBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (user) {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                let currentTokens = userSnap.data().minedTokens || 0;
                currentTokens += 10;
                await setDoc(userRef, { minedTokens: currentTokens }, { merge: true });
                if (mineStatus) {
                    mineStatus.textContent = `You mined 10 tokens! Total: ${currentTokens}`;
                }
            }
        }
    });
}

// Import Firebase SDKs
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { app } from "./firebase-config.js";

const auth = getAuth(app);
const db = getFirestore(app);

// Get all the necessary DOM elements
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

// New elements for mining animation
const miningCoinWrapper = document.createElement('div');
miningCoinWrapper.className = 'mining-coin-wrapper';
const miningCoin = document.createElement('div');
miningCoin.className = 'mining-coin';
const miningTimerDisplay = document.createElement('div');
miningTimerDisplay.className = 'mining-timer';
const miningProgressRing = document.createElement('div');
miningProgressRing.className = 'mining-progress-ring';

miningCoinWrapper.appendChild(miningCoin);
miningCoinWrapper.appendChild(miningTimerDisplay);
miningCoinWrapper.appendChild(miningProgressRing);

// Insert the coin wrapper after the userEmail display in miningContainer
if (miningContainer && userEmail) {
    miningContainer.insertBefore(miningCoinWrapper, mineBtn);
}


let miningInterval;
let miningCooldown = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const MAX_MINES_PER_DAY = 5;

// Function to update timer display and progress ring
function updateTimerDisplay(remainingTime) {
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

    if (miningTimerDisplay) {
        miningTimerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Update progress ring
    const progress = (miningCooldown - remainingTime) / miningCooldown * 100;
    if (miningProgressRing) {
        miningProgressRing.style.setProperty('--progress', `${progress}%`);
    }
}

// Function to start the mining cooldown timer
async function startMiningCooldown(user) {
    if (!user) return;

    mineBtn.disabled = true;
    mineBtn.textContent = 'Mining Cooldown...';

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const lastMineTime = userSnap.exists() ? (userSnap.data().lastMineTime || 0) : 0;
    const todayMines = userSnap.exists() ? (userSnap.data().todayMines || 0) : 0;
    const now = Date.now();

    // Reset daily mine count if a new day has started
    const lastMineDate = new Date(lastMineTime);
    const currentDate = new Date(now);
    if (lastMineDate.getDate() !== currentDate.getDate() || lastMineDate.getMonth() !== currentDate.getMonth() || lastMineDate.getFullYear() !== currentDate.getFullYear()) {
        await setDoc(userRef, { todayMines: 0 }, { merge: true });
        todayMines = 0; // Reset for current session
    }

    if (todayMines >= MAX_MINES_PER_DAY) {
        if (mineStatus) mineStatus.textContent = `You have reached your daily mining limit (${MAX_MINES_PER_DAY}/${MAX_MINES_PER_DAY}).`;
        if (miningTimerDisplay) miningTimerDisplay.textContent = "DAILY LIMIT REACHED";
        if (miningProgressRing) miningProgressRing.style.setProperty('--progress', `100%`);
        return;
    }

    let remainingTime = miningCooldown - (now - lastMineTime);

    if (remainingTime <= 0) {
        // Cooldown finished, enable mining
        mineBtn.disabled = false;
        mineBtn.textContent = 'Start Mining';
        if (miningTimerDisplay) miningTimerDisplay.textContent = "READY!";
        if (miningProgressRing) miningProgressRing.style.setProperty('--progress', `100%`);
        clearInterval(miningInterval);
    } else {
        // Continue cooldown
        updateTimerDisplay(remainingTime);
        miningInterval = setInterval(() => {
            remainingTime -= 1000;
            if (remainingTime <= 0) {
                clearInterval(miningInterval);
                mineBtn.disabled = false;
                mineBtn.textContent = 'Start Mining';
                if (miningTimerDisplay) miningTimerDisplay.textContent = "READY!";
                if (miningProgressRing) miningProgressRing.style.setProperty('--progress', `100%`);
            } else {
                updateTimerDisplay(remainingTime);
            }
        }, 1000);
    }
}


// Check if all elements are present before adding event listeners
document.addEventListener('DOMContentLoaded', () => {

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
                        minedTokens: 0,
                        lastMineTime: 0,
                        todayMines: 0
                    });
                    console.log("User signed up successfully!");
                })
                .catch(error => {
                    console.error("Error signing up:", error.message);
                    alert("Error signing up: " + error.message);
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
                    console.log("Logged in successfully!");
                })
                .catch(error => {
                    console.error("Error logging in:", error.message);
                    alert("Error logging in: " + error.message);
                });
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                console.log("Logged out successfully!");
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
                
                let currentTokens = userSnap.exists() ? (userSnap.data().minedTokens || 0) : 0;
                let lastMineTime = userSnap.exists() ? (userSnap.data().lastMineTime || 0) : 0;
                let todayMines = userSnap.exists() ? (userSnap.data().todayMines || 0) : 0;
                const now = Date.now();

                // Reset daily mine count if a new day has started
                const lastMineDate = new Date(lastMineTime);
                const currentDate = new Date(now);
                if (lastMineDate.getDate() !== currentDate.getDate() || lastMineDate.getMonth() !== currentDate.getMonth() || lastMineDate.getFullYear() !== currentDate.getFullYear()) {
                    todayMines = 0;
                }

                if (todayMines < MAX_MINES_PER_DAY && (now - lastMineTime >= miningCooldown || lastMineTime === 0)) {
                    currentTokens += 10;
                    todayMines += 1;
                    await setDoc(userRef, { 
                        minedTokens: currentTokens,
                        lastMineTime: now,
                        todayMines: todayMines
                    }, { merge: true });
                    if (mineStatus) {
                        mineStatus.textContent = `You mined 10 tokens! Total: ${currentTokens}. Today's mines: ${todayMines}/${MAX_MINES_PER_DAY}`;
                    }
                    startMiningCooldown(user); // Restart cooldown after successful mine
                } else if (todayMines >= MAX_MINES_PER_DAY) {
                    if (mineStatus) mineStatus.textContent = `You have reached your daily mining limit (${MAX_MINES_PER_DAY}/${MAX_MINES_PER_DAY}).`;
                } else {
                    if (mineStatus) mineStatus.textContent = `Please wait for the cooldown to finish.`;
                }
            }
        });
    }
});

// Auth state listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in. Hide the auth container and show the mining container.
        if (authContainer) authContainer.classList.add('hidden');
        if (miningContainer) miningContainer.classList.remove('hidden');
        if (userEmail) userEmail.textContent = `Logged in as: ${user.email}`;
        startMiningCooldown(user); // Start cooldown check when user logs in
    } else {
        // User is signed out. Hide the mining container and show the auth container.
        if (authContainer) authContainer.classList.remove('hidden');
        if (miningContainer) miningContainer.classList.add('hidden');
        clearInterval(miningInterval); // Clear interval if user logs out
        if (mineBtn) {
            mineBtn.disabled = false;
            mineBtn.textContent = 'Start Mining';
        }
        if (miningTimerDisplay) miningTimerDisplay.textContent = "";
        if (miningProgressRing) miningProgressRing.style.setProperty('--progress', `0%`);
    }
});

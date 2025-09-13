import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
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

const sideMenu = document.getElementById('side-menu');
const closeBtn = document.querySelector('.close-btn');
const homeLink = document.getElementById('home-link');
const miningLink = document.getElementById('mining-link');
const walletLink = document.getElementById('wallet-link');
const historyLink = document.getElementById('history-link');
const referralLink = document.getElementById('referral-link');
const whitepaperLink = document.getElementById('whitepaper-link');

const pageTitle = document.getElementById('page-title');
const miningContent = document.getElementById('mining-content');
const walletContent = document.getElementById('wallet-content');
const historyContent = document.getElementById('history-content');
const referralContent = document.getElementById('referral-content');
const whitepaperContent = document.getElementById('whitepaper-content');

const walletBalance = document.getElementById('wallet-balance');
const historyList = document.getElementById('history-list');
const referralCodeDisplay = document.getElementById('referral-code');
const copyReferralBtn = document.getElementById('copy-referral-btn');
const userDisplayName = document.getElementById('user-display-name');

let miningInterval;
let miningCooldown = 2 * 60 * 60 * 1000;
const MAX_MINES_PER_DAY = 5;
const REWARD_PER_MINE = 10;
const REFERRAL_BONUS = 5;

// Function to open the sidebar
window.openNav = () => {
    if (sideMenu) sideMenu.style.width = "250px";
};

// Function to close the sidebar
const closeNav = () => {
    if (sideMenu) sideMenu.style.width = "0";
};

// Function to switch content pages
const showPage = (pageName) => {
    const allPages = [miningContent, walletContent, historyContent, referralContent, whitepaperContent];
    allPages.forEach(page => {
        if (page) page.classList.add('hidden');
    });

    let newTitle = "";
    let currentPage = null;

    if (pageName === 'mining') {
        currentPage = miningContent;
        newTitle = "Moo Deng Coin Mining";
    } else if (pageName === 'wallet') {
        currentPage = walletContent;
        newTitle = "Your Wallet";
        loadWalletData();
    } else if (pageName === 'history') {
        currentPage = historyContent;
        newTitle = "Transaction History";
        loadHistoryData();
    } else if (pageName === 'referral') {
        currentPage = referralContent;
        newTitle = "Refer and Earn";
        loadReferralData();
    } else if (pageName === 'whitepaper') {
        currentPage = whitepaperContent;
        newTitle = "Whitepaper";
    } else if (pageName === 'home') {
        currentPage = miningContent;
        newTitle = "Moo Deng Coin Mining";
    }

    if (currentPage) {
        currentPage.classList.remove('hidden');
    }
    if (pageTitle) {
        pageTitle.textContent = `Welcome to ${newTitle}`;
    }
    closeNav();
};

// Load Wallet Data
const loadWalletData = async () => {
    const user = auth.currentUser;
    if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data();
            if (walletBalance) {
                walletBalance.textContent = data.minedTokens || 0;
            }
        }
    }
};

// Load History Data
const loadHistoryData = async () => {
    const user = auth.currentUser;
    if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data();
            const history = data.history || [];
            if (historyList) {
                historyList.innerHTML = '';
                history.sort((a, b) => b.timestamp - a.timestamp);
                history.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = `Mined ${item.amount} tokens on ${new Date(item.timestamp).toLocaleString()}`;
                    historyList.appendChild(li);
                });
            }
        }
    }
};

// Load Referral Data
const loadReferralData = () => {
    const user = auth.currentUser;
    if (user && referralCodeDisplay) {
        const referralCode = user.uid.substring(0, 8).toUpperCase();
        referralCodeDisplay.textContent = referralCode;
    }
};

// Copy Referral Code
if (copyReferralBtn) {
    copyReferralBtn.addEventListener('click', () => {
        const code = referralCodeDisplay.textContent;
        navigator.clipboard.writeText(code).then(() => {
            alert("Referral code copied!");
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    });
}

// Function to update timer display and progress ring
function updateTimerDisplay(remainingTime) {
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

    const miningTimerDisplay = document.querySelector('.mining-timer');
    if (miningTimerDisplay) {
        miningTimerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    const progress = (miningCooldown - remainingTime) / miningCooldown * 100;
    const miningProgressRing = document.querySelector('.mining-progress-ring');
    if (miningProgressRing) {
        miningProgressRing.style.setProperty('--progress', `${progress}%`);
    }
}

// Function to start the mining cooldown timer
async function startMiningCooldown(user) {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const lastMineTime = userSnap.exists() ? (userSnap.data().lastMineTime || 0) : 0;
    const now = Date.now();
    let remainingTime = miningCooldown - (now - lastMineTime);

    // Initial check for daily limit
    const todayMines = userSnap.exists() ? (userSnap.data().todayMines || 0) : 0;
    if (todayMines >= MAX_MINES_PER_DAY) {
        if (mineBtn) {
            mineBtn.disabled = true;
            mineBtn.textContent = 'Daily Limit Reached';
        }
        if (mineStatus) mineStatus.textContent = `You have reached your daily mining limit (${todayMines}/${MAX_MINES_PER_DAY}).`;
        if (document.querySelector('.mining-timer')) document.querySelector('.mining-timer').textContent = "LIMIT REACHED";
        if (document.querySelector('.mining-progress-ring')) document.querySelector('.mining-progress-ring').style.setProperty('--progress', `100%`);
        return;
    }

    if (remainingTime <= 0) {
        if (mineBtn) {
            mineBtn.disabled = false;
            mineBtn.textContent = 'Start Mining';
        }
        if (mineStatus) mineStatus.textContent = `Ready to mine! You have mined ${todayMines} out of ${MAX_MINES_PER_DAY} times today.`;
        if (document.querySelector('.mining-timer')) document.querySelector('.mining-timer').textContent = "READY!";
        if (document.querySelector('.mining-progress-ring')) document.querySelector('.mining-progress-ring').style.setProperty('--progress', `100%`);
        clearInterval(miningInterval);
    } else {
        if (mineBtn) {
            mineBtn.disabled = true;
            mineBtn.textContent = 'Mining Cooldown...';
        }
        updateTimerDisplay(remainingTime);
        miningInterval = setInterval(() => {
            remainingTime -= 1000;
            if (remainingTime <= 0) {
                clearInterval(miningInterval);
                if (mineBtn) {
                    mineBtn.disabled = false;
                    mineBtn.textContent = 'Start Mining';
                }
                if (mineStatus) mineStatus.textContent = `Ready to mine! You have mined ${todayMines} out of ${MAX_MINES_PER_DAY} times today.`;
                if (document.querySelector('.mining-timer')) document.querySelector('.mining-timer').textContent = "READY!";
                if (document.querySelector('.mining-progress-ring')) document.querySelector('.mining-progress-ring').style.setProperty('--progress', `100%`);
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
                        todayMines: 0,
                        history: []
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

    // Add event listeners for the menu links
    if (closeBtn) closeBtn.addEventListener('click', closeNav);
    if (homeLink) homeLink.addEventListener('click', () => showPage('home'));
    if (miningLink) miningLink.addEventListener('click', () => showPage('mining'));
    if (walletLink) walletLink.addEventListener('click', () => showPage('wallet'));
    if (historyLink) historyLink.addEventListener('click', () => showPage('history'));
    if (referralLink) referralLink.addEventListener('click', () => showPage('referral'));
    if (whitepaperLink) whitepaperLink.addEventListener('click', () => showPage('whitepaper'));

    // Mining simulation (updated)
    if (mineBtn) {
        mineBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                
                let currentTokens = userSnap.exists() ? (userSnap.data().minedTokens || 0) : 0;
                let lastMineTime = userSnap.exists() ? (userSnap.data().lastMineTime || 0) : 0;
                let todayMines = userSnap.exists() ? (userSnap.data().todayMines || 0) : 0;
                const history = userSnap.exists() ? (userSnap.data().history || []) : [];
                const now = Date.now();

                const lastMineDate = new Date(lastMineTime);
                const currentDate = new Date(now);
                if (lastMineDate.getDate() !== currentDate.getDate() || lastMineDate.getMonth() !== currentDate.getMonth() || lastMineDate.getFullYear() !== currentDate.getFullYear()) {
                    todayMines = 0;
                }

                if (todayMines < MAX_MINES_PER_DAY && (now - lastMineTime >= miningCooldown || lastMineTime === 0)) {
                    currentTokens += REWARD_PER_MINE;
                    todayMines += 1;
                    
                    const newHistoryEntry = { amount: REWARD_PER_MINE, timestamp: now };
                    history.push(newHistoryEntry);
                    
                    await updateDoc(userRef, { 
                        minedTokens: currentTokens,
                        lastMineTime: now,
                        todayMines: todayMines,
                        history: history
                    });
                    if (mineStatus) {
                        mineStatus.textContent = `You mined ${REWARD_PER_MINE} tokens! Total: ${currentTokens}. Today's mines: ${todayMines}/${MAX_MINES_PER_DAY}`;
                    }
                    startMiningCooldown(user);
                } else if (todayMines >= MAX_MINES_PER_DAY) {
                    if (mineStatus) mineStatus.textContent = `You have reached your daily mining limit (${MAX_MINES_PER_DAY}/${MAX_MINES_PER_DAY}).`;
                } else {
                    if (mineStatus) mineStatus.textContent = `Please wait for the cooldown to finish.`;
                }
            }
        });
    }
    
    // Create the mining animation elements
    const miningCoinContainer = document.getElementById('mining-coin-container');
    if (miningCoinContainer) {
        const miningCoin = document.createElement('div');
        miningCoin.className = 'mining-coin';
        const miningTimerDisplay = document.createElement('div');
        miningTimerDisplay.className = 'mining-timer';
        const miningProgressRing = document.createElement('div');
        miningProgressRing.className = 'mining-progress-ring';
        miningCoinContainer.appendChild(miningCoin);
        miningCoinContainer.appendChild(miningTimerDisplay);
        miningCoinContainer.appendChild(miningProgressRing);
    }
});

// Auth state listener
onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (authContainer) authContainer.classList.add('hidden');
        if (miningContainer) miningContainer.classList.remove('hidden');
        if (userEmail) userEmail.textContent = `Logged in as: ${user.email}`;
        
        if (userDisplayName) {
            userDisplayName.textContent = user.displayName || user.email;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
             await setDoc(userRef, {
                email: user.email,
                minedTokens: 0,
                lastMineTime: 0,
                todayMines: 0,
                history: []
            });
        }
        
        const now = Date.now();
        const lastMineDate = new Date(userSnap.data().lastMineTime || 0);
        const currentDate = new Date(now);

        if (lastMineDate.getDate() !== currentDate.getDate() || lastMineDate.getMonth() !== currentDate.getMonth() || lastMineDate.getFullYear() !== currentDate.getFullYear()) {
            await updateDoc(userRef, { todayMines: 0 });
        }
        
        startMiningCooldown(user);
    } else {
        if (authContainer) authContainer.classList.remove('hidden');
        if (miningContainer) miningContainer.classList.add('hidden');
        clearInterval(miningInterval);
        if (mineBtn) {
            mineBtn.disabled = false;
            mineBtn.textContent = 'Start Mining';
        }
    }
});

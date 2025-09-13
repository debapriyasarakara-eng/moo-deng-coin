import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { app } from "./firebase-config.js";

const auth = getAuth(app);
const db = getFirestore(app);

const authContainer = document.getElementById('auth-container');
const mainContent = document.getElementById('main-content');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn-main'); // Changed to match new HTML
const userEmail = document.getElementById('user-email');
const pageTitle = document.getElementById('page-title');

const sideMenu = document.getElementById('side-menu');
const closeBtn = document.querySelector('.close-btn');
const homeLink = document.getElementById('home-link');
const miningLink = document.getElementById('mining-link');
const walletLink = document.getElementById('wallet-link');
const historyLink = document.getElementById('history-link');
const referralLink = document.getElementById('referral-link');
const whitepaperLink = document.getElementById('whitepaper-link');
const miningContent = document.getElementById('mining-content');
const walletContent = document.getElementById('wallet-content');
const historyContent = document.getElementById('history-content');
const referralContent = document.getElementById('referral-content');
const whitepaperContent = document.getElementById('whitepaper-content');
const mineBtn = document.getElementById('mine-btn');
const mineStatus = document.getElementById('mine-status');
const walletBalance = document.getElementById('wallet-balance');
const historyList = document.getElementById('history-list');
const referralCodeDisplay = document.getElementById('referral-code-display');
const copyReferralBtn = document.getElementById('copy-referral-btn');
const referralLinkDisplay = document.getElementById('referral-link-display');
const userDisplayName = document.getElementById('user-display-name');

let miningInterval;
const MINING_COOLDOWN = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const MAX_MINES_PER_DAY = 5;
const REWARD_PER_MINE = 10;
const REFERRAL_REWARD = 1;
const REFERRAL_PERCENTAGE = 0.02; // 2%
const REFERRAL_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

window.openNav = () => {
    if (sideMenu) sideMenu.style.width = "250px";
};

const closeNav = () => {
    if (sideMenu) sideMenu.style.width = "0";
};

const showPage = (pageName) => {
    const allPages = [miningContent, walletContent, historyContent, referralContent, whitepaperContent];
    allPages.forEach(page => {
        if (page) page.classList.add('hidden');
    });

    let newTitle = "Welcome to Moo Deng Coin Mining";
    let currentPage = miningContent;

    switch(pageName) {
        case 'home':
        case 'mining':
            currentPage = miningContent;
            break;
        case 'wallet':
            currentPage = walletContent;
            newTitle = "Your Wallet";
            loadWalletData();
            break;
        case 'history':
            currentPage = historyContent;
            newTitle = "Transaction History";
            loadHistoryData();
            break;
        case 'referral':
            currentPage = referralContent;
            newTitle = "Refer and Earn";
            loadReferralData();
            break;
        case 'whitepaper':
            currentPage = whitepaperContent;
            newTitle = "Whitepaper";
            break;
    }

    if (currentPage) {
        currentPage.classList.remove('hidden');
    }
    if (pageTitle) {
        pageTitle.textContent = newTitle;
    }
    closeNav();
};

const loadWalletData = async () => {
    const user = auth.currentUser;
    if (user) {
        const userRef = doc(db, "users", user.uid);
        try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const data = userSnap.data();
                if (walletBalance) {
                    walletBalance.textContent = data.minedTokens || 0;
                }
            }
        } catch (error) {
            alert("Error loading wallet data: " + error.message);
            console.error(error);
        }
    }
};

const loadHistoryData = async () => {
    const user = auth.currentUser;
    if (user) {
        const userRef = doc(db, "users", user.uid);
        try {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const data = userSnap.data();
                const history = data.history || [];
                if (historyList) {
                    historyList.innerHTML = '';
                    history.sort((a, b) => b.timestamp - a.timestamp);
                    history.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = `${item.type}: ${item.amount} tokens on ${new Date(item.timestamp).toLocaleString()}`;
                        historyList.appendChild(li);
                    });
                }
            }
        } catch (error) {
            alert("Error loading history data: " + error.message);
            console.error(error);
        }
    }
};

const loadReferralData = () => {
    const user = auth.currentUser;
    if (user && referralCodeDisplay && referralLinkDisplay) {
        const referralCode = user.uid.substring(0, 8).toUpperCase();
        referralCodeDisplay.textContent = referralCode;
        referralLinkDisplay.textContent = `https://debapriyasarakara-eng.github.io/moo-deng-coin/index.html?ref=${referralCode}`;
    }
};

if (copyReferralBtn) {
    copyReferralBtn.addEventListener('click', () => {
        const code = referralCodeDisplay.textContent;
        navigator.clipboard.writeText(code).then(() => {
            alert("Referral code copied!");
        }).catch(err => {
            alert("Failed to copy text: " + err);
        });
    });
}

const checkReferral = async (newUser) => {
    const urlParams = new URLSearchParams(window.location.search);
    const referrerCode = urlParams.get('ref');

    if (referrerCode) {
        const usersRef = doc(db, 'users', referrerCode);
        try {
            const referrerSnap = await getDoc(usersRef);
            if (referrerSnap.exists()) {
                const referrerData = referrerSnap.data();
                const referrerTokens = referrerData.minedTokens || 0;
                const referrerHistory = referrerData.history || [];

                const newReferrerHistory = {
                    type: "Referral Bonus",
                    amount: REFERRAL_REWARD,
                    timestamp: Date.now()
                };

                const updatedHistory = [...referrerHistory, newReferrerHistory];
                const updatedTokens = referrerTokens + REFERRAL_REWARD;

                await updateDoc(usersRef, {
                    minedTokens: updatedTokens,
                    history: updatedHistory
                });

                await updateDoc(doc(db, "users", newUser.uid), {
                    referrerId: referrerCode,
                    referralStart: Date.now()
                });

                alert(`You were referred! Referrer (${referrerCode}) received a bonus.`);
            }
        } catch (error) {
            alert("Error checking referral: " + error.message);
            console.error(error);
        }
    }
};

function updateTimerDisplay(remainingTime) {
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

    const miningTimerDisplay = document.querySelector('.mining-timer');
    if (miningTimerDisplay) {
        miningTimerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    const progress = (MINING_COOLDOWN - remainingTime) / MINING_COOLDOWN * 100;
    const miningProgressRing = document.querySelector('.mining-progress-ring');
    if (miningProgressRing) {
        miningProgressRing.style.setProperty('--progress', `${progress}%`);
    }
}

async function startMiningCooldown(user) {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    try {
        const userSnap = await getDoc(userRef);
        const lastMineTime = userSnap.exists() ? (userSnap.data().lastMineTime || 0) : 0;
        const now = Date.now();
        let remainingTime = MINING_COOLDOWN - (now - lastMineTime);

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
    } catch (error) {
        alert("Error during cooldown check: " + error.message);
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            createUserWithEmailAndPassword(auth, email, password)
                .then(async (userCredential) => {
                    const user = userCredential.user;
                    try {
                        await setDoc(doc(db, "users", user.uid), {
                            email: email,
                            minedTokens: 0,
                            lastMineTime: 0,
                            todayMines: 0,
                            history: [],
                            referralStart: null,
                            referrerId: null
                        });
                        alert("Sign up successful! Please log in.");
                        checkReferral(user);
                    } catch (error) {
                        alert("Error creating user data: " + error.message);
                        console.error(error);
                    }
                })
                .catch(error => {
                    alert("Error signing up: " + error.message);
                    console.error(error);
                });
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            signInWithEmailAndPassword(auth, email, password)
                .then(() => {
                    alert("Login successful!");
                })
                .catch(error => {
                    alert("Error logging in: " + error.message);
                    console.error(error);
                });
        });
    }
    
    // Updated Logout button listener
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                alert("Logged out successfully!");
            }).catch(error => {
                alert("Error logging out: " + error.message);
                console.error(error);
            });
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeNav);
    if (homeLink) homeLink.addEventListener('click', () => showPage('home'));
    if (miningLink) miningLink.addEventListener('click', () => showPage('mining'));
    if (walletLink) walletLink.addEventListener('click', () => showPage('wallet'));
    if (historyLink) historyLink.addEventListener('click', () => showPage('history'));
    if (referralLink) referralLink.addEventListener('click', () => showPage('referral'));
    if (whitepaperLink) whitepaperLink.addEventListener('click', () => showPage('whitepaper'));

    if (mineBtn) {
        mineBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (user) {
                const userRef = doc(db, "users", user.uid);
                try {
                    const userSnap = await getDoc(userRef);
                    
                    let currentTokens = userSnap.exists() ? (userSnap.data().minedTokens || 0) : 0;
                    let lastMineTime = userSnap.exists() ? (userSnap.data().lastMineTime || 0) : 0;
                    let todayMines = userSnap.exists() ? (userSnap.data().todayMines || 0) : 0;
                    const history = userSnap.exists() ? (userSnap.data().history || []) : [];
                    const referrerId = userSnap.exists() ? userSnap.data().referrerId : null;
                    const referralStart = userSnap.exists() ? userSnap.data().referralStart : null;
                    const now = Date.now();

                    const lastMineDate = new Date(lastMineTime);
                    const currentDate = new Date(now);
                    if (lastMineDate.getDate() !== currentDate.getDate() || lastMineDate.getMonth() !== currentDate.getMonth() || lastMineDate.getFullYear() !== currentDate.getFullYear()) {
                        todayMines = 0;
                    }

                    if (todayMines < MAX_MINES_PER_DAY && (now - lastMineTime >= MINING_COOLDOWN || lastMineTime === 0)) {
                        currentTokens += REWARD_PER_MINE;
                        todayMines += 1;
                        
                        const newHistoryEntry = { type: "Mine", amount: REWARD_PER_MINE, timestamp: now };
                        history.push(newHistoryEntry);
                        
                        // Check for referral bonus
                        if (referrerId && referralStart && (now - referralStart <= REFERRAL_WEEK_MS)) {
                            const referrerRef = doc(db, "users", referrerId);
                            const referrerSnap = await getDoc(referrerRef);
                            if (referrerSnap.exists()) {
                                const referrerData = referrerSnap.data();
                                const referrerTokens = referrerData.minedTokens || 0;
                                const referrerHistory = referrerData.history || [];
                                const bonusAmount = REWARD_PER_MINE * REFERRAL_PERCENTAGE;
                                const updatedReferrerTokens = referrerTokens + bonusAmount;
                                
                                const newReferrerHistoryEntry = {
                                    type: "Referral Bonus (2%)",
                                    amount: bonusAmount,
                                    timestamp: now
                                };
                                const updatedReferrerHistory = [...referrerHistory, newReferrerHistoryEntry];

                                await updateDoc(referrerRef, {
                                    minedTokens: updatedReferrerTokens,
                                    history: updatedReferrerHistory
                                });
                            }
                        }

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
                } catch (error) {
                    alert("Error during mining process: " + error.message);
                    console.error(error);
                }
            }
        });
    }

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

onAuthStateChanged(auth, async (user) => {
    try {
        if (user) {
            if (authContainer) authContainer.classList.add('hidden');
            if (mainContent) mainContent.classList.remove('hidden');
            if (userEmail) userEmail.textContent = `Logged in as: ${user.email}`;
            
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
                 await setDoc(userRef, {
                    email: user.email,
                    minedTokens: 0,
                    lastMineTime: 0,
                    todayMines: 0,
                    history: [],
                    referralStart: null,
                    referrerId: null
                });
            }
            
            const now = Date.now();
            const lastMineDate = new Date(userSnap.data().lastMineTime || 0);
            const currentDate = new Date(now);

            if (lastMineDate.getDate() !== currentDate.getDate() || lastMineDate.getMonth() !== currentDate.getMonth() || lastMineDate.getFullYear() !== currentDate.getFullYear()) {
                await updateDoc(userRef, { todayMines: 0 });
            }
            
            startMiningCooldown(user);
            showPage('mining');
        } else {
            if (authContainer) authContainer.classList.remove('hidden');
            if (mainContent) mainContent.classList.add('hidden');
            clearInterval(miningInterval);
            if (mineBtn) {
                mineBtn.disabled = false;
                mineBtn.textContent = 'Start Mining';
            }
            showPage('home'); // Ensure auth page is shown on logout
        }
    } catch (error) {
        alert("An error occurred: " + error.message);
        console.error(error);
    }
});

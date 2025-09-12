import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { app } from "./firebase-config.js";

const db = getFirestore(app);

const joinBtn = document.getElementById("join-btn");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const message = document.getElementById("message");

if (joinBtn) {
    joinBtn.addEventListener("click", async () => {
        const name = nameInput.value;
        const email = emailInput.value;

        try {
            await addDoc(collection(db, "waitlist"), { name, email, timestamp: Date.now() });
            message.innerText = "You are now on the waitlist!";
            nameInput.value = "";
            emailInput.value = "";
        } catch (e) {
            message.innerText = "Error joining waitlist: " + e.message;
        }
    });
}

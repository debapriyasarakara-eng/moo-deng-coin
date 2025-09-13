import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { app } from "./firebase-config.js";

const db = getFirestore(app);

const joinBtn = document.getElementById("join-btn");
if (joinBtn) {
    joinBtn.addEventListener("click", async () => {
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const message = document.getElementById("message");

        try {
            await addDoc(collection(db, "waitlist"), { name, email, timestamp: Date.now() });
            message.innerText = "You are now on the waitlist!";
        } catch (e) {
            message.innerText = "Error joining waitlist: " + e.message;
            alert("Error joining waitlist: " + e.message);
            console.error(e);
        }
    });
}

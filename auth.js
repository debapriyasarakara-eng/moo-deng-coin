import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { app } from "./firebase-config.js";

const auth = getAuth(app);

const loginBtn = document.getElementById("login-btn");
if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                alert("Logged in!");
                window.location.href = "wallet.html";
            })
            .catch((error) => {
                alert("Login failed: " + error.message);
            });
    });
}

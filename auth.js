//---------------- IMPORTS ----------------//
import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, setDoc, getDoc }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


//---------------- PASSWORD TOGGLE FUNCTION ----------------//
function setupPasswordToggle(passwordInputId, toggleIconId) {
  const passwordInput = document.getElementById(passwordInputId);
  const toggleIcon = document.getElementById(toggleIconId);

  if (!passwordInput || !toggleIcon) return;

  toggleIcon.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      toggleIcon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
      passwordInput.type = "password";
      toggleIcon.classList.replace("fa-eye-slash", "fa-eye");
    }
  });
}


setupPasswordToggle("signupPassword", "toggleSignup");
setupPasswordToggle("loginPassword", "togglePassword");


// ---------------- SIGNUP ----------------//
const signupForm = document.getElementById("signupForm");

if (signupForm) {

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("signupPassword").value;

    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        isAdmin: false
      });

      alert("Account created successfully!");
      window.location.href = "login.html";

    } 
    
    catch (error) {
      alert(error.message);
    }
  });
}


// ---------------- LOGIN ----------------//
const loginForm = document.getElementById("loginForm");

if (loginForm) {

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists() && userDoc.data().isAdmin) {
        window.location.href = "admin.html";
      } else {
        window.location.href = "index.html";
      }

    } catch (error) {
      alert(error.message);
    }
  });
}

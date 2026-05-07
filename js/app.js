/* app.js — shared helpers + Firebase */
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

(function () {
  "use strict";

  // --------------------------------------------------------------
  // Firebase Config
  // --------------------------------------------------------------
  const firebaseConfig = {
    apiKey: "AIzaSyAt6xD_cMCRk5DVCWA90Xz1lFVyI6Fo2CI",
    authDomain: "mind-in-ease.firebaseapp.com",
    projectId: "mind-in-ease",
    storageBucket: "mind-in-ease.firebasestorage.app",
    messagingSenderId: "87088655577",
    appId: "1:87088655577:web:5bc730a7f7548d491d62c8",
    measurementId: "G-8JNW80KLR6"
  };

  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: "select_account"
  });
  let currentUser = null;

  // --------------------------------------------------------------
  // Theme toggle
  // --------------------------------------------------------------
  const THEME_KEY = "mae-theme";

  function getTheme() {
    return (
      localStorage.getItem(THEME_KEY) ||
      (window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light")
    );
  }

  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(THEME_KEY, t);

    const btn = document.querySelector("[data-theme-toggle]");
    if (btn) {
      btn.innerHTML = t === "dark" ? sunIcon() : moonIcon();
    }
  }

  function toggleTheme() {
    applyTheme(getTheme() === "dark" ? "light" : "dark");
  }

  function sunIcon() {
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41
        M17.66 17.66l1.41 1.41M2 12h2M20 12h2
        M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
      </svg>`;
  }

  function moonIcon() {
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3
        7 7 0 0 0 21 12.79z"/>
      </svg>`;
  }

  // --------------------------------------------------------------
  // Anonymous client_id
  // --------------------------------------------------------------
  const CLIENT_KEY = "mae-client-id";

  function getClientId() {
    let id = localStorage.getItem(CLIENT_KEY);

    if (!id) {
      id =
        "c-" +
        (crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now());

      localStorage.setItem(CLIENT_KEY, id);
    }

    return id;
  }

  function getOwnerData() {
    if (currentUser) {
      return {
        user_id: currentUser.uid,
        user_email: currentUser.email || null
      };
    }

    return {
      client_id: getClientId()
    };
  }

  function ownerQuery(collectionName) {
    if (currentUser) {
      return query(
        collection(db, collectionName),
        where("user_id", "==", currentUser.uid)
      );
    }

    return query(
      collection(db, collectionName),
      where("client_id", "==", getClientId())
    );
  }

  // --------------------------------------------------------------
  // Firebase API
  // --------------------------------------------------------------
  function newestFirst(entries) {
    return entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  function docsToData(snapshot) {
    return snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  }

  const api = {
    // ---------------- Auth ----------------

    async signUp(email, password) {
      return await createUserWithEmailAndPassword(auth, email, password);
    },

    async signIn(email, password) {
      return await signInWithEmailAndPassword(auth, email, password);
    },

    async signInWithGoogle() {
      return await signInWithPopup(auth, googleProvider);
    },

    async signInAsGuest() {
      return await signInAnonymously(auth);
    },

    async sendMagicLink(email) {
      const actionCodeSettings = {
        url: window.location.origin + "/index.html",
        handleCodeInApp: true
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);

      localStorage.setItem("emailForSignIn", email);
    },

    async completeMagicLinkLogin() {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = localStorage.getItem("emailForSignIn");

        if (!email) {
          email = prompt("Confirm your email");
        }

        await signInWithEmailLink(auth, email, window.location.href);

        localStorage.removeItem("emailForSignIn");
      }
    },

    async signOut() {
      return await signOut(auth);
    },

    getCurrentUser() {
      return currentUser;
    },

    // ---------------- Mood ----------------

    async saveMood(data) {
      return await addDoc(collection(db, "moods"), {
        ...data,
        ...getOwnerData(),
        created_at: new Date().toISOString()
      });
    },

    async moodHistory(limitCount = 30) {
      const q = ownerQuery("moods");

      const snapshot = await getDocs(q);

      return newestFirst(docsToData(snapshot)).slice(0, limitCount);
    },

    async moodStats() {
      const history = await this.moodHistory(100);

      const total = history.length;

      const last7 = history.filter(entry => {
        const d = new Date(entry.created_at);

        return (
          Date.now() - d.getTime() <
          7 * 24 * 60 * 60 * 1000
        );
      }).length;

      const counts = {};

      history.forEach(entry => {
        counts[entry.mood] = (counts[entry.mood] || 0) + 1;
      });

      let mostCommon = null;
      let max = 0;

      for (const mood in counts) {
        if (counts[mood] > max) {
          max = counts[mood];
          mostCommon = mood;
        }
      }

      return {
        total,
        last7,
        mostCommon
      };
    },

    async deleteMood(id) {
      await deleteDoc(doc(db, "moods", id));
    },

    // ---------------- Journal ----------------

    async saveJournal(data) {
      return await addDoc(collection(db, "journal"), {
        ...data,
        ...getOwnerData(),
        created_at: new Date().toISOString()
      });
    },

    async listJournal(limitCount = 50) {
      const q = ownerQuery("journal");

      const snapshot = await getDocs(q);

      return newestFirst(docsToData(snapshot)).slice(0, limitCount);
    },

    async deleteJournal(id) {
      await deleteDoc(doc(db, "journal", id));
    },

    // ---------------- Quiz ----------------

    async saveQuiz(data) {
      return await addDoc(collection(db, "quiz"), {
        ...data,
        ...getOwnerData(),
        created_at: new Date().toISOString()
      });
    },

    async quizHistory(limitCount = 20) {
      const q = ownerQuery("quiz");

      const snapshot = await getDocs(q);

      return newestFirst(docsToData(snapshot)).slice(0, limitCount);
    }
  };

  // --------------------------------------------------------------
  // Navigation
  // --------------------------------------------------------------
  const NAV_LINKS = [
    { href: "/index.html", label: "Home", key: "home" },
    { href: "/stress.html", label: "Stress & Anxiety", key: "stress" },
    { href: "/study.html", label: "Study Tips", key: "study" },
    { href: "/mood.html", label: "Mood", key: "mood" },
    { href: "/journal.html", label: "Journal", key: "journal" },
    { href: "/quiz.html", label: "Quiz", key: "quiz" },
    { href: "/resources.html", label: "Resources", key: "resources" },
    { href: "/about.html", label: "About", key: "about" }
  ];

  function renderHeader() {
    const header = document.querySelector("[data-header]");
    if (!header) return;

    const active = header.getAttribute("data-active") || "";

    const links = NAV_LINKS.map(
      l =>
        `<li>
          <a href="${l.href}"
          class="${l.key === active ? "active" : ""}">
          ${l.label}
          </a>
        </li>`
    ).join("");

    header.innerHTML = `
      <div class="container">
        <nav class="nav">
          <a href="/index.html" class="brand">
            <span class="brand-dot"></span>
            Mind at Ease
          </a>

          <ul class="nav-links" data-nav-links>
            ${links}
          </ul>

          <div class="nav-right">
            <span class="auth-status" data-auth-status>
              Guest
            </span>

            <button class="btn btn-ghost btn-sm"
              data-auth-open
              type="button">
              Sign in
            </button>

            <button class="btn btn-ghost btn-sm hidden"
              data-auth-signout
              type="button">
              Sign out
            </button>

            <button class="theme-toggle"
              data-theme-toggle
              aria-label="Toggle theme">
            </button>

            <button class="menu-btn"
              data-menu-toggle
              aria-label="Menu">
              ☰
            </button>
          </div>
        </nav>
      </div>
    `;

    const toggle = header.querySelector("[data-theme-toggle]");
    if (toggle) {
      toggle.addEventListener("click", toggleTheme);
    }

    const menu = header.querySelector("[data-menu-toggle]");
    const navLinks = header.querySelector("[data-nav-links]");

    if (menu && navLinks) {
      menu.addEventListener("click", () => {
        navLinks.classList.toggle("open");
      });
    }

    setupAuthControls();
    updateAuthUI();
  }

  // --------------------------------------------------------------
  // Auth UI
  // --------------------------------------------------------------
  function renderAuthModal() {
    if (document.querySelector("[data-auth-modal]")) return;

    const modal = document.createElement("div");
    modal.className = "auth-modal hidden";
    modal.setAttribute("data-auth-modal", "");
    modal.innerHTML = `
      <div class="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="authTitle">
        <button class="auth-close" type="button" data-auth-close aria-label="Close">×</button>
        <h2 id="authTitle">Sign in</h2>
        <p class="muted">Use an account to keep your mood, journal, and quiz results separate from other people.</p>

        <form data-auth-form>
          <div class="auth-fields">
            <div class="field">
            <label for="authEmail">Email</label>
            <input id="authEmail" type="email" autocomplete="email">
            </div>

            <div class="field">
            <label for="authPassword">Password</label>
            <input id="authPassword" type="password" autocomplete="current-password" minlength="6">
            </div>
          </div>

          <div class="auth-actions">
            <button class="btn btn-primary"
              type="button"
              data-email-signin>
              Sign in
            </button>

            <button class="btn btn-ghost"
              type="button"
              data-email-signup>
              Create account
            </button>
          </div>

          <div class="auth-divider">or</div>

          <button class="btn btn-ghost"
            type="button"
            data-google-login>
            <span class="auth-provider-mark">G</span>
            Continue with Google
          </button>

          <button class="btn btn-ghost"
            type="button"
            data-guest-login>
            Continue as Guest
          </button>

          <button class="btn btn-ghost"
            type="button"
            data-magic-link>
            Send Magic Link
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
  }

  function setupAuthControls() {
    renderAuthModal();

    const open = document.querySelector("[data-auth-open]");
    const signOutBtn = document.querySelector("[data-auth-signout]");
    const modal = document.querySelector("[data-auth-modal]");
    const close = document.querySelector("[data-auth-close]");
    const form = document.querySelector("[data-auth-form]");
    const emailSignInBtn = document.querySelector("[data-email-signin]");
    const emailSignUpBtn = document.querySelector("[data-email-signup]");
    const googleBtn = document.querySelector("[data-google-login]");
    const guestBtn = document.querySelector("[data-guest-login]");
    const magicBtn = document.querySelector("[data-magic-link]");

    if (open) {
      open.addEventListener("click", () => {
        modal.classList.remove("hidden");
      });
    }

    if (close) {
      close.addEventListener("click", () => {
        modal.classList.add("hidden");
      });
    }

    if (modal) {
      modal.addEventListener("click", event => {
        if (event.target === modal) modal.classList.add("hidden");
      });
    }

    if (signOutBtn) {
      signOutBtn.addEventListener("click", async () => {
        try {
          await api.signOut();
          toast("Signed out", 1600);
        } catch (err) {
          console.error(err);
          toast("Could not sign out. Try again.", 2600);
        }
      });
    }

    if (googleBtn) {
      googleBtn.addEventListener("click", async () => {
        try {
          await api.signInWithGoogle();
          modal.classList.add("hidden");
          toast("Signed in with Google", 1800);
        } catch (err) {
          console.error(err);
          toast(authErrorMessage(err), 3400);
        }
      });
    }

    if (guestBtn) {
      guestBtn.addEventListener("click", async () => {
        try {
          await api.signInAsGuest();
          modal.classList.add("hidden");
          toast("Guest mode enabled", 1800);
        } catch (err) {
          console.error(err);
          toast("Guest login failed", 3000);
        }
      });
    }

    if (magicBtn) {
      magicBtn.addEventListener("click", async () => {
        const email = form.querySelector("#authEmail").value.trim();

        if (!email) {
          toast("Enter your email first", 2200);
          return;
        }

        try {
          await api.sendMagicLink(email);
          toast("Magic link sent to your email", 3000);
        } catch (err) {
          console.error(err);
          toast("Could not send magic link", 3000);
        }
      });
    }

    if (emailSignInBtn) {
      emailSignInBtn.addEventListener("click", () => {
        handleEmailAuth("signin");
      });
    }

    if (emailSignUpBtn) {
      emailSignUpBtn.addEventListener("click", () => {
        handleEmailAuth("signup");
      });
    }

    if (form) {
      form.addEventListener("submit", event => {
        event.preventDefault();
        handleEmailAuth("signin");
      });
    }

    async function handleEmailAuth(mode) {
      const email = form.querySelector("#authEmail").value.trim();
      const password = form.querySelector("#authPassword").value;

      if (!email) {
        toast("Enter your email first", 2200);
        return;
      }

      if (!password) {
        toast("Enter your password first", 2200);
        return;
      }

      try {
        if (mode === "signup") {
          await api.signUp(email, password);
          toast("Account created", 1800);
        } else {
          await api.signIn(email, password);
          toast("Signed in", 1800);
        }

        modal.classList.add("hidden");
        form.reset();
      } catch (err) {
        console.error(err);
        toast(authErrorMessage(err), 3200);
      }
    }
  }

  function updateAuthUI() {
    const status = document.querySelector("[data-auth-status]");
    const open = document.querySelector("[data-auth-open]");
    const signOutBtn = document.querySelector("[data-auth-signout]");

    if (status) {
      status.textContent = currentUser
        ? currentUser.email || "Signed in"
        : "Guest";

      status.title = currentUser
        ? currentUser.email || "Signed in"
        : "Browser-only mode";
    }

    if (open) open.classList.toggle("hidden", Boolean(currentUser));
    if (signOutBtn) signOutBtn.classList.toggle("hidden", !currentUser);
  }

  function authErrorMessage(err) {
    const code = err && err.code;

    if (code === "auth/email-already-in-use") return "That email already has an account.";
    if (code === "auth/invalid-email") return "Enter a valid email address.";
    if (code === "auth/invalid-credential") return "Email or password is incorrect.";
    if (code === "auth/popup-blocked") return "Allow popups, then try Google sign-in again.";
    if (code === "auth/popup-closed-by-user") return "Google sign-in was closed before finishing.";
    if (code === "auth/unauthorized-domain") return "Add this domain in Firebase Authorized domains.";
    if (code === "auth/weak-password") return "Use a password with at least 6 characters.";

    return "Authentication failed. Try again.";
  }

  // --------------------------------------------------------------
  // Footer
  // --------------------------------------------------------------
  function renderFooter() {
    const footer = document.querySelector("[data-footer]");
    if (!footer) return;

    footer.innerHTML = `
      <div class="container">
        <p>
          © ${new Date().getFullYear()}
          Mind at Ease
        </p>
      </div>
    `;
  }

  // --------------------------------------------------------------
  // Toast
  // --------------------------------------------------------------
  function toast(message, ms = 2400) {
    let el = document.querySelector(".toast");

    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }

    el.textContent = message;

    requestAnimationFrame(() => {
      el.classList.add("show");
    });

    clearTimeout(el._timer);

    el._timer = setTimeout(() => {
      el.classList.remove("show");
    }, ms);
  }

  // --------------------------------------------------------------
  // Format helpers
  // --------------------------------------------------------------
  function formatDate(iso) {
    try {
      const d = new Date(iso);

      return (
        d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric"
        }) +
        " · " +
        d.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit"
        })
      );
    } catch (_) {
      return iso;
    }
  }

  function formatShort(iso) {
    const d = new Date(iso);

    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
  }

  onAuthStateChanged(auth, user => {
    currentUser = user;
    updateAuthUI();

    window.dispatchEvent(new CustomEvent("mae:authchange", {
      detail: { user }
    }));
  });

  // --------------------------------------------------------------
  // Init
  // --------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getTheme());
    renderHeader();
    renderFooter();
    api.completeMagicLinkLogin();
  });

  // --------------------------------------------------------------
  // Global
  // --------------------------------------------------------------
  window.MAE = {
    api,
    toast,
    getClientId,
    getCurrentUser: () => currentUser,
    formatDate,
    formatShort,
    toggleTheme
  };

})();

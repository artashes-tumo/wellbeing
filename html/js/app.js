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
    orderBy,
    limit,
    deleteDoc,
    doc
  } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
  
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

  // --------------------------------------------------------------
  // Firebase API
  // --------------------------------------------------------------
  const api = {

    // ---------------- Mood ----------------

    async saveMood(data) {
      return await addDoc(collection(db, "moods"), {
        ...data,
        client_id: getClientId(),
        created_at: new Date().toISOString()
      });
    },

    async moodHistory(limitCount = 30) {
      const q = query(
        collection(db, "moods"),
        where("client_id", "==", getClientId()),
        orderBy("created_at", "desc"),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
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
        client_id: getClientId(),
        created_at: new Date().toISOString()
      });
    },

    async listJournal(limitCount = 50) {
      const q = query(
        collection(db, "journal"),
        where("client_id", "==", getClientId()),
        orderBy("created_at", "desc"),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
    },

    async deleteJournal(id) {
      await deleteDoc(doc(db, "journal", id));
    },

    // ---------------- Quiz ----------------

    async saveQuiz(data) {
      return await addDoc(collection(db, "quiz"), {
        ...data,
        client_id: getClientId(),
        created_at: new Date().toISOString()
      });
    },

    async quizHistory(limitCount = 20) {
      const q = query(
        collection(db, "quiz"),
        where("client_id", "==", getClientId()),
        orderBy("created_at", "desc"),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
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

  // --------------------------------------------------------------
  // Init
  // --------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getTheme());
    renderHeader();
    renderFooter();
  });

  // --------------------------------------------------------------
  // Global
  // --------------------------------------------------------------
  window.MAE = {
    api,
    toast,
    getClientId,
    formatDate,
    formatShort,
    toggleTheme
  };

})();
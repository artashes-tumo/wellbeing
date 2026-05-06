/* app.js — shared helpers: theme toggle, nav injection, API client, client_id, toast */
(function () {
  "use strict";

  // --------------------------------------------------------------
  // Theme toggle (persisted in localStorage)
  // --------------------------------------------------------------
  const THEME_KEY = "mae-theme";
  function getTheme() {
    return localStorage.getItem(THEME_KEY) ||
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(THEME_KEY, t);
    const btn = document.querySelector("[data-theme-toggle]");
    if (btn) btn.innerHTML = t === "dark" ? sunIcon() : moonIcon();
  }
  function toggleTheme() {
    applyTheme(getTheme() === "dark" ? "light" : "dark");
  }
  function sunIcon() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
  }
  function moonIcon() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  // --------------------------------------------------------------
  // Anonymous client_id (stored locally, sent with every request)
  // --------------------------------------------------------------
  const CLIENT_KEY = "mae-client-id";
  function getClientId() {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = "c-" + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now());
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  }

  // --------------------------------------------------------------
  // API client
  // --------------------------------------------------------------
  const API_BASE = "http://127.0.0.1:8000/api";   // ← Updated

  async function apiRequest(path, { method = "GET", body, params } = {}) {
    let url = API_BASE + path;
    if (params) {
      const q = new URLSearchParams(params);
      url += (url.includes("?") ? "&" : "?") + q.toString();
    }
    const opts = {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "omit"
    };
    if (body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(url, opts);
    if (!res.ok) {
      let detail = res.statusText;
      try { detail = (await res.json()).detail || detail; } catch (_) { }
      throw new Error(detail);
    }
    return res.json();
  }
  const api = {
    // Mood
    saveMood: (data) => apiRequest("/mood", { method: "POST", body: { client_id: getClientId(), ...data } }),
    moodHistory: (limit = 30) => apiRequest("/mood/history", { params: { client_id: getClientId(), limit } }),
    moodStats: () => apiRequest("/mood/stats", { params: { client_id: getClientId() } }),
    deleteMood: (id) => apiRequest("/mood/" + id, { method: "DELETE", params: { client_id: getClientId() } }),
    // Journal
    saveJournal: (data) => apiRequest("/journal", { method: "POST", body: { client_id: getClientId(), ...data } }),
    listJournal: (limit = 50) => apiRequest("/journal", { params: { client_id: getClientId(), limit } }),
    deleteJournal: (id) => apiRequest("/journal/" + id, { method: "DELETE", params: { client_id: getClientId() } }),
    // Quiz
    saveQuiz: (data) => apiRequest("/quiz", { method: "POST", body: { client_id: getClientId(), ...data } }),
    quizHistory: (limit = 20) => apiRequest("/quiz/history", { params: { client_id: getClientId(), limit } }),
    // Insights
    insights: () => apiRequest("/insights", { params: { client_id: getClientId() } }),
  };

  // --------------------------------------------------------------
  // Navigation injection
  // --------------------------------------------------------------
  const NAV_LINKS = [
    { href: "/index.html", label: "Home", key: "home" },
    { href: "/stress.html", label: "Stress & Anxiety", key: "stress" },
    { href: "/study.html", label: "Study Tips", key: "study" },
    { href: "/mood.html", label: "Mood", key: "mood" },
    { href: "/journal.html", label: "Journal", key: "journal" },
    { href: "/quiz.html", label: "Quiz", key: "quiz" },
    { href: "/resources.html", label: "Resources", key: "resources" },
    { href: "/about.html", label: "About", key: "about" },
  ];

  function renderHeader() {
    const header = document.querySelector("[data-header]");
    if (!header) return;
    const active = header.getAttribute("data-active") || "";
    const links = NAV_LINKS
      .map((l) => `<li><a href="${l.href}" class="${l.key === active ? "active" : ""}" data-testid="nav-${l.key}">${l.label}</a></li>`)
      .join("");
    header.innerHTML = `
      <div class="container">
        <nav class="nav">
          <a href="/index.html" class="brand" data-testid="brand-link">
            <span class="brand-dot"></span>
            Mind at Ease
          </a>
          <ul class="nav-links" data-nav-links>${links}</ul>
          <div class="nav-right">
            <button class="theme-toggle" data-theme-toggle aria-label="Toggle theme" data-testid="theme-toggle-btn"></button>
            <button class="menu-btn" data-menu-toggle aria-label="Menu" data-testid="menu-toggle-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </nav>
      </div>`;
    const toggle = header.querySelector("[data-theme-toggle]");
    if (toggle) toggle.addEventListener("click", toggleTheme);
    const menu = header.querySelector("[data-menu-toggle]");
    const navLinks = header.querySelector("[data-nav-links]");
    if (menu && navLinks) menu.addEventListener("click", () => navLinks.classList.toggle("open"));
  }

  function renderFooter() {
    const footer = document.querySelector("[data-footer]");
    if (!footer) return;
    const year = new Date().getFullYear();
    footer.innerHTML = `
      <div class="container">
        <div>
          <a href="/index.html" class="brand" style="margin-bottom: 1rem;">
            <span class="brand-dot"></span>
            Mind at Ease
          </a>
          <p class="muted" style="max-width: 340px; margin-top: 0.5rem;">A calm corner of the internet for school students navigating stress, anxiety, and study pressure.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <ul>
            <li><a href="/stress.html">Stress & Anxiety</a></li>
            <li><a href="/study.html">Study Tips</a></li>
            <li><a href="/mood.html">Mood Check-in</a></li>
            <li><a href="/journal.html">Journal</a></li>
            <li><a href="/quiz.html">Stress Quiz</a></li>
          </ul>
        </div>
        <div>
          <h4>Support</h4>
          <ul>
            <li><a href="/resources.html">Helplines (Austria)</a></li>
            <li><a href="/resources.html#international">International Resources</a></li>
            <li><a href="/about.html">About this project</a></li>
          </ul>
          <p class="muted" style="margin-top: 1rem; font-size: 0.85rem;">If you are in immediate danger, call emergency services: <strong>112</strong> (Austria & EU).</p>
        </div>
      </div>
      <div class="footer-bottom container">
        <p>© ${year} Mind at Ease · An MYP Year 4 Service & Action project. Not a substitute for professional help.</p>
      </div>`;
  }

  // --------------------------------------------------------------
  // Toast
  // --------------------------------------------------------------
  function toast(message, ms = 2400) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("data-testid", "toast");
      document.body.appendChild(el);
    }
    el.textContent = message;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), ms);
  }

  // --------------------------------------------------------------
  // Format helpers
  // --------------------------------------------------------------
  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
        " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    } catch (_) { return iso; }
  }
  function formatShort(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  // --------------------------------------------------------------
  // Init
  // --------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(getTheme());
    renderHeader();
    renderFooter();
  });

  // Expose globally
  window.MAE = {
    api,
    toast,
    getClientId,
    formatDate,
    formatShort,
    toggleTheme,
  };
})();

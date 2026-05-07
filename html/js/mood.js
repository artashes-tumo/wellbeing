/* mood.js - Mood Check-in functionality */
(function () {
  "use strict";

  // DOM Elements
  const moodOptions = document.querySelectorAll(".mood-option");
  const intensityButtons = document.querySelectorAll(".intensity button");
  const moodNote = document.getElementById("moodNote");
  const saveBtn = document.getElementById("moodSave");

  const statTotal = document.getElementById("statTotal");
  const stat7 = document.getElementById("stat7");
  const statTop = document.getElementById("statTop");

  const moodChart = document.getElementById("moodChart");
  const moodList = document.getElementById("moodList");

  let selectedMood = null;
  let selectedIntensity = 3;

  // Mood emoji mapping
  const moodEmojis = {
    great: "😄",
    good: "🙂",
    okay: "😐",
    tired: "😴",
    stressed: "😰",
    anxious: "😟",
    sad: "😔",
    angry: "😤"
  };

  // Select mood
  moodOptions.forEach(option => {
    option.addEventListener("click", () => {
      moodOptions.forEach(opt => opt.classList.remove("selected"));
      option.classList.add("selected");
      selectedMood = option.dataset.mood;
    });
  });

  // Select intensity
  intensityButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      intensityButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedIntensity = parseInt(btn.dataset.level);
    });
  });

  // Save mood check-in
  async function saveMood() {
    if (!selectedMood) {
      window.MAE.toast("Please pick a mood first 😊", 2000);
      return;
    }

    const data = {
      mood: selectedMood,
      intensity: selectedIntensity,
      note: moodNote.value.trim()
    };

    try {
      await window.MAE.api.saveMood(data);
      window.MAE.toast("Mood saved! You're doing great.", 2500);
      
      // Reset form
      resetForm();
      
      // Refresh display
      await loadMoodData();
    } catch (err) {
      console.error(err);
      window.MAE.toast("Failed to save. Please try again.", 3000);
    }
  }

  function resetForm() {
    moodOptions.forEach(opt => opt.classList.remove("selected"));
    selectedMood = null;
    
    intensityButtons.forEach((b, i) => {
      b.classList.toggle("active", parseInt(b.dataset.level) === 3);
    });
    selectedIntensity = 3;
    
    if (moodNote) moodNote.value = "";
  }

  // Load all mood data
  async function loadMoodData() {
    try {
      const [history, stats] = await Promise.all([
        window.MAE.api.moodHistory(30),
        window.MAE.api.moodStats()
      ]);

      // Update stats
      if (statTotal) statTotal.textContent = stats.total || 0;
      if (stat7) stat7.textContent = stats.last7 || 0;
      if (statTop && stats.mostCommon) {
        statTop.textContent = `${moodEmojis[stats.mostCommon] || ""} ${stats.mostCommon}`;
      }

      // Render recent entries
      renderMoodHistory(history);

      // Render weekly chart
      renderWeeklyChart(history);

    } catch (err) {
      console.error("Failed to load mood data:", err);
      // Fallback to empty state
      if (moodList) {
        moodList.innerHTML = `<div class="empty"><div class="icon">📝</div><p>No check-ins yet. Save your first one above.</p></div>`;
      }
    }
  }

  function renderMoodHistory(entries) {
    if (!moodList) return;

    if (!entries || entries.length === 0) {
      moodList.innerHTML = `<div class="empty"><div class="icon">📝</div><p>No check-ins yet. Save your first one above — it's completely private.</p></div>`;
      return;
    }

    let html = "";
    entries.slice(0, 8).forEach(entry => {
      const emoji = moodEmojis[entry.mood] || "😐";
      html += `
        <div class="mood-entry">
          <div class="mood-badge">${emoji}</div>
          <div>
            <strong>${entry.mood}</strong> · Intensity ${entry.intensity}
            ${entry.note ? `<p class="muted" style="margin: 0.25rem 0 0;">${entry.note}</p>` : ""}
          </div>
          <div class="meta">${window.MAE.formatShort(entry.created_at)}</div>
        </div>`;
    });

    moodList.innerHTML = html;
  }

  function renderWeeklyChart(entries) {
    if (!moodChart) return;

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      last7Days.push({
        day: days[d.getDay()],
        dateKey: d.toISOString().split("T")[0]
      });
    }

    let html = "";
    last7Days.forEach(({ day, dateKey }) => {
      const dayEntries = entries.filter(e => e.created_at.startsWith(dateKey));
      const avgIntensity = dayEntries.length 
        ? Math.round(dayEntries.reduce((sum, e) => sum + e.intensity, 0) / dayEntries.length)
        : 0;

      const height = avgIntensity * 20; // scale 0-100%

      html += `
        <div class="bar" style="height: ${height}%">
          ${avgIntensity > 0 ? `<span class="bar-value">${avgIntensity}</span>` : ""}
          <span class="bar-label">${day}</span>
        </div>`;
    });

    moodChart.innerHTML = html;
  }

  // Event listeners
  if (saveBtn) {
    saveBtn.addEventListener("click", saveMood);
  }

  // Keyboard support for saving
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && document.activeElement.id === "moodNote") {
      saveMood();
    }
  });

  // Load data when page loads
  document.addEventListener("DOMContentLoaded", () => {
    loadMoodData();
  });

})();
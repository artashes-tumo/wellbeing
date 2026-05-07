/* journal.js - Private Journal */
(function () {
  "use strict";

  // DOM Elements
  const titleInput = document.getElementById("journalTitle");
  const contentInput = document.getElementById("journalContent");
  const moodSelect = document.getElementById("journalMood");
  const saveBtn = document.getElementById("journalSave");
  const journalList = document.getElementById("journalList");

  const wordCount = document.getElementById("wordCount");
  const charCount = document.getElementById("charCount");

  const promptButtons = document.querySelectorAll("#prompts button");

  let currentEditingId = null;

  // Update live word & character count
  function updateCounts() {
    const text = contentInput.value.trim();
    const words = text === "" ? 0 : text.split(/\s+/).length;
    const chars = text.length;

    if (wordCount) wordCount.textContent = words;
    if (charCount) charCount.textContent = chars;
  }

  contentInput.addEventListener("input", updateCounts);

  // Prompt buttons
  promptButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const promptText = btn.dataset.prompt;
      contentInput.value = promptText + "\n\n";
      contentInput.focus();
      updateCounts();
    });
  });

  // Save journal entry
  async function saveEntry() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!content) {
      window.MAE.toast("Write something before saving ✨", 2000);
      return;
    }

    const data = {
      title: title || "Untitled entry",
      content: content,
      mood: moodSelect.value || null
    };

    try {
      if (currentEditingId) {
        // Update existing (optional - you can implement later)
        await window.MAE.api.saveJournal({ ...data, id: currentEditingId });
        window.MAE.toast("Entry updated", 1800);
      } else {
        await window.MAE.api.saveJournal(data);
        window.MAE.toast("Entry saved privately", 2200);
      }

      resetForm();
      loadJournalEntries();
    } catch (err) {
      console.error(err);
      window.MAE.toast("Could not save entry. Try again.", 3000);
    }
  }

  function resetForm() {
    titleInput.value = "";
    contentInput.value = "";
    moodSelect.value = "";
    currentEditingId = null;
    updateCounts();
    saveBtn.textContent = "Save entry";
  }

  // Load and render entries
  async function loadJournalEntries() {
    if (!journalList) return;

    try {
      const entries = await window.MAE.api.listJournal(20);

      if (!entries || entries.length === 0) {
        journalList.innerHTML = `
          <div class="empty">
            <div class="icon">✍️</div>
            <p>No entries yet. Write your first one above.</p>
          </div>`;
        return;
      }

      let html = "";
      entries.forEach(entry => {
        const date = window.MAE.formatDate(entry.created_at);
        const moodEmoji = entry.mood ? 
          {great:"😄",good:"🙂",okay:"😐",tired:"😴",stressed:"😰",anxious:"😟",sad:"😔",angry:"😤"}[entry.mood] || "" : "";

        html += `
          <div class="mood-entry" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <strong>${entry.title}</strong>
                ${moodEmoji ? `<span style="margin-left: 0.5rem;">${moodEmoji}</span>` : ""}
              </div>
              <small class="muted">${date}</small>
            </div>
            <p style="margin: 0.5rem 0 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
              ${entry.content}
            </p>
            <div style="margin-top: 0.75rem;">
              <button class="btn btn-ghost btn-sm" onclick="editEntry('${entry.id}')" style="font-size: 0.8rem;">Edit</button>
              <button class="btn btn-ghost btn-sm" onclick="deleteEntry('${entry.id}')" style="font-size: 0.8rem; color: var(--danger);">Delete</button>
            </div>
          </div>`;
      });

      journalList.innerHTML = html;
    } catch (err) {
      console.error(err);
      journalList.innerHTML = `<p class="muted">Could not load entries.</p>`;
    }
  }

  // Global functions for inline onclick (simple approach)
  window.editEntry = function(id) {
    // For now: just alert. You can expand this later.
    window.MAE.toast("Edit mode coming soon!", 2000);
  };

  window.deleteEntry = async function(id) {
    if (!confirm("Delete this journal entry?")) return;

    try {
      await window.MAE.api.deleteJournal(id);
      window.MAE.toast("Entry deleted", 1500);
      loadJournalEntries();
    } catch (err) {
      window.MAE.toast("Failed to delete", 2000);
    }
  };

  // Event listeners
  if (saveBtn) {
    saveBtn.addEventListener("click", saveEntry);
  }

  // Allow Ctrl/Cmd + Enter to save
  contentInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      saveEntry();
    }
  });

  // Initialize
  document.addEventListener("DOMContentLoaded", () => {
    updateCounts();
    loadJournalEntries();
  });

  window.addEventListener("mae:authchange", () => {
    loadJournalEntries();
  });

})();

/* breathing.js - Guided Box Breathing */
(function () {
  "use strict";

  let isRunning = false;
  let cycleCount = 0;
  let timeoutId = null;

  const circle = document.getElementById("breathingCircle");
  const countEl = document.getElementById("breathingCount");
  const startBtn = document.getElementById("breathingStart");
  const stopBtn = document.getElementById("breathingStop");

  function updateUI() {
    if (countEl) countEl.textContent = `Cycle ${cycleCount} · ${isRunning ? "breathing..." : "ready"}`;
  }

  function startBreathing() {
    if (isRunning) return;
    isRunning = true;
    cycleCount = 0;
    if (circle) circle.classList.remove("pause");

    function cycle() {
      if (!isRunning) return;

      cycleCount++;
      updateUI();

      // Inhale
      circle.classList.remove("exhale", "hold");
      circle.classList.add("inhale");
      timeoutId = setTimeout(() => {
        if (!isRunning) return;

        // Hold
        circle.classList.remove("inhale");
        circle.classList.add("hold");
        timeoutId = setTimeout(() => {
          if (!isRunning) return;

          // Exhale
          circle.classList.remove("hold");
          circle.classList.add("exhale");
          timeoutId = setTimeout(() => {
            if (!isRunning) return;

            // Hold after exhale
            circle.classList.remove("exhale");
            circle.classList.add("hold");
            timeoutId = setTimeout(cycle, 4000);
          }, 4000);
        }, 4000);
      }, 4000);
    }

    cycle();
  }

  function stopBreathing() {
    isRunning = false;
    clearTimeout(timeoutId);
    if (circle) {
      circle.classList.remove("inhale", "hold", "exhale");
      circle.classList.add("pause");
    }
    updateUI();
  }

  // Event listeners
  if (startBtn) startBtn.addEventListener("click", startBreathing);
  if (stopBtn) stopBtn.addEventListener("click", stopBreathing);

  // Cleanup on page leave
  window.addEventListener("beforeunload", stopBreathing);

  // Initial state
  updateUI();

})();
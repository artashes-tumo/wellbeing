/* pomodoro.js - Focus Timer */
(function () {
  "use strict";

  // DOM Elements
  const statusEl = document.getElementById("pomoStatus");
  const timeEl = document.getElementById("pomoTime");
  const progressEl = document.getElementById("pomoProgress");
  const countEl = document.getElementById("pomoCount");

  const startBtn = document.getElementById("pomoStart");
  const pauseBtn = document.getElementById("pomoPause");
  const resetBtn = document.getElementById("pomoReset");
  const skipBtn = document.getElementById("pomoSkip");

  // Timer variables
  let timerInterval = null;
  let timeLeft = 25 * 60;           // seconds
  let isRunning = false;
  let isBreak = false;
  let pomodoroCount = 0;            // completed focus sessions today

  const FOCUS_TIME = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;

  function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    // Progress bar
    const total = isBreak ? (pomodoroCount % 4 === 3 ? LONG_BREAK : SHORT_BREAK) : FOCUS_TIME;
    const progress = ((total - timeLeft) / total) * 100;
    progressEl.style.width = `${progress}%`;

    // Status text
    statusEl.textContent = isBreak ? "Break" : "Focus";
    statusEl.style.color = isBreak ? "var(--success)" : "var(--primary)";
  }

  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    timerInterval = setInterval(() => {
      timeLeft--;
      updateDisplay();

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
        handleTimerComplete();
      }
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  function resetTimer() {
    pauseTimer();
    isBreak = false;
    timeLeft = FOCUS_TIME;
    updateDisplay();
  }

  function skipPhase() {
    pauseTimer();
    handleTimerComplete();
  }

  function handleTimerComplete() {
    if (!isBreak) {
      // Finished focus session
      pomodoroCount++;
      if (countEl) countEl.textContent = pomodoroCount;

      // Decide next break length
      if (pomodoroCount % 4 === 0) {
        timeLeft = LONG_BREAK;
      } else {
        timeLeft = SHORT_BREAK;
      }
      isBreak = true;
    } else {
      // Finished break → new focus
      timeLeft = FOCUS_TIME;
      isBreak = false;
    }

    updateDisplay();
    startBtn.disabled = false;
    pauseBtn.disabled = true;

    // Optional: play sound or show notification
    window.MAE.toast(isBreak ? "Time for a break! ☕" : "Back to focus! 💪", 2800);
  }

  // Event Listeners
  if (startBtn) startBtn.addEventListener("click", startTimer);
  if (pauseBtn) pauseBtn.addEventListener("click", pauseTimer);
  if (resetBtn) resetBtn.addEventListener("click", resetTimer);
  if (skipBtn) skipBtn.addEventListener("click", skipPhase);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === " " && document.activeElement.tagName !== "TEXTAREA") {
      e.preventDefault();
      if (isRunning) pauseTimer();
      else startTimer();
    }
  });

  // Initialize
  function init() {
    timeLeft = FOCUS_TIME;
    updateDisplay();
    pauseBtn.disabled = true;
  }

  document.addEventListener("DOMContentLoaded", init);

  // Expose for debugging if needed
  window.POMODORO = { resetTimer, startTimer };

})();
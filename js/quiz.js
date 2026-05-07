/* quiz.js - Stress Self-Check Quiz */
(function () {
  "use strict";

  // Quiz data
  const questions = [
    "In the last week, how often have you felt nervous or on edge?",
    "In the last week, how often have you been unable to stop worrying?",
    "In the last week, how often have you had trouble relaxing?",
    "In the last week, how often have you felt easily annoyed or irritable?",
    "In the last week, how often have you felt afraid that something awful might happen?",
    "In the last week, how often have you had trouble falling or staying asleep?",
    "In the last week, how often have you felt overwhelmed by your responsibilities?"
  ];

  // DOM Elements
  const quizContainer = document.getElementById("quizContainer");
  const resultContainer = document.getElementById("resultContainer");
  const quizProgress = document.querySelector(".quiz-progress span");
  const progressBar = document.querySelector(".quiz-progress-bar > div");
  const questionEl = document.querySelector(".quiz-question");
  const optionsContainer = document.querySelector(".quiz-options");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const quizHistory = document.getElementById("quizHistory");

  let currentQuestion = 0;
  let answers = new Array(questions.length).fill(null);

  // Render current question
  function renderQuestion() {
    questionEl.textContent = questions[currentQuestion];
    quizProgress.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
    progressBar.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;

    // Render options
    optionsContainer.innerHTML = `
      <label class="quiz-option" data-val="0"><input type="radio" name="q${currentQuestion}" value="0"> <span>Not at all</span></label>
      <label class="quiz-option" data-val="1"><input type="radio" name="q${currentQuestion}" value="1"> <span>A little</span></label>
      <label class="quiz-option" data-val="2"><input type="radio" name="q${currentQuestion}" value="2"> <span>Sometimes</span></label>
      <label class="quiz-option" data-val="3"><input type="radio" name="q${currentQuestion}" value="3"> <span>Often</span></label>
      <label class="quiz-option" data-val="4"><input type="radio" name="q${currentQuestion}" value="4"> <span>Almost every day</span></label>
    `;

    // Restore previous answer
    const savedAnswer = answers[currentQuestion];
    if (savedAnswer !== null) {
      const selectedOption = optionsContainer.querySelector(`input[value="${savedAnswer}"]`);
      if (selectedOption) {
        selectedOption.checked = true;
        selectedOption.closest(".quiz-option").classList.add("selected");
      }
    }

    // Add click listeners to options
    optionsContainer.querySelectorAll(".quiz-option").forEach(label => {
      label.addEventListener("click", () => {
        optionsContainer.querySelectorAll(".quiz-option").forEach(l => l.classList.remove("selected"));
        label.classList.add("selected");
        answers[currentQuestion] = parseInt(label.dataset.val);
      });
    });

    // Button states
    prevBtn.disabled = currentQuestion === 0;
    nextBtn.textContent = currentQuestion === questions.length - 1 ? "See Results →" : "Next →";
  }

  // Next question
  function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      renderQuestion();
    } else {
      showResults();
    }
  }

  // Previous question
  function prevQuestion() {
    if (currentQuestion > 0) {
      currentQuestion--;
      renderQuestion();
    }
  }

  // Calculate score and show results
  function showResults() {
    const totalScore = answers.reduce((sum, val) => sum + (val || 0), 0);
    const maxScore = questions.length * 4;
    const percentage = Math.round((totalScore / maxScore) * 100);

    let resultHTML = `
      <h2>Your Stress Snapshot</h2>
      <div class="text-center" style="margin: 2rem 0;">
        <div class="result-badge ${totalScore <= 10 ? 'result-low' : totalScore <= 18 ? 'result-mod' : 'result-high'}">
          Score: ${totalScore} / ${maxScore}
        </div>
      </div>
    `;

    if (totalScore <= 10) {
      resultHTML += `
        <p><strong>Low stress levels right now.</strong> Great job taking care of yourself!</p>
        <p>Keep using the tools on this site to stay balanced.</p>`;
    } else if (totalScore <= 18) {
      resultHTML += `
        <p><strong>Moderate stress.</strong> This is common during school. You're not alone.</p>
        <p>Try the breathing exercise or mood check-ins regularly.</p>`;
    } else {
      resultHTML += `
        <p><strong>High stress levels.</strong> It's okay to ask for support.</p>
        <p>Consider talking to a trusted adult or using the helplines on the Resources page.</p>`;
    }

    resultHTML += `
      <div class="text-center" style="margin-top: 2rem;">
        <button class="btn btn-primary" onclick="restartQuiz()">Take Quiz Again</button>
        <a href="/resources.html" class="btn btn-ghost" style="margin-left: 0.75rem;">View Helplines</a>
      </div>`;

    quizContainer.classList.add("hidden");
    resultContainer.classList.remove("hidden");
    resultContainer.innerHTML = resultHTML;

    saveQuizResult(totalScore, percentage);
  }

  async function saveQuizResult(score, percentage) {
    try {
      await window.MAE.api.saveQuiz({
        score,
        percentage,
        answers: [...answers]
      });
      window.MAE.toast("Quiz result saved", 1800);
      await loadQuizHistory();
    } catch (e) {
      console.error("Failed to save quiz result", e);
      window.MAE.toast("Could not save quiz result. Try again.", 2800);
    }
  }

  // Load past results
  async function loadQuizHistory() {
    if (!quizHistory) return;

    try {
      const history = await window.MAE.api.quizHistory(5);
      renderQuizHistory(history);
    } catch (err) {
      quizHistory.innerHTML = `<p class="muted">Could not load history.</p>`;
    }
  }

  function renderQuizHistory(history) {
    if (!history || history.length === 0) {
      quizHistory.innerHTML = `<p class="muted">Your past quiz results will show here.</p>`;
      return;
    }

    let html = "<div class='mood-history'>";
    history.forEach(result => {
      const date = formatShort(result.created_at);
      html += `
        <div class="mood-entry">
          <strong>${result.score}/28</strong>
          <span class="muted">${date}</span>
        </div>`;
    });
    html += "</div>";
    quizHistory.innerHTML = html;
  }

  function formatShort(iso) {
    if (window.MAE && window.MAE.formatShort) {
      return window.MAE.formatShort(iso);
    }

    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
  }

  window.restartQuiz = function() {
    currentQuestion = 0;
    answers = new Array(questions.length).fill(null);
    resultContainer.classList.add("hidden");
    quizContainer.classList.remove("hidden");
    renderQuestion();
  };

  // Event Listeners
  if (nextBtn) nextBtn.addEventListener("click", nextQuestion);
  if (prevBtn) prevBtn.addEventListener("click", prevQuestion);

  // Initialize
  document.addEventListener("DOMContentLoaded", () => {
    renderQuestion();
    loadQuizHistory();
  });

  window.addEventListener("mae:authchange", () => {
    loadQuizHistory();
  });

})();

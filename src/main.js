import "./style.css";
import questionsData from "./questions.json";

const MAX_MONEY = 600;
const TOTAL_QUESTIONS = questionsData.length;

let currentQuestionIndex = 0;
let totalMoney = 0;
let moneyAnimationFrame = null;

const moneyAmountEl = document.getElementById("money-amount");
const moneyDisplayEl = document.getElementById("money-display");
const progressLabel = document.getElementById("progress-label");
const progressFill = document.getElementById("progress-fill");
const questionCard = document.getElementById("question-card");
const prizeTag = document.getElementById("prize-tag");
const statusPill = document.getElementById("status-pill");
const statusLine = document.getElementById("status-line");
const questionText = document.getElementById("question-text");
const answerInput = document.getElementById("answer-input");
const answerForm = document.getElementById("answer-form");
const feedbackMessage = document.getElementById("feedback-message");
const submitBtn = document.getElementById("submit-btn");

const modal = document.getElementById("modal");
const modalContent = document.querySelector(".modal-content");
const modalTitle = document.getElementById("modal-title");
const modalSubtitle = document.getElementById("modal-subtitle");
const modalMoney = document.getElementById("modal-money");
const modalMessage = document.getElementById("modal-message");
const restartBtn = document.getElementById("restart-btn");

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function formatMoney(amount) {
  return new Intl.NumberFormat("es-ES").format(amount);
}

function animateValue(from, to, duration, onUpdate, onComplete) {
  const start = performance.now();

  function step(timestamp) {
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(from + (to - from) * eased);

    onUpdate(value);

    if (progress < 1) {
      moneyAnimationFrame = requestAnimationFrame(step);
      return;
    }

    moneyAnimationFrame = null;
    onComplete?.();
  }

  moneyAnimationFrame = requestAnimationFrame(step);
}

function updateMoneyUI(amount) {
  const currentValue = Number.parseInt(moneyAmountEl.dataset.value || "0", 10);

  if (moneyAnimationFrame) {
    cancelAnimationFrame(moneyAnimationFrame);
    moneyAnimationFrame = null;
  }

  moneyDisplayEl.classList.add("pulse");

  animateValue(
    currentValue,
    amount,
    520,
    (nextValue) => {
      moneyAmountEl.dataset.value = String(nextValue);
      moneyAmountEl.innerText = formatMoney(nextValue);
    },
    () => {
      moneyDisplayEl.classList.remove("pulse");
    },
  );
}

function updateProgressUI() {
  const visibleQuestion = Math.min(currentQuestionIndex + 1, TOTAL_QUESTIONS);
  const progress = TOTAL_QUESTIONS
    ? (visibleQuestion / TOTAL_QUESTIONS) * 100
    : 0;

  progressLabel.innerText =
    currentQuestionIndex < TOTAL_QUESTIONS
      ? `Pregunta ${visibleQuestion} de ${TOTAL_QUESTIONS}`
      : "Juego completo";

  statusPill.innerText =
    currentQuestionIndex < TOTAL_QUESTIONS
      ? `Ronda ${visibleQuestion}`
      : "Final";

  progressFill.style.width = `${Math.max(progress, 8)}%`;
}

function clearFeedback() {
  feedbackMessage.className = "feedback-message";
  feedbackMessage.innerText = "";
}

function setFeedback(message, type) {
  feedbackMessage.className = `feedback-message show ${type}`;
  feedbackMessage.innerText = message;
}

function loadNextQuestion() {
  if (currentQuestionIndex >= TOTAL_QUESTIONS) {
    endGame(false, "Te has quedado sin preguntas.");
    return;
  }

  const question = questionsData[currentQuestionIndex];
  const availableToWin = Math.max(
    0,
    Math.min(question.prize, MAX_MONEY - totalMoney),
  );

  updateProgressUI();

  prizeTag.innerText = `Premio de esta ronda: ${formatMoney(availableToWin)} EUR`;
  questionText.innerText = question.question;
  statusLine.innerText =
    availableToWin > 0
      ? "Escribe la respuesta y pulsa el boton para seguir sumando."
      : "Ya has alcanzado el maximo. Esta ronda es solo para lucirse.";

  answerForm.dataset.currentPrize = String(availableToWin);
  answerInput.value = "";
  answerInput.disabled = false;
  submitBtn.disabled = false;
  clearFeedback();
  answerInput.focus();
}

function endGame(hitJackpot, customReason = "") {
  setTimeout(() => {
    const missingMoney = Math.max(MAX_MONEY - totalMoney, 0);

    modal.style.display = "flex";
    updateProgressUI();

    if (hitJackpot || totalMoney >= MAX_MONEY) {
      modalContent.classList.remove("lose");
      modalTitle.innerText = "JACKPOT";
      modalSubtitle.innerText = "Has alcanzado el premio maximo.";
      modalMessage.innerText =
        "Increible jugada. Has cerrado la partida con todo el bote.";
    } else {
      modalContent.classList.add("lose");
      modalTitle.innerText = "Juego terminado";
      modalSubtitle.innerText = "No quedaban mas preguntas.";
      modalMessage.innerText = `${customReason} Como premio de cierre te sumamos ${formatMoney(missingMoney)} EUR para llegar a 600 EUR.`;
      totalMoney = MAX_MONEY;
    }

    updateMoneyUI(totalMoney);
    modalMoney.innerText = formatMoney(totalMoney);
  }, 720);
}

answerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const question = questionsData[currentQuestionIndex];
  const userAnswerRaw = answerInput.value;
  const currentPrize = Number.parseInt(answerForm.dataset.currentPrize || "0", 10);

  if (!question || !userAnswerRaw.trim()) {
    return;
  }

  submitBtn.disabled = true;
  answerInput.disabled = true;

  const normalizedUser = normalizar(userAnswerRaw);
  const normalizedCorrect = normalizar(question.answer);

  if (normalizedUser === normalizedCorrect) {
    totalMoney += currentPrize;
    updateMoneyUI(totalMoney);

    questionCard.classList.add("success");
    setFeedback("Respuesta correcta.", "correct");

    setTimeout(() => {
      questionCard.classList.remove("success");

      if (totalMoney >= MAX_MONEY) {
        endGame(true);
        return;
      }

      currentQuestionIndex += 1;
      loadNextQuestion();
    }, 1200);

    return;
  }

  questionCard.classList.add("shake");
  setFeedback(`No era esa. La correcta era: ${question.answer}`, "wrong");

  setTimeout(() => {
    questionCard.classList.remove("shake");
    currentQuestionIndex += 1;
    loadNextQuestion();
  }, 920);
});

restartBtn.addEventListener("click", () => {
  currentQuestionIndex = 0;
  totalMoney = 0;
  moneyAmountEl.dataset.value = "0";
  moneyAmountEl.innerText = "0";
  modal.style.display = "none";
  modalContent.classList.remove("lose");
  loadNextQuestion();
});

loadNextQuestion();

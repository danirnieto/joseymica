import './style.css';
import questionsData from './questions.json';

const MAX_MONEY = 600;

let currentQuestionIndex = 0;
let totalMoney = 0;

// Elementos del DOM
const moneyAmountEl = document.getElementById('money-amount');
const moneyDisplayEl = document.getElementById('money-display');
const questionCard = document.getElementById('question-card');
const prizeTag = document.getElementById('prize-tag');
const questionText = document.getElementById('question-text');
const answerInput = document.getElementById('answer-input');
const answerForm = document.getElementById('answer-form');
const feedbackMessage = document.getElementById('feedback-message');
const submitBtn = document.getElementById('submit-btn');

// Modal Elements
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalMoney = document.getElementById('modal-money');
const modalMessage = document.getElementById('modal-message');
const restartBtn = document.getElementById('restart-btn');

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
    .replace(/\s+/g, ""); // Quitar espacios
}

function updateMoneyUI(amount) {
  // Animación tipo tragaperras para los números
  let current = parseInt(moneyAmountEl.innerText) || 0;
  const target = amount;
  const diff = target - current;
  const steps = 20;
  const stepValue = diff / steps;
  let currentStep = 0;

  moneyDisplayEl.classList.add('pulse');
  
  const interval = setInterval(() => {
    currentStep++;
    current += stepValue;
    moneyAmountEl.innerText = Math.floor(current);
    
    if (currentStep >= steps) {
      clearInterval(interval);
      moneyAmountEl.innerText = target;
      moneyDisplayEl.classList.remove('pulse');
    }
  }, 30);
}

function loadNextQuestion() {
  if (currentQuestionIndex >= questionsData.length) {
    // Te quedaste sin preguntas, pero te llevas el total + consolación hasta 600
    endGame(false, "Te has quedado sin preguntas.");
    return;
  }

  const q = questionsData[currentQuestionIndex];
  
  // Calcular el premio con el CAP
  let availableToWin = q.prize;
  if (totalMoney + q.prize > MAX_MONEY) {
    availableToWin = MAX_MONEY - totalMoney;
  }

  prizeTag.innerText = `Premio: ${availableToWin}€`;
  questionText.innerText = q.question;
  answerInput.value = '';
  feedbackMessage.className = 'feedback-message';
  feedbackMessage.innerText = '';
  
  // Guardamos el premio real disponible temporalmente en el form
  answerForm.dataset.currentPrize = availableToWin;
  
  answerInput.focus();
}

function endGame(isWin, customReason = "") {
  setTimeout(() => {
    modal.style.display = 'flex';
    
    if (isWin) {
      modalTitle.innerText = "¡JACKPOT!";
      modalSubtitle.innerText = "Has alcanzado el premio máximo.";
      modalMessage.innerText = "¡Increíble jugada! Eres un genio.";
      document.querySelector('.modal-content').classList.remove('lose');
    } else {
      const missing = MAX_MONEY - totalMoney;
      modalTitle.innerText = "QUÉ PENA...";
      modalSubtitle.innerText = "Has fallado la pregunta.";
      modalMessage.innerText = `${customReason}\nPero no te preocupes, como premio de consolación te sumamos los ${missing}€ que te faltaban para llegar a 600€!!`;
      document.querySelector('.modal-content').classList.add('lose');
    }
    
    totalMoney = MAX_MONEY;
    updateMoneyUI(totalMoney);
    modalMoney.innerText = totalMoney;
  }, 1000);
}

answerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const q = questionsData[currentQuestionIndex];
  const userAnswerRaw = answerInput.value;
  const currentPrize = parseInt(answerForm.dataset.currentPrize, 10);
  
  if (!userAnswerRaw.trim()) return;
  
  submitBtn.disabled = true;
  answerInput.disabled = true;

  const normalizedUser = normalizar(userAnswerRaw);
  const normalizedCorrect = normalizar(q.answer);

  if (normalizedUser === normalizedCorrect) {
    // Acertó
    totalMoney += currentPrize;
    updateMoneyUI(totalMoney);
    
    questionCard.classList.add('success');
    feedbackMessage.innerText = "¡Respuesta Correcta!";
    feedbackMessage.className = 'feedback-message show correct';
    
    setTimeout(() => {
      questionCard.classList.remove('success');
      submitBtn.disabled = false;
      answerInput.disabled = false;
      
      if (totalMoney >= MAX_MONEY) {
        endGame(true);
      } else {
        currentQuestionIndex++;
        loadNextQuestion();
      }
    }, 1500);

  } else {
    // Falló
    questionCard.classList.add('shake');
    feedbackMessage.innerText = "¡Fallaste!";
    feedbackMessage.className = 'feedback-message show wrong';
    
    setTimeout(() => {
      questionCard.classList.remove('shake');
      submitBtn.disabled = false;
      answerInput.disabled = false;
      endGame(false, `La respuesta correcta era: ${q.answer}`);
    }, 800);
  }
});

restartBtn.addEventListener('click', () => {
  currentQuestionIndex = 0;
  totalMoney = 0;
  moneyAmountEl.innerText = "0";
  modal.style.display = 'none';
  loadNextQuestion();
});

// Inicializar juego
loadNextQuestion();

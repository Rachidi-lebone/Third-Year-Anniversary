import confetti from 'canvas-confetti';
import { quizData } from './quiz-data.js';
import { setupPuzzle } from './puzzle.js';

document.addEventListener('DOMContentLoaded', () => {
    const scenes = document.querySelectorAll('.scene');
    const appContainer = document.getElementById('app-container');
    let sfxEnabled = true;
    let audioContext;
    let clickBuffer;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Sound Effects ---
    function initAudio() {
        if (audioContext) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        fetch('click.mp3')
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(decodedData => {
                clickBuffer = decodedData;
            })
            .catch(e => console.error("Error loading sound", e));
    }

    function playClickSound() {
        if (!sfxEnabled || !clickBuffer || !audioContext || audioContext.state === 'suspended') return;
        const source = audioContext.createBufferSource();
        source.buffer = clickBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    }
    
    appContainer.addEventListener('click', () => {
        if (!audioContext) initAudio();
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true });
    
    document.body.addEventListener('click', (e) => {
        if (e.target.matches('button, label, input[type="radio"]')) {
            playClickSound();
        }
    });

    // --- Scene Navigation ---
    function navigateTo(sceneId) {
        scenes.forEach(scene => {
            scene.classList.remove('active');
        });
        document.getElementById(sceneId).classList.add('active');
        if (sceneId === 'puzzle-scene') {
            setupPuzzle(navigateTo);
        }
    }

    // --- Title Scene ---
    const titleTextElement = document.getElementById('title-text');
    const nextButton = document.getElementById('next-button');
    const stickerContainer = document.getElementById('title-sticker-container');

    const titleLines = [
        "Welcome, Happy Feet 🐧",
        "To your own little playground to enjoy on our 3rd anniversary.",
        "You heard me right. Three whole years, baby!!!",
        "Today I will test your knowledge of our love story."
    ];
    let currentLine = 0;

    function updateTitleScreen() {
        titleTextElement.textContent = titleLines[currentLine];
        stickerContainer.innerHTML = '';
        if (currentLine === 2) {
            const sticker = document.createElement('img');
            sticker.src = 'celebration_sticker.png';
            sticker.alt = 'A celebratory pixel art heart sticker';
            stickerContainer.appendChild(sticker);
        }
        if (currentLine === titleLines.length - 1) {
            nextButton.textContent = 'Start Quiz';
        } else {
            nextButton.textContent = 'Next';
        }
    }

    nextButton.addEventListener('click', () => {
        currentLine++;
        if (currentLine < titleLines.length) {
            updateTitleScreen();
        } else {
            navigateTo('quiz-scene');
        }
    });
    
    updateTitleScreen();

    // --- Quiz Scene ---
    const quizForm = document.getElementById('quiz-form');
    const questionCounter = document.getElementById('question-counter');
    const quizScoreElement = document.getElementById('quiz-score');
    const quizSubmitBtn = document.getElementById('quiz-submit-btn');
    const quizResultElement = document.getElementById('quiz-result');
    const quizNavButtons = document.getElementById('quiz-nav-buttons');
    
    function loadQuiz() {
        quizForm.innerHTML = '';
        quizData.forEach((q, index) => {
            const questionBlock = document.createElement('div');
            questionBlock.className = 'question-block';
            questionBlock.innerHTML = `
                <p>${index + 1}. ${q.question}</p>
                <ul class="options-list">
                    ${q.options.map((option, i) => `
                        <li>
                            <label>
                                <input type="radio" name="q${index}" value="${i}">
                                ${option}
                            </label>
                        </li>
                    `).join('')}
                </ul>
            `;
            quizForm.appendChild(questionBlock);
        });
        questionCounter.textContent = `Q1 of ${quizData.length}`;
        quizScoreElement.textContent = `Score: 0%`;
    }

    quizForm.addEventListener('change', () => {
        const answeredQuestions = quizForm.querySelectorAll('input[type="radio"]:checked').length;
        questionCounter.textContent = `Q${answeredQuestions} of ${quizData.length}`;
    });
    
    quizSubmitBtn.addEventListener('click', () => {
        let score = 0;
        const userAnswers = [];
        quizData.forEach((q, index) => {
            const selected = quizForm.querySelector(`input[name="q${index}"]:checked`);
            const answerIndex = selected ? parseInt(selected.value) : -1;
            userAnswers.push(answerIndex);
            if (answerIndex === q.correct) {
                score++;
            }
        });
        
        const scorePercent = Math.round((score / quizData.length) * 100);
        quizScoreElement.textContent = `Score: ${scorePercent}%`;
        quizSubmitBtn.style.display = 'none';
        
        displayQuizResult(scorePercent, userAnswers);
    });
    
    function displayQuizResult(scorePercent, userAnswers) {
        let message = '';
        let avatar = '';

        if (scorePercent < 80) {
            message = `<h2>Almost!</h2><p>You scored ${scorePercent}%. We need at least 80% to proceed. Give it another try!</p>`;
            avatar = 'avatar_sad.png';
            quizNavButtons.innerHTML = `<button id="retry-quiz-btn" class="btn">Retry Quiz</button>`;
            document.getElementById('retry-quiz-btn').addEventListener('click', resetQuiz);
        } else {
            if (scorePercent === 100) {
                message = `<h2>Perfection! 100%!</h2><p>You know our story inside and out! My heart is melting.</p>`;
                avatar = 'avatar_ecstatic.png';
                if (!reducedMotion) {
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                }
            } else if (scorePercent >= 90) {
                message = `<h2>Incredible! ${scorePercent}%!</h2><p>So close to perfect! You're amazing.</p>`;
                avatar = 'avatar_very_happy.png';
            } else {
                message = `<h2>Great job! ${scorePercent}%!</h2><p>You passed! Our memories are safe with you.</p>`;
                avatar = 'avatar_happy.png';
            }
            quizResultElement.innerHTML += generateAnswerKey(userAnswers);
            quizNavButtons.innerHTML = `<button id="continue-puzzle-btn" class="btn">Continue</button>`;
            document.getElementById('continue-puzzle-btn').addEventListener('click', () => navigateTo('puzzle-scene'));
        }
        
        quizResultElement.innerHTML = `<div class="result-feedback">${message}<img src="${avatar}" alt=""></div>`;
    }

    function generateAnswerKey(userAnswers) {
        let keyHTML = '<div class="answer-key"><h3>Answer Key</h3>';
        quizData.forEach((q, i) => {
            const userAnswer = userAnswers[i];
            const isCorrect = userAnswer === q.correct;
            const resultClass = isCorrect ? 'correct-answer' : 'incorrect-answer';
            const userAnswerText = userAnswer !== -1 ? q.options[userAnswer] : 'Not Answered';
            keyHTML += `
                <div>
                    <p><strong>Q: ${q.question}</strong></p>
                    <p>Your answer: <span class="${resultClass}">${userAnswerText}</span></p>
                    ${!isCorrect ? `<p>Correct answer: <span class="correct-answer">${q.options[q.correct]}</span></p>` : ''}
                </div>
                <hr>
            `;
        });
        keyHTML += '</div>';
        return keyHTML;
    }

    function resetQuiz() {
        quizResultElement.innerHTML = '';
        quizNavButtons.innerHTML = '';
        quizSubmitBtn.style.display = 'block';
        quizForm.reset();
        loadQuiz();
    }
    
    loadQuiz();

    // --- Unlock Scene ---
    const unlockInput = document.getElementById('unlock-input');
    const unlockSubmitBtn = document.getElementById('unlock-submit-btn');
    const unlockError = document.getElementById('unlock-error');
    const nextComplimentBtn = document.getElementById('next-compliment-btn');
    const UNLOCK_CODE = '13/08/2022';

    unlockInput.addEventListener('input', () => {
        let value = unlockInput.value.replace(/\D/g, '');
        if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
        if (value.length > 5) value = value.slice(0, 5) + '/' + value.slice(5, 9);
        unlockInput.value = value;
    });

    unlockSubmitBtn.addEventListener('click', () => {
        if (unlockInput.value === UNLOCK_CODE) {
            unlockError.textContent = '';
            document.getElementById('chest-char').src = 'chest_open.png';
            setTimeout(() => navigateTo('letter-scene'), 1000);
        } else {
            unlockError.textContent = 'Incorrect date. Try again.';
            if (!reducedMotion) {
                unlockInput.classList.add('shake');
                setTimeout(() => unlockInput.classList.remove('shake'), 500);
            }
        }
    });
    
    let compliments, stones, happyFeetChar, pathContainer, chest, chestPosition, currentStep;

    function initUnlockAnimation() {
        happyFeetChar = document.getElementById('happy-feet-char');
        pathContainer = document.getElementById('unlock-path');
        chest = document.getElementById('chest-char');
        compliments = ["Hey beautiful", "Hey sexy", "Hey considerate", "Hey intelligent", "Hey tenacious", "Hey radiant", "Hey brave", "Hey hilarious", "Hey thoughtful", "Hey unstoppable"];
        pathContainer.innerHTML = '';
        
        compliments.forEach(text => {
            const stone = document.createElement('div');
            stone.className = 'stepping-stone';
            stone.textContent = text;
            pathContainer.appendChild(stone);
        });

        stones = Array.from(document.querySelectorAll('.stepping-stone'));
        chestPosition = {
            top: pathContainer.offsetHeight / 2 - chest.offsetHeight / 2,
            left: pathContainer.offsetWidth - chest.offsetWidth - 20,
        };
        chest.style.top = `${chestPosition.top}px`;
        chest.style.left = `${chestPosition.left}px`;
        
        currentStep = -1;
        happyFeetChar.style.opacity = 1;
        happyFeetChar.style.top = `calc(50% - 20px)`;
        happyFeetChar.style.left = `20px`;

        nextComplimentBtn.style.display = 'block';
        unlockSubmitBtn.style.display = 'none';
        unlockInput.style.display = 'none';
        document.querySelector('#unlock-keypad label').style.display = 'none';

        nextComplimentBtn.addEventListener('click', takeStep);
    }
    
    function takeStep() {
        currentStep++;
        if (currentStep < stones.length) {
            const stone = stones[currentStep];
            stone.style.opacity = 1;
            const stoneRect = stone.getBoundingClientRect();
            const containerRect = pathContainer.getBoundingClientRect();
            happyFeetChar.style.top = `${stoneRect.top - containerRect.top}px`;
            happyFeetChar.style.left = `${stoneRect.left - containerRect.left}px`;
        }
        
        if (currentStep >= stones.length) {
            happyFeetChar.style.top = `${chestPosition.top}px`;
            happyFeetChar.style.left = `${chestPosition.left - happyFeetChar.offsetWidth}px`;
            nextComplimentBtn.style.display = 'none';
            unlockSubmitBtn.style.display = 'block';
            unlockInput.style.display = 'block';
            document.querySelector('#unlock-keypad label').style.display = 'block';
        }
    }
    
    document.querySelector('#puzzle-continue-btn').addEventListener('click', () => {
        navigateTo('unlock-scene');
        initUnlockAnimation();
    });


    // --- Letter Scene ---
    const envelope = document.getElementById('envelope');
    const letterHeading = document.getElementById('letter-heading');
    const letterBody = document.getElementById('letter-body');
    const letterControls = document.getElementById('letter-controls');
    const replayConfettiBtn = document.getElementById('replay-confetti-btn');
    let backgroundSong;
    
    const letterText = `Love evolves. It occupies different shapes and sizes over time. It truly is all things, and I wouldn't have gotten the opportunity to learn what it is without you in my life to love.

You have brought me ever so closer to tasting unconditional love one sweet moment at a time, and some uncomfortable ones.

For us, love has meant a great many things. It has meant bliss, joy, laughter, companionship, food, adventures, dates, music, safety, comfort, growth, patience. Other times it has meant the complete opposite of these beautiful things listed above, and I have since learned that even the painful ones are love: our love.

To love you for its own sake has always been the goal for me: to offer you a love that never holds you back, that enables you to be whatever you wish to be and do. A love that brings to your life the best things life can offer any one person.

Year 3 may not have achieved this, but we did learn a lot and found our way back to each other. As we start Year 4 of our love story, our redemption arc, let us go into it with an appreciation for the complexities love offers so we can enjoy its beauty ever more.

Happy Anniversary.

I love you, baby.`;
    
    function typeWriter(element, text, i = 0) {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            const delay = reducedMotion ? 5 : 40;
            setTimeout(() => typeWriter(element, text, i + 1), delay);
        } else {
            letterControls.style.display = 'flex';
        }
    }

    function playHeartsConfetti() {
        if (reducedMotion) return;
        
        const end = Date.now() + (3 * 1000);
        const colors = ['#ff69b4', '#ff85c1', '#f0f0f0'];

        (function frame() {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
    
    envelope.addEventListener('click', () => {
        if(envelope.classList.contains('open')) return;
        
        envelope.classList.add('open');
        playClickSound();

        // Start song
        if (!backgroundSong) {
            backgroundSong = new Audio('song.mp3');
            backgroundSong.loop = true;
            backgroundSong.play();
        }

        setTimeout(() => {
            letterHeading.textContent = "Dear Happy Feet 🐧";
            letterBody.innerHTML = '';
            typeWriter(letterBody, letterText);
            playHeartsConfetti();
        }, 600);
    }, { once: true });

    replayConfettiBtn.addEventListener('click', playHeartsConfetti);

});
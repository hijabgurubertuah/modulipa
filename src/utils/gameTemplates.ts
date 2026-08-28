export interface GameTemplate {
  id: string;
  name: string;
  type: 'custom_html' | 'custom_tsx';
  category: string;
  description: string;
  code: string;
}

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'word-guess',
    name: 'Game Tebak Kata (Word Guess)',
    type: 'custom_html',
    category: 'Bahasa / Istilah',
    description: 'Siswa menebak huruf untuk mengungkap kata misteri berdasarkan petunjuk.',
    code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tebak Kata</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; }
    .letter-box { transition: all 0.2s; }
  </style>
</head>
<body class="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 min-h-screen text-white p-4 flex flex-col items-center justify-center">
  <div class="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl text-center">
    <div class="inline-block px-3 py-1 bg-amber-400 text-slate-900 font-extrabold text-xs rounded-full uppercase tracking-wider mb-2">
      Mini Game Edukasi
    </div>
    <h2 class="text-2xl font-black mb-1">🎮 Tebak Kata Pintar</h2>
    <p id="clue" class="text-sm text-amber-200 mb-6 font-medium">Petunjuk: Proses pembuatan makanan pada tumbuhan hijau.</p>

    <!-- Word Display -->
    <div id="wordContainer" class="flex justify-center gap-2 mb-6 flex-wrap"></div>

    <!-- Stats -->
    <div class="flex justify-between text-xs text-slate-300 font-semibold mb-4 px-2">
      <span>Kesempatan Salah: <b id="chances" class="text-rose-400 text-sm">6</b></span>
      <span>Skor: <b id="score" class="text-emerald-400 text-sm">100</b></span>
    </div>

    <!-- Virtual Keyboard -->
    <div id="keyboard" class="grid grid-cols-7 gap-1.5 mb-6"></div>

    <!-- Message & Reset -->
    <div id="message" class="text-sm font-bold min-h-[24px] mb-3"></div>
    <button id="resetBtn" onclick="initGame()" class="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-lg hidden">
      Main Ulang 🔄
    </button>
  </div>

  <script>
    const WORD = "FOTOSINTESIS";
    let guessedLetters = new Set();
    let wrongCount = 0;
    const maxWrong = 6;

    function initGame() {
      guessedLetters.clear();
      wrongCount = 0;
      document.getElementById('chances').innerText = maxWrong - wrongCount;
      document.getElementById('score').innerText = '100';
      document.getElementById('message').innerHTML = '';
      document.getElementById('resetBtn').classList.add('hidden');
      renderWord();
      renderKeyboard();
    }

    function renderWord() {
      const container = document.getElementById('wordContainer');
      container.innerHTML = '';
      let isWin = true;

      for (let char of WORD) {
        const box = document.createElement('div');
        box.className = 'w-9 h-11 border-2 border-white/40 bg-white/20 rounded-lg flex items-center justify-center text-lg font-black text-white shadow-md';
        if (guessedLetters.has(char)) {
          box.innerText = char;
          box.classList.add('border-emerald-400', 'bg-emerald-500/30');
        } else {
          box.innerText = '_';
          isWin = false;
        }
        container.appendChild(box);
      }

      if (isWin) {
        document.getElementById('message').innerHTML = '<span class="text-emerald-300 animate-bounce">🎉 Luar Biasa! Jawabanmu Benar!</span>';
        document.getElementById('resetBtn').classList.remove('hidden');
        if (window.parent) {
          window.parent.postMessage({ type: 'GAME_COMPLETE', score: 100 }, '*');
        }
      }
    }

    function renderKeyboard() {
      const kb = document.getElementById('keyboard');
      kb.innerHTML = '';
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

      for (let char of letters) {
        const btn = document.createElement('button');
        btn.innerText = char;
        btn.className = 'p-2 bg-white/20 hover:bg-white/40 active:scale-90 rounded-lg font-bold text-xs transition-all disabled:opacity-30 disabled:pointer-events-none';
        btn.onclick = () => handleGuess(char, btn);
        kb.appendChild(btn);
      }
    }

    function handleGuess(char, btn) {
      btn.disabled = true;
      guessedLetters.add(char);

      if (!WORD.includes(char)) {
        wrongCount++;
        document.getElementById('chances').innerText = maxWrong - wrongCount;
        btn.classList.add('bg-rose-500/40');
        const curScore = Math.max(0, 100 - (wrongCount * 15));
        document.getElementById('score').innerText = curScore;

        if (wrongCount >= maxWrong) {
          document.getElementById('message').innerHTML = '<span class="text-rose-400">Game Over! Kata: ' + WORD + '</span>';
          document.getElementById('resetBtn').classList.remove('hidden');
          // disable all
          document.querySelectorAll('#keyboard button').forEach(b => b.disabled = true);
          return;
        }
      } else {
        btn.classList.add('bg-emerald-500/40');
      }

      renderWord();
    }

    initGame();
  </script>
</body>
</html>`
  },
  {
    id: 'quiz-arcade',
    name: 'Kuis Cepat Berwaktu (Speed Quiz)',
    type: 'custom_html',
    category: 'Evaluasi / Kuis Interaktif',
    description: 'Game kuis 4 opsi dengan animasi waktu mundur dan akumulasi skor.',
    code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Speed Quiz</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-white min-h-screen flex items-center justify-center p-4">
  <div class="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider" id="qNum">Soal 1 / 3</span>
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-400">Waktu:</span>
        <span id="timer" class="px-2.5 py-0.5 bg-rose-500 text-white font-mono font-bold text-xs rounded-full">15s</span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
      <div id="bar" class="bg-emerald-500 h-full transition-all duration-300" style="width: 33%"></div>
    </div>

    <!-- Question -->
    <div class="py-2">
      <h3 id="questionText" class="text-lg font-bold text-slate-100 leading-snug">
        Pertanyaan sedang dimuat...
      </h3>
    </div>

    <!-- Options -->
    <div id="optionsContainer" class="space-y-2.5"></div>

    <!-- Footer Stats -->
    <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700">
      <span>Total Skor: <b id="score" class="text-amber-400 text-sm">0</b></span>
      <span id="status" class="font-semibold text-emerald-400"></span>
    </div>
  </div>

  <script>
    const questions = [
      {
        q: "Zat hijau daun yang berperan menangkap sinar matahari disebut?",
        options: ["Klorofil", "Stomata", "Sitoplasma", "Mitokondria"],
        ans: 0
      },
      {
        q: "Gas yang dihasilkan tumbuhan saat proses fotosintesis adalah?",
        options: ["Karbon Dioksida", "Oksigen", "Nitrogen", "Hidrogen"],
        ans: 1
      },
      {
        q: "Organel sel yang menjadi tempat terjadinya fotosintesis adalah?",
        options: ["Ribosom", "Vakuola", "Kloroplas", "Dinding Sel"],
        ans: 2
      }
    ];

    let curIdx = 0;
    let score = 0;
    let timerInterval = null;
    let timeLeft = 15;

    function startQuestion() {
      if (curIdx >= questions.length) {
        showEnd();
        return;
      }
      clearInterval(timerInterval);
      timeLeft = 15;
      document.getElementById('timer').innerText = timeLeft + 's';
      document.getElementById('qNum').innerText = \`Soal \${curIdx + 1} / \${questions.length}\`;
      document.getElementById('bar').style.width = \`\${((curIdx + 1) / questions.length) * 100}%\`;

      const q = questions[curIdx];
      document.getElementById('questionText').innerText = q.q;

      const optsBox = document.getElementById('optionsContainer');
      optsBox.innerHTML = '';

      q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left p-3.5 rounded-xl bg-slate-700/70 hover:bg-indigo-600 border border-slate-600 transition-all font-medium text-sm flex items-center justify-between cursor-pointer';
        btn.innerHTML = \`<span>\${String.fromCharCode(65 + idx)}. \${opt}</span>\`;
        btn.onclick = () => selectAnswer(idx);
        optsBox.appendChild(btn);
      });

      timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft + 's';
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          selectAnswer(-1);
        }
      }, 1000);
    }

    function selectAnswer(chosenIdx) {
      clearInterval(timerInterval);
      const q = questions[curIdx];
      const buttons = document.querySelectorAll('#optionsContainer button');

      buttons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === q.ans) {
          btn.className = 'w-full text-left p-3.5 rounded-xl bg-emerald-600 border border-emerald-400 font-bold text-sm text-white';
        } else if (idx === chosenIdx) {
          btn.className = 'w-full text-left p-3.5 rounded-xl bg-rose-600 border border-rose-400 font-bold text-sm text-white';
        }
      });

      if (chosenIdx === q.ans) {
        const points = Math.round(100 / questions.length);
        score += points;
        document.getElementById('score').innerText = score;
        document.getElementById('status').innerText = '+ ' + points + ' Poin!';
      } else {
        document.getElementById('status').innerText = 'Salah / Waktu Habis';
      }

      setTimeout(() => {
        curIdx++;
        document.getElementById('status').innerText = '';
        startQuestion();
      }, 1200);
    }

    function showEnd() {
      document.getElementById('questionText').innerText = "🎉 Kuis Selesai!";
      document.getElementById('optionsContainer').innerHTML = \`
        <div class="text-center py-6 space-y-3">
          <p class="text-slate-300 text-sm">Nilai Akhir Kamu:</p>
          <div class="text-5xl font-black text-amber-400">\${score}</div>
          <p class="text-xs text-emerald-300 font-bold">Hebat! Kamu telah menyelesaikan mini game kuis.</p>
          <button onclick="curIdx=0;score=0;startQuestion();" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
            Ulangi Kuis 🔄
          </button>
        </div>
      \`;
      document.getElementById('timer').innerText = '0s';
      if (window.parent) {
        window.parent.postMessage({ type: 'GAME_COMPLETE', score: score }, '*');
      }
    }

    startQuestion();
  </script>
</body>
</html>`
  },
  {
    id: 'canvas-catcher',
    name: 'Game Tangkap Bintang (Canvas Arcade)',
    type: 'custom_html',
    category: 'Arcade / Ketangkasan',
    description: 'Game grafis canvas interaktif: Gerakkan keranjang ke kiri/kanan untuk menangkap bintang pengetahuan.',
    code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Star Catcher</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { touch-action: none; }
  </style>
</head>
<body class="bg-slate-950 text-white min-h-screen flex flex-col items-center justify-center p-3 select-none">
  <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col items-center gap-3">
    <div class="flex items-center justify-between w-full px-2">
      <span class="text-xs font-black uppercase text-amber-400">🌟 Star Knowledge Catcher</span>
      <span class="text-xs font-mono">Skor: <b id="scoreVal" class="text-emerald-400 text-sm">0</b>/10</span>
    </div>

    <canvas id="gameCanvas" width="360" height="400" class="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border border-white/10 w-full"></canvas>

    <!-- Mobile Touch Controls -->
    <div class="grid grid-cols-2 gap-3 w-full">
      <button id="btnLeft" class="py-3 bg-white/10 active:bg-indigo-600 rounded-xl text-center text-sm font-bold transition-all border border-white/10">
        ⬅️ Kiri
      </button>
      <button id="btnRight" class="py-3 bg-white/10 active:bg-indigo-600 rounded-xl text-center text-sm font-bold transition-all border border-white/10">
        Kanan ➡️
      </button>
    </div>

    <p class="text-[11px] text-slate-400 text-center">
      Gunakan tombol di atas atau tombol panah keyboard untuk mengarahkan mangkuk!
    </p>
  </div>

  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let score = 0;
    const targetScore = 10;
    let isGameOver = false;

    const basket = {
      x: 140,
      y: 350,
      width: 70,
      height: 18,
      speed: 6,
      dx: 0
    };

    let stars = [];

    function spawnStar() {
      stars.push({
        x: Math.random() * (canvas.width - 30) + 15,
        y: -10,
        radius: 12,
        speed: 2 + Math.random() * 2,
        char: ['🌟', '⭐', '✨'][Math.floor(Math.random() * 3)]
      });
    }

    setInterval(() => {
      if (!isGameOver && stars.length < 5) {
        spawnStar();
      }
    }, 1000);

    function update() {
      if (isGameOver) return;

      basket.x += basket.dx;
      if (basket.x < 0) basket.x = 0;
      if (basket.x + basket.width > canvas.width) basket.x = canvas.width - basket.width;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.y += s.speed;

        // Check collision
        if (
          s.y + s.radius >= basket.y &&
          s.x >= basket.x &&
          s.x <= basket.x + basket.width
        ) {
          score++;
          document.getElementById('scoreVal').innerText = score;
          stars.splice(i, 1);
          i--;

          if (score >= targetScore) {
            isGameOver = true;
            if (window.parent) {
              window.parent.postMessage({ type: 'GAME_COMPLETE', score: 100 }, '*');
            }
          }
        } else if (s.y > canvas.height + 20) {
          stars.splice(i, 1);
          i--;
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Basket
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.roundRect(basket.x, basket.y, basket.width, basket.height, [8, 8, 16, 16]);
      ctx.fill();

      // Draw Basket Rim
      ctx.fillStyle = '#a5b4fc';
      ctx.fillRect(basket.x + 4, basket.y + 2, basket.width - 8, 4);

      // Draw Stars
      for (const s of stars) {
        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.char, s.x, s.y);
      }

      if (isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 22px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 MISI SELESAI!', canvas.width / 2, canvas.height / 2 - 10);

        ctx.fillStyle = '#ffffff';
        ctx.font = '13px system-ui';
        ctx.fillText('Kamu berhasil menangkap ' + targetScore + ' bintang!', canvas.width / 2, canvas.height / 2 + 20);
      }
    }

    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }

    // Keyboard controls
    window.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') basket.dx = -basket.speed;
      if (e.key === 'ArrowRight') basket.dx = basket.speed;
    });
    window.addEventListener('keyup', e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') basket.dx = 0;
    });

    // Touch controls
    const bLeft = document.getElementById('btnLeft');
    const bRight = document.getElementById('btnRight');
    bLeft.onmousedown = bLeft.ontouchstart = () => { basket.dx = -basket.speed; };
    bLeft.onmouseup = bLeft.ontouchend = () => { basket.dx = 0; };
    bRight.onmousedown = bRight.ontouchstart = () => { basket.dx = basket.speed; };
    bRight.onmouseup = bRight.ontouchend = () => { basket.dx = 0; };

    loop();
  </script>
</body>
</html>`
  },
  {
    id: 'react-tsx-flashcard',
    name: 'Game Kartu Interaktif (React / TSX)',
    type: 'custom_tsx',
    category: 'React / TSX Component',
    description: 'Komponen React interaktif berbasis TSX dengan kartu berbalik (flip card), status pemahaman, dan perolehan skor.',
    code: `import React, { useState } from 'react';

export default function FlashcardGame() {
  const cards = [
    {
      q: "Apa fungsi utama mitokondria dalam sel?",
      a: "Sebagai 'pabrik energi' sel yang menghasilkan ATP melalui respirasi seluler.",
      badge: "Biologi Sel"
    },
    {
      q: "Apa yang dimaksud dengan stomata?",
      a: "Celah atau pori pada epidermis daun untuk pertukaran gas O2 & CO2 serta transpirasi.",
      badge: "Tumbuhan"
    },
    {
      q: "Hukum Newton I dikenal juga sebagai hukum apa?",
      a: "Hukum Kelembaman atau Inersia (Benda mempertahankan keadaan gerak/diamnya).",
      badge: "Fisika"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleNext = (mastered) => {
    if (mastered) setMasteredCount(prev => prev + 1);
    setIsFlipped(false);

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
      if (window.parent) {
        window.parent.postMessage({ type: 'GAME_COMPLETE', score: 100 }, '*');
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCount(0);
    setIsCompleted(false);
  };

  const card = cards[currentIndex];

  return (
    <div className="min-h-[420px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 flex flex-col items-center justify-center font-sans select-none">
      <div className="max-w-md w-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">
            🃏 Flashcard Pengetahuan
          </span>
          <span>Kartu {currentIndex + 1} dari {cards.length}</span>
        </div>

        {!isCompleted ? (
          <>
            {/* Flip Card Container */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full min-h-[220px] bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 shadow-xl relative group"
            >
              <span className="absolute top-3 right-3 text-[10px] font-bold text-amber-300 uppercase tracking-widest bg-amber-500/20 px-2 py-0.5 rounded">
                {card.badge}
              </span>

              <p className="text-xs text-indigo-200 mb-2 font-semibold">
                {isFlipped ? "💡 KUNCI JAWABAN:" : "❓ PERTANYAAN:"}
              </p>
              
              <h3 className="text-base sm:text-lg font-black text-slate-100 leading-snug">
                {isFlipped ? card.a : card.q}
              </h3>

              <div className="mt-4 text-[11px] text-slate-400 font-medium group-hover:text-amber-300 transition-colors">
                {isFlipped ? "🔄 Klik kartu untuk kembali ke pertanyaan" : "👆 Klik kartu untuk melihat jawaban"}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleNext(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all shadow-md"
              >
                Belum Paham ❌
              </button>
              <button
                onClick={() => handleNext(true)}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Sudah Hafal! ✅
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
            <div className="text-4xl">🎉</div>
            <h3 className="text-xl font-black text-emerald-400">Semua Kartu Selesai!</h3>
            <p className="text-xs text-slate-300">
              Kamu berhasil menghafal <b>{masteredCount}</b> dari <b>{cards.length}</b> konsep materi.
            </p>
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
            >
              Ulangi Flashcard 🔄
            </button>
          </div>
        )}
      </div>
    </div>
  );
}`
  }
];

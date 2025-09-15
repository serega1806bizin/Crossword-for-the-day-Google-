const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwKhLZxcfvpr-vVQt-0spelgA0JnvM18gS-tx1bPNjfKesWPpy8awxZs8qr2KiXN8Mc1A/exec";

let PUZZLE = null;  
let grid = [];  
const inputsByPos = new Map(); 
// ---------- маленькие UI-утилиты ----------
let toastTimer;
function showToast(text, type = "info") {
  const t = document.getElementById("toast");
  t.className = "toast " + type;
  t.textContent = text;
  // показываем
  void t.offsetWidth; // reflow
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

function showResultModal(title, html) {
  document.getElementById("resultTitle").textContent = title;
  const box = document.getElementById("resultText");
  box.innerHTML = html;
  document.getElementById("resultOverlay").style.display = "flex";
}

function setSubmitting(on) {
  if (on) {
    submitBtn.dataset.label = submitBtn.textContent;
    submitBtn.textContent = "Надсилання…";
    submitBtn.disabled = true;
  } else {
    submitBtn.textContent = submitBtn.dataset.label || "Надіслати";
    submitBtn.disabled = false;
  }
}

function setInputsEnabled(on) {
  inputsByPos.forEach((inp) => (inp.disabled = !on));
  document.getElementById("checkBtn").disabled = !on;
  document.getElementById("submitBtn").disabled = !on;
}

function toMMSS(s) {
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function startTimer() {
  startedAt = Date.now();
  tickTimer = setInterval(() => {
    const sec = Math.floor((Date.now() - startedAt) / 1000);
    document.getElementById("elapsed").textContent = `${sec} с`;
    document.getElementById("timer").textContent = toMMSS(sec);
  }, 250);
}

function stopTimer() {
  if (tickTimer) clearInterval(tickTimer);
}

document.getElementById("closeResult").addEventListener("click", () => {
  document.getElementById("resultOverlay").style.display = "none";
});


const submitBtn = document.getElementById("submitBtn");

// ---------- построение сетки ----------
const gridEl = document.getElementById("grid");
const size = PUZZLE.size;
document.documentElement.style.setProperty("--grid-size", size);

const grid = Array.from({ length: size }, () =>
  Array.from({ length: size }, () => ({
    letter: null,
    num: null,
    across: null,
    down: null,
  }))
);

for (const ent of PUZZLE.entries) {
  const r0 = ent.row - 1;
  const c0 = ent.col - 1;
  const letters = ent.answer.toUpperCase();
  for (let i = 0; i < letters.length; i++) {
    const rr = r0 + (ent.dir === "down" ? i : 0);
    const cc = c0 + (ent.dir === "across" ? i : 0);
    const cell = grid[rr][cc];
    cell.letter = letters[i];
    if (ent.dir === "across") cell.across = ent.num;
    else cell.down = ent.num;
  }
  if (!grid[r0][c0].num) grid[r0][c0].num = ent.num;
}

// рендер клеток
const inputsByPos = new Map();
for (let r = 0; r < size; r++) {
  for (let c = 0; c < size; c++) {
    const cell = grid[r][c];
    const div = document.createElement("div");
    div.className = "cell" + (cell.letter ? "" : " block");

    if (cell.letter) {
      // граница сверху — нет буквы или это уже другое вертикальное слово
      const up = r > 0 ? grid[r - 1][c] : null;
      if (!up || !up.letter || up.down !== cell.down)
        div.classList.add("sep-top");

      // граница слева — нет буквы или это уже другое горизонтальное слово
      const left = c > 0 ? grid[r][c - 1] : null;
      if (!left || !left.letter || left.across !== cell.across)
        div.classList.add("sep-left");

      // внешние рамки
      if (r === 0) div.classList.add("first-row");
      if (c === 0) div.classList.add("first-col");
    }

    if (cell.num) {
      const nm = document.createElement("div");
      nm.className = "num";
      nm.textContent = cell.num;
      div.appendChild(nm);
    }

    if (cell.letter) {
      const inp = document.createElement("input");
      inp.maxLength = 1;
      inp.autocomplete = "off";
      inp.inputMode = "text";
      inp.disabled = true;
      inp.dataset.r = r;
      inp.dataset.c = c;
      inp.addEventListener("input", (e) => {
        e.target.value = e.target.value.toLocaleUpperCase("uk-UA").slice(0, 1);
        const next = inputsByPos.get(`${r},${c + 1}`);
        if (e.target.value && next) next.focus();
      });
      inp.addEventListener("keydown", (e) => {
        const r = +e.target.dataset.r,
          c = +e.target.dataset.c;
        if (e.key === "ArrowRight") inputsByPos.get(`${r},${c + 1}`)?.focus();
        else if (e.key === "ArrowLeft")
          inputsByPos.get(`${r},${c - 1}`)?.focus();
        else if (e.key === "ArrowDown")
          inputsByPos.get(`${r + 1},${c}`)?.focus();
        else if (e.key === "ArrowUp") inputsByPos.get(`${r - 1},${c}`)?.focus();
        else if (e.key === "Backspace" && !e.target.value)
          inputsByPos.get(`${r},${c - 1}`)?.focus();
      });
      div.appendChild(inp);
      inputsByPos.set(`${r},${c}`, inp);
    }
    gridEl.appendChild(div);
  }
}

// подсказки
const cluesAcross = document.getElementById("clues-across");
const cluesDown = document.getElementById("clues-down");
for (const ent of PUZZLE.entries.filter((e) => e.dir === "across")) {
  const p = document.createElement("div");
  p.innerHTML = `<b>${ent.num}.</b> ${ent.clue}`;
  cluesAcross.appendChild(p);
}
for (const ent of PUZZLE.entries.filter((e) => e.dir === "down")) {
  const p = document.createElement("div");
  p.innerHTML = `<b>${ent.num}.</b> ${ent.clue}`;
  cluesDown.appendChild(p);
}
document.getElementById("acrossCard").style.display = "none";
document.getElementById("downCard").style.display = "none";

// таймер
let startedAt = null,
  tickTimer = null;

function stopTimer() {
  if (tickTimer) clearInterval(tickTimer);
}


// Загружаем скелет пазла с сервера (без ответов)
async function loadPuzzleSkeleton(eventName) {
  const url = new URL(WEB_APP_URL);
  url.searchParams.set('action','puzzle');
  url.searchParams.set('event', eventName || 'День народження Google');
  const resp = await fetch(url.toString());
  const j = await resp.json();
  if (!j.ok) throw new Error('Не удалось загрузить пазл');
  return j.puzzle; // { size, entries: [{num,dir,row,col,len,clue}] }
}


// проверка
function check() {
  let correct = 0,
    total = 0;
  inputsByPos.forEach((inp, key) => {
    const [r, c] = key.split(",").map(Number);
    const cell = grid[r][c];
    if (!cell.letter) return;
    total++;
    const good = (inp.value || "").toUpperCase() === cell.letter;
    inp.style.background = good ? "var(--ok)" : inp.value ? "var(--bad)" : "";
    if (good) correct++;
  });
  document.getElementById("score").textContent = `${correct} / ${total}`;
  return { correct, total };
}
function collectAnswers() {
  const answers = {};
  for (const ent of PUZZLE.entries) {
    const letters = [];
    for (let i = 0; i < ent.answer.length; i++) {
      const r = ent.row - 1 + (ent.dir === "down" ? i : 0);
      const c = ent.col - 1 + (ent.dir === "across" ? i : 0);
      letters.push((inputsByPos.get(`${r},${c}`)?.value || " ").toUpperCase());
    }
    answers[`${ent.num}-${ent.dir}`] = {
      clue: ent.clue,
      expected: ent.answer.toUpperCase(),
      typed: letters.join("").trimEnd(),
    };
  }
  return answers;
}

async function checkOnServer() {
  const answers = collectAnswers(); // как сейчас, map { "num-dir": {typed, clue, expected?} }
  // expected можно не слать, но если слать — на сервере мы его игнорим

  const res = await fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'check',
      event: document.getElementById('event').value.trim() || 'День народження Google',
      answers
    })
  });
  const j = await res.json();
  if (!j.ok) throw new Error('check failed');
  // j.hits — объект: ключ "num-dir" -> массив true/false по символам
  // j.score — {correct,total}
  return j;
}

// кнопки
document.getElementById("checkBtn").addEventListener("click", async () => {
  try {
    const { hits, score } = await checkOnServer();

    // Подсветка ячеек по hits (не раскрывая буквы)
    for (const ent of PUZZLE.entries) {
      const id = `${ent.num}-${ent.dir}`;
      const arr = hits[id] || [];
      for (let i=0;i<arr.length;i++){
        const r = ent.row - 1 + (ent.dir === "down" ? i : 0);
        const c = ent.col - 1 + (ent.dir === "across" ? i : 0);
        const inp = inputsByPos.get(`${r},${c}`);
        if (!inp) continue;
        inp.style.background = arr[i] ? "var(--ok)" : (inp.value ? "var(--bad)" : "");
      }
    }

    document.getElementById("score").textContent = `${score.correct} / ${score.total}`;
    showToast(`Перевірено: ${score.correct}/${score.total}`, "info");
  } catch(e) {
    console.error(e);
    showToast('Помилка перевірки', 'danger');
  }
});


document.getElementById("startBtn").addEventListener("click", async () => {
  const eventName = document.getElementById("event").value.trim() || 'День народження Google';
  try {
    // грузим пазл
    const puzzle = await loadPuzzleSkeleton(eventName);
    PUZZLE = puzzle; // теперь без ответов
    buildGridAndClues(PUZZLE); // твоя функция сборки сетки, используй entry.len
    // далее как раньше:
    document.getElementById("acrossCard").style.display = "";
    document.getElementById("downCard").style.display = "";
    setInputsEnabled(true);
    document.getElementById("overlay").style.display = "none";
    startTimer();
    inputsByPos.get("0,0")?.focus();
  } catch(e) {
    showToast('Не вдалося завантажити пазл', 'danger');
    console.error(e);
  }
});


document.getElementById("submitBtn").addEventListener("click", async () => {
  const durationSec = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : null;
  const payload = {
    event: document.getElementById('event').value.trim() || 'День народження Google',
    team: document.getElementById('team').value.trim(),
    participant: document.getElementById('participant').value.trim(),
    answers: collectAnswers(),
    durationSec,
    userAgent: navigator.userAgent
  };

  try {
    setSubmitting(true);
    // одна серверная операция: проверил + записал
    const res = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload) // без action => сервер записывает, считая score сам
    });
    const j = await res.json();
    if (!j.ok) throw new Error('save failed');

    const score = j.score; // от сервера
    // далее как у тебя: best
    const url = new URL(WEB_APP_URL);
    url.searchParams.set('action','best');
    url.searchParams.set('event', payload.event);
    const bestResp = await fetch(url.toString(), { method:'GET' });
    const best = (await bestResp.json()).best;

    const myAcc = score.total ? (score.correct / score.total) : 0;
    const bestAcc = best && best.total ? (best.correct / best.total) : 0;
    const eps = 1e-9;
    const myBetter = (myAcc > bestAcc + eps) ||
                     (Math.abs(myAcc - bestAcc) <= eps && durationSec < best.durationSec);

    const html = (myBetter
      ? "Вітаю! На даний момент ви найкращі! Очікуйте завершення конкурсу."
      : "На жаль, вже є учасник, який показав кращий результат (більше правильних або швидше).")
      + `<br><br><b>Ваш час:</b> ${toMMSS(durationSec)} | <b>Бал:</b> ${score.correct}/${score.total}
         <br><b>Точність:</b> ${Math.round(myAcc*100)}%`;

    stopTimer();
    showResultModal('Результат', html);
    showToast('Відправлено в таблицю', 'success');
  } catch(e) {
    console.error(e);
    showToast('Помилка відправлення', 'danger');
  } finally {
    setSubmitting(false);
  }
});


const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwKhLZxcfvpr-vVQt-0spelgA0JnvM18gS-tx1bPNjfKesWPpy8awxZs8qr2KiXN8Mc1A/exec";

const PUZZLE = {
  size: 15,
  entries: [
    {
      num: 1,
      dir: "across",
      row: 2,
      col: 3,
      answer: "ЮТУБ",
      clue: "Відеоплатформа, що належить Google.",
    },
    {
      num: 3,
      dir: "across",
      row: 4,
      col: 2,
      answer: "ПЕЙДЖРАНК",
      clue: "Алгоритм ранжування сторінок.",
    },
    {
      num: 8,
      dir: "across",
      row: 6,
      col: 4,
      answer: "БРІН",
      clue: "Прізвище співзасновника Google.",
    },
    {
      num: 5,
      dir: "across",
      row: 7,
      col: 9,
      answer: "ГУГОЛ",
      clue: "Число яке використав Google для своєї назви.",
    },
    {
      num: 10,
      dir: "across",
      row: 8,
      col: 4,
      answer: "ХРОМ",
      clue: "Популярний браузер від Google.",
    },
    {
      num: 7,
      dir: "across",
      row: 9,
      col: 12,
      answer: "ДУДЛ",
      clue: "Святковий малюнок на головній сторінці Google.",
    },
    {
      num: 9,
      dir: "across",
      row: 10,
      col: 2,
      answer: "ПЕЙДЖ",
      clue: "Один із співзасновників Google.",
    },
    {
      num: 11,
      dir: "across",
      row: 12,
      col: 1,
      answer: "ДІПМАЙНД",
      clue: "Лабораторія ШІ, що належить Google.",
    },

    // ——— Down (вертикаль) ———
    // стоим так, чтобы пересечения с (2) шли по совпадающим буквам
    {
      num: 2,
      dir: "down",
      row: 1,
      col: 5,
      answer: "СУНДАРАРАДЖАН",
      clue: "Імя головного директора Google.",
    }, // пересекает (2) по букве «Р» в колонке 5
    {
      num: 4,
      dir: "down",
      row: 4,
      col: 10,
      answer: "КЛАУД",
      clue: "Хмарні сервіси від Google.",
    }, // пересекает (2) по «І» в колонке 6
    {
      num: 6,
      dir: "down",
      row: 3,
      col: 12,
      answer: "АНДРОЇД",
      clue: "ОС для смартфонів від Google.",
    },
    {
      num: 12,
      dir: "down",
      row: 2,
      col: 8,
      answer: "США",
      clue: "Країна заснування Google.",
    },
  ],
};

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
document.getElementById("closeResult").addEventListener("click", () => {
  document.getElementById("resultOverlay").style.display = "none";
});

function setInputsEnabled(on) {
  inputsByPos.forEach((inp) => (inp.disabled = !on));
  document.getElementById("checkBtn").disabled = !on;
  document.getElementById("submitBtn").disabled = !on;
}

const submitBtn = document.getElementById("submitBtn");
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
function toMMSS(s) {
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
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

// кнопки
document.getElementById("checkBtn").addEventListener("click", () => {
  const s = check();
  showToast(`Перевірено: ${s.correct}/${s.total}`, "info");
});

document.getElementById("startBtn").addEventListener("click", () => {
  document.getElementById("acrossCard").style.display = "";
  document.getElementById("downCard").style.display = "";
  setInputsEnabled(true);
  document.getElementById("overlay").style.display = "none";
  startTimer();
  inputsByPos.get("0,0")?.focus();
});

document.getElementById("submitBtn").addEventListener("click", async () => {
  const score = check();
  const durationSec = startedAt
    ? Math.floor((Date.now() - startedAt) / 1000)
    : null;

  const payload = {
    event: document.getElementById("event").value.trim(),
    team: document.getElementById("team").value.trim(),
    participant: document.getElementById("participant").value.trim(),
    answers: collectAnswers(),
    score,
    durationSec,
    userAgent: navigator.userAgent,
  };

  if (!WEB_APP_URL || WEB_APP_URL.includes("PASTE_YOUR")) {
    showToast("Встав WEB_APP_URL у коді", "danger");
    return;
  }

  try {
    setSubmitting(true);
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const ok =
      res.ok &&
      (
        await res
          .clone()
          .json()
          .catch(() => ({ ok: true }))
      ).ok !== false;
    if (!ok) {
      showToast("Помилка збереження", "danger");
      setSubmitting(false);
      return;
    }

    // Запитати найкращий результат
    const url = new URL(WEB_APP_URL);
    url.searchParams.set("action", "best");
    url.searchParams.set("event", payload.event);
    const bestResp = await fetch(url.toString(), { method: "GET" });
    const best = (await bestResp.json()).best;

    let html;
    if (!best) {
      html = `Вітаю! На даний момент ви найкращі!<br>Очікуйте завершення конкурсу.<br><br><b>Ваш час:</b> ${toMMSS(
        durationSec
      )}<br><b>Бал:</b> ${score.correct}/${score.total}`;
    } else {
      const myBetter =
        score.correct > best.correct ||
        (score.correct === best.correct && durationSec < best.durationSec);
      html =
        (myBetter
          ? "Вітаю! На даний момент ви найкращі! Очікуйте завершення конкурсу."
          : "На жаль, вже є учасник, який показав кращий результат (більше правильних або швидше).") +
        `<br><br><b>Ваш час:</b> ${toMMSS(durationSec)} | <b>Бал:</b> ${
          score.correct
        }/${score.total}`;
    }
    stopTimer();
    showResultModal("Результат", html);
    showToast("Відправлено в таблицю", "success");
  } catch (e) {
    console.error(e);
    showToast("Помилка відправлення: " + e.message, "danger");
  } finally {
    setSubmitting(false);
  }
});

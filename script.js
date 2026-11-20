/* ===== Life Dashboard — script ===== */
/* Vanilla JS. All data persists in localStorage (client-side only). */

(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, "0");
  const FOCUS_MINUTES = 25;
  const FOCUS_SECONDS = FOCUS_MINUTES * 60;

  const STORAGE = {
    todos: "lifeDash.todos",
    links: "lifeDash.links",
  };

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn("Failed to read", key, e);
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Failed to write", key, e);
    }
  }

  /* =========================================================
     Greeting: live clock + time-based greeting
  ========================================================= */
  const greetingText = $("greetingText");
  const dateTime = $("dateTime");
  let greetingName = "";

  function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes();

    dateTime.textContent =
      `${formatTime(now)} • ${now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}`;

    let part;
    if (hours < 5) part = "Good night";
    else if (hours < 12) part = "Good morning";
    else if (hours < 18) part = "Good afternoon";
    else part = "Good evening";

    greetingText.textContent = greetingName
      ? `${part}, ${greetingName}!`
      : `${part}!`;
    void mins;
  }

  function formatTime(d) {
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${pad(m)} ${ampm}`;
  }

  updateClock();
  setInterval(updateClock, 1000);

  /* =========================================================
     Focus Timer (Pomodoro 25:00)
  ========================================================= */
  const timerDisplay = $("timerDisplay");
  const startBtn = $("startBtn");
  const stopBtn = $("stopBtn");
  const resetBtn = $("resetBtn");

  let remaining = FOCUS_SECONDS; // seconds left
  let ticker = null;

  function renderTimer() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    timerDisplay.textContent = `${pad(m)}:${pad(s)}`;
  }

  function startTimer() {
    if (ticker) return; // already running
    if (remaining <= 0) remaining = FOCUS_SECONDS;
    timerDisplay.classList.add("running");
    ticker = setInterval(() => {
      remaining -= 1;
      renderTimer();
      if (remaining <= 0) {
        stopTimer();
        timerDisplay.classList.remove("running");
        alert("Focus time is up! Great work. 🎉");
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(ticker);
    ticker = null;
    timerDisplay.classList.remove("running");
  }

  function resetTimer() {
    stopTimer();
    remaining = FOCUS_SECONDS;
    renderTimer();
  }

  startBtn.addEventListener("click", startTimer);
  stopBtn.addEventListener("click", stopTimer);
  resetBtn.addEventListener("click", resetTimer);
  renderTimer();

  /* =========================================================
     To-Do List: add, edit, toggle done, delete + persistence
  ========================================================= */
  const todoForm = $("todoForm");
  const todoInput = $("todoInput");
  const todoList = $("todoList");
  const todoEmpty = $("todoEmpty");

  let todos = load(STORAGE.todos, []);
  // normalize: ensure each has id, text, done
  todos = todos.map((t, i) => ({
    id: t.id != null ? t.id : Date.now() + i,
    text: String(t.text || ""),
    done: !!t.done,
  }));

  function renderTodos() {
    todoList.innerHTML = "";
    todoEmpty.classList.toggle("hidden", todos.length > 0);

    todos.forEach((todo) => {
      const li = document.createElement("li");
      li.className = "todo-item" + (todo.done ? " done" : "");
      li.dataset.id = todo.id;

      // checkbox to toggle done
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "todo-checkbox";
      checkbox.checked = todo.done;
      checkbox.addEventListener("change", () => toggleDone(todo.id));

      // text (click to edit)
      const span = document.createElement("span");
      span.className = "todo-text";
      span.textContent = todo.text;
      span.title = "Click to edit";
      span.style.cursor = "pointer";
      span.addEventListener("click", () => startEdit(li, todo));

      // action buttons
      const actions = document.createElement("div");
      actions.className = "todo-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-icon";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => startEdit(li, todo));

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-icon btn-danger";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => deleteTodo(todo.id));

      actions.append(editBtn, delBtn);
      li.append(checkbox, span, actions);
      todoList.appendChild(li);
    });
  }

  function startEdit(li, todo) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "edit-input";
    input.value = todo.text;
    input.maxLength = 120;

    const save = () => {
      const val = input.value.trim();
      if (val) {
        todo.text = val;
        saveTodos();
      }
      renderTodos();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") save();
      else if (e.key === "Escape") renderTodos();
    });
    input.addEventListener("blur", save);

    li.innerHTML = "";
    li.append(input);
    input.focus();
    input.select();
  }

  function saveTodos() {
    save(STORAGE.todos, todos);
  }

  function addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    todos.unshift({ id: Date.now(), text: trimmed, done: false });
    saveTodos();
    renderTodos();
  }

  function toggleDone(id) {
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      todo.done = !todo.done;
      saveTodos();
      renderTodos();
    }
  }

  function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    saveTodos();
    renderTodos();
  }

  todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addTodo(todoInput.value);
    todoInput.value = "";
    todoInput.focus();
  });

  renderTodos();

  /* =========================================================
     Quick Links: add, open, remove + persistence
  ========================================================= */
  const linkForm = $("linkForm");
  const linkName = $("linkName");
  const linkUrl = $("linkUrl");
  const linkList = $("linkList");
  const linkEmpty = $("linkEmpty");

  let links = load(STORAGE.links, []);
  links = links
    .filter((l) => l && l.name && l.url)
    .map((l, i) => ({
      id: l.id != null ? l.id : Date.now() + i,
      name: String(l.name),
      url: String(l.url),
    }));

  // Seed with a few defaults on first run.
  if (load(STORAGE.links, null) === null && links.length === 0) {
    links = [
      { id: Date.now(), name: "Google", url: "https://google.com" },
      { id: Date.now() + 1, name: "GitHub", url: "https://github.com" },
      { id: Date.now() + 2, name: "YouTube", url: "https://youtube.com" },
    ];
    save(STORAGE.links, links);
  }

  function normalizeUrl(url) {
    let u = url.trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    return u;
  }

  function renderLinks() {
    linkList.innerHTML = "";
    linkEmpty.classList.toggle("hidden", links.length > 0);

    links.forEach((link) => {
      const a = document.createElement("a");
      a.className = "link-item";
      a.href = link.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      const name = document.createElement("span");
      name.className = "link-name";
      name.textContent = link.name;

      const remove = document.createElement("button");
      remove.className = "link-remove";
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove ${link.name}`);
      remove.textContent = "×";
      remove.title = "Remove";
      remove.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteLink(link.id);
      });

      a.append(name, remove);
      linkList.appendChild(a);
    });
  }

  function saveLinks() {
    save(STORAGE.links, links);
  }

  function addLink(name, url) {
    const n = name.trim();
    const u = normalizeUrl(url);
    if (!n || !u) return;
    links.push({ id: Date.now(), name: n, url: u });
    saveLinks();
    renderLinks();
  }

  function deleteLink(id) {
    links = links.filter((l) => l.id !== id);
    saveLinks();
    renderLinks();
  }

  linkForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addLink(linkName.value, linkUrl.value);
    linkName.value = "";
    linkUrl.value = "";
    linkName.focus();
  });

  renderLinks();
})();

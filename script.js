// ------- tiny helpers -------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const keyFor = (k) => `tdb__${k}`;
const uid = () => Math.random().toString(36).slice(2, 10);

function loadTasks(k) {
  try { return JSON.parse(localStorage.getItem(keyFor(k))) || []; }
  catch { return []; }
}
function saveTasks(k, tasks) {
  localStorage.setItem(keyFor(k), JSON.stringify(tasks));
}

// ------- widget init (one instance per .todo-widget) -------
function initTodoWidget(root) {
  const listKey = root.dataset.listKey || 'todo_general';
  const els = {
    input: $('.taskInput', root),
    addBtn: $('.addBtn', root),
    list: $('.taskList', root),
    clearBtn: $('.clearCompletedBtn', root),
    counter: $('.counter', root),
  };

  let tasks = loadTasks(listKey);

  function updateCounter() {
    const remaining = tasks.filter(t => !t.done).length;
    const total = tasks.length;
    if (els.counter) els.counter.textContent = `${remaining}/${total} remaining`;
  }

  function render() {
    if (!els.list) return;
    els.list.innerHTML = '';
    for (const t of tasks) {
      const li = document.createElement('li');
      li.className = `task${t.done ? ' done' : ''}`;
      li.dataset.id = t.id;

      const checkbox = document.createElement('button');
      checkbox.className = `checkbox${t.done ? ' done' : ''}`;
      checkbox.setAttribute('aria-label', t.done ? 'Mark as not done' : 'Mark as done');
      checkbox.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M20.285 6.709a1 1 0 0 1 0 1.414l-9.19 9.19a1 1 0 0 1-1.415 0L3.715 12.34a1 1 0 0 1 1.415-1.415l4.143 4.143 8.483-8.36a1 1 0 0 1 1.529.001z"/>
        </svg>`;
      checkbox.addEventListener('click', () => {
        tasks = tasks.map(x => x.id === t.id ? { ...x, done: !x.done } : x);
        saveTasks(listKey, tasks); render();
      });

      const text = document.createElement('div');
      text.className = 'task-text';
      text.contentEditable = 'true';
      text.textContent = t.text;
      text.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); text.blur(); }
      });
      text.addEventListener('blur', () => {
        const val = text.textContent.trim();
        if (!val) {
          tasks = tasks.filter(x => x.id !== t.id);
        } else if (val !== t.text) {
          tasks = tasks.map(x => x.id === t.id ? { ...x, text: val } : x);
        }
        saveTasks(listKey, tasks); render();
      });

      const del = document.createElement('button');
      del.className = 'delete-btn';
      del.textContent = '❌';
      del.setAttribute('aria-label', 'Delete task');
      del.addEventListener('click', () => {
        tasks = tasks.filter(x => x.id !== t.id);
        saveTasks(listKey, tasks); render();
      });

      li.append(checkbox, text, del);
      els.list.appendChild(li);
    }
    updateCounter();
  }

  function addTask(txt) {
    const v = (txt || '').trim();
    if (!v) return;
    tasks.push({ id: uid(), text: v, done: false, createdAt: Date.now() });
    saveTasks(listKey, tasks); render();
  }

  els.addBtn?.addEventListener('click', () => {
    addTask(els.input.value); els.input.value = ''; els.input.focus();
  });
  els.input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { addTask(els.input.value); els.input.value = ''; }
  });
  els.clearBtn?.addEventListener('click', () => {
    tasks = tasks.filter(t => !t.done);
    saveTasks(listKey, tasks); render();
  });

  render();
}

// ------- Boot + auto-active nav -------
document.addEventListener('DOMContentLoaded', () => {
  // init all widgets on the page
  $$('.todo-widget').forEach(initTodoWidget);

  // auto-highlight current page in the nav
  const here = (() => {
    const p = location.pathname.split('/').pop();
    return p === '' ? 'index.html' : p; // handles Live Server root
  })();
  document.querySelectorAll('header nav a').forEach(a => {
    try {
      const target = new URL(a.getAttribute('href'), location.href)
        .pathname.split('/').pop();
      a.classList.toggle('active', target === here);
    } catch {}
  });
});

// ── 预置任务 ──────────────────────────────
var DEFAULT_TODOS = [
  { text: '把 Work Buddy 上和大作业相关的内容迁移到 Claude Code 上', group: 'tomorrow' },
  { text: '开始做大作业', group: 'tomorrow' },
  { text: '写手写作业', group: 'tomorrow' },
  { text: '刷完形势与政策课', group: 'week' },
  { text: '改简历、投简历', group: 'long' },
  { text: '💡 语音输入：改用手机自带输入法语音转文字，比 Web Speech API 更准', group: 'tomorrow' },
];

var GROUP_LABELS = {
  tomorrow: { title: '今天', tag: '今天', tagClass: 'tag-tomorrow' },
  week:     { title: '本周内', tag: '本周', tagClass: 'tag-week' },
  long:     { title: '长期', tag: '长期', tagClass: 'tag-long' },
};
var GROUP_ORDER = ['tomorrow', 'week', 'long'];

var todos = [];

function load() {
  try {
    var raw = localStorage.getItem('todos');
    if (raw) todos = JSON.parse(raw);
  } catch (_) {}
  if (!todos.length) {
    todos = DEFAULT_TODOS.map(function(t) {
      return { id: Date.now() + Math.random(), text: t.text, group: t.group, done: false };
    });
  }
}

function save() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

// ── 渲染 ──────────────────────────────────
function escapeHtml(s) {
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function render() {
  var container = document.getElementById('todoGroups');
  var counts = {};
  var grouped = {};
  GROUP_ORDER.forEach(function(g) {
    grouped[g] = todos.filter(function(t) { return t.group === g; });
    counts[g] = grouped[g].filter(function(t) { return !t.done; }).length;
  });

  var html = '';
  GROUP_ORDER.forEach(function(g) {
    var items = grouped[g];
    var info = GROUP_LABELS[g];
    html += '<div class="group">';
    html += '<div class="group-header">';
    html += '<h2>' + info.title + '</h2>';
    html += '<span class="count">剩 ' + counts[g] + ' 项</span>';
    html += '</div>';

    if (items.length === 0) {
      html += '<div class="empty">✨ 全部完成！</div>';
    } else {
      items.forEach(function(item) {
        html += '<div class="todo-item' + (item.done ? ' done' : '') + '" data-id="' + item.id + '">';
        html += '<input type="checkbox"' + (item.done ? ' checked' : '') + '>';
        html += '<span class="text">' + escapeHtml(item.text) + '</span>';
        html += '<button class="del">✕</button>';
        html += '</div>';
      });
    }
    html += '</div>';
  });

  container.innerHTML = html;
}

// ── 事件 ──────────────────────────────────
document.getElementById('todoGroups').addEventListener('click', function(e) {
  var itemDiv = e.target.closest('.todo-item');
  if (!itemDiv) return;
  var id = parseFloat(itemDiv.dataset.id);

  if (e.target.tagName === 'BUTTON' || e.target.classList.contains('del')) {
    todos = todos.filter(function(t) { return t.id !== id; });
    save();
    render();
    return;
  }

  if (e.target.tagName === 'INPUT' || e.target.closest('.todo-item')) {
    var todo = todos.find(function(t) { return t.id === id; });
    if (todo) {
      todo.done = !todo.done;
      save();
      render();
    }
  }
});

document.getElementById('addTodoBtn').addEventListener('click', addTodo);
document.getElementById('newTodoInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') addTodo();
});

function addTodo() {
  var input = document.getElementById('newTodoInput');
  var text = input.value.trim();
  if (!text) return;
  todos.push({ id: Date.now() + Math.random(), text: text, group: 'tomorrow', done: false });
  save();
  render();
  input.value = '';
}

// ── 日期 ──────────────────────────────────
var weekNames = ['日', '一', '二', '三', '四', '五', '六'];
var now = new Date();
var y = now.getFullYear();
var m = now.getMonth() + 1;
var d = now.getDate();
var w = weekNames[now.getDay()];
document.getElementById('dateDisplay').textContent = y + '年' + m + '月' + d + '日 周' + w;

// ── Electron 窗口控制 ─────────────────────
if (window.electronAPI) {
  window.electronAPI.onMaximizeChange(function(isMaximized) {
    var btn = document.getElementById('maxBtn');
    if (btn) btn.textContent = isMaximized ? '❐' : '□';
  });
}

// ── 键盘快捷键 ────────────────────────────
document.addEventListener('keydown', function(e) {
  // Ctrl+N 聚焦输入框
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    document.getElementById('newTodoInput').focus();
  }
});

// ── 启动 ──────────────────────────────────
load();
render();

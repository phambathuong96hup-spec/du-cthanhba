import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function createElement(value = '') {
  return {
    value,
    innerHTML: '',
    innerText: '',
    disabled: false,
    style: {},
    dataset: {},
    classList: { add() {}, remove() {} },
    appendChild() {},
    addEventListener() {},
  };
}

function createSelect(value = '') {
  return { ...createElement(value), options: [], appendChild(option) { this.options.push(option); } };
}

function createContext(extra = {}) {
  const elements = {
    searchInput: createElement(''),
    filterGroup: createElement(''),
    filterAssignee: createElement(''),
    filterStatus: createElement(''),
    filterDifficulty: createElement(''),
    filterMonth: createElement(''),
    quickFilterMode: createElement(''),
    taskBody: createElement(''),
    paginationInfo: createElement(''),
    paginationCurrent: createElement(''),
    btnPrevPage: createElement(''),
    btnNextPage: createElement(''),
    'count-all': createElement(''),
    'count-doing': createElement(''),
    'count-done': createElement(''),
    'count-waiting': createElement(''),
    'count-overdue': createElement(''),
    'count-todo': createElement(''),
  };

  const sandbox = {
    console,
    document: {
      getElementById(id) {
        return elements[id] || null;
      },
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      createElement() {
        return createElement();
      },
    },
    Option: function Option(text, value) {
      return { text, value };
    },
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
    },
    Date,
    currentUser: null,
    currentStatusFilter: 'all',
    getToday() {
      const d = new Date('2026-05-19T00:00:00+07:00');
      d.setHours(0, 0, 0, 0);
      return d;
    },
    getEffectiveStatus(status) {
      return status;
    },
    parseProgress(val) {
      return Number(String(val || '0').replace(/^'/, '').replace('%', '')) || 0;
    },
    escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
    escapeAttr(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
    jsArg(value) {
      return JSON.stringify(String(value ?? '')).replace(/"/g, '&quot;');
    },
    getRandomColor() {
      return '#123456';
    },
    getInitials(name) {
      return String(name).slice(0, 2).toUpperCase();
    },
    isAdminUser(user) {
      return user?.role === 'Admin';
    },
    ...extra,
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('public/webapp/quan-ly-cong-viec/js/tasks.js', 'utf8'), sandbox);
  return { sandbox, elements };
}

const rows = [
  ['1', 'Assigned to A only', 'Doing', '', '', '', '2026-05-18', 'A', '10', '2026-05-24', '', 'To A', '2'],
  ['2', 'Assigned to AA', 'Doing', '', '', '', '2026-05-18', 'AA', '10', '2026-05-24', '', 'To A', '2'],
  ['3', 'No deadline', 'Doing', '', '', '', '2026-05-18', 'A', '10', '', '', 'To A', '2'],
];

{
  const { sandbox, elements } = createContext();
  vm.runInContext(`globalData = ${JSON.stringify(rows)}`, sandbox);
  elements.filterAssignee.value = 'A';
  assert.deepEqual(
    Array.from(sandbox.getFilteredData().map((row) => row[0])),
    ['1', '3'],
    'assignee filter should match exact assignee names, not substrings',
  );
}

{
  const { sandbox, elements } = createContext();
  vm.runInContext(`globalData = ${JSON.stringify(rows)}`, sandbox);
  elements.filterMonth.value = '2026-05';
  assert.deepEqual(
    Array.from(sandbox.getFilteredData().map((row) => row[0])),
    ['1', '2'],
    'month filter should exclude tasks that have no deadline',
  );
}

{
  const { sandbox, elements } = createContext();
  vm.runInContext(`globalData = ${JSON.stringify(rows)}`, sandbox);
  vm.runInContext(`currentUser = { name: 'A', role: 'User' }`, sandbox);
  sandbox.renderTasks();
  assert.equal(
    elements.taskBody.innerHTML.includes('triggerTaskEmail'),
    false,
    'non-admin task rows should not render the admin-only reminder email action',
  );
}

{
  const listenerCounts = new Map();
  const zones = ['todo', 'doing', 'waiting', 'done'].map((name) => ({
    id: `kanban-${name}`,
    innerHTML: '',
    dataset: {},
    classList: { add() {}, remove() {} },
    addEventListener(type) {
      const key = `${name}:${type}`;
      listenerCounts.set(key, (listenerCounts.get(key) || 0) + 1);
    },
    closest() {
      return { dataset: { status: name[0].toUpperCase() + name.slice(1) } };
    },
  }));
  const kanbanElements = Object.fromEntries(zones.map((zone) => [zone.id, zone]));
  for (const name of ['todo', 'doing', 'waiting', 'done']) {
    kanbanElements[`kanban-count-${name}`] = createElement();
  }

  const { sandbox, elements } = createContext({
    document: {
      getElementById(id) {
        return kanbanElements[id] || elements?.[id] || null;
      },
      querySelectorAll(selector) {
        if (selector === '.kanban-col-body') return zones;
        return [];
      },
    },
  });
  sandbox.getFilteredData = () => [rows[0]];
  vm.runInContext(`globalData = ${JSON.stringify(rows)}`, sandbox);
  vm.runInContext(fs.readFileSync('public/webapp/quan-ly-cong-viec/js/kanban.js', 'utf8'), sandbox);
  sandbox.renderKanban();
  sandbox.renderKanban();

  assert.equal(
    kanbanElements['kanban-doing'].innerHTML.includes('Assigned to AA'),
    false,
    'kanban should render filtered task data instead of all global data',
  );
  assert.equal(
    listenerCounts.get('doing:drop'),
    1,
    'kanban should not register duplicate drop listeners across renders',
  );
}

console.log('quan-ly-cong-viec review fix tests passed');

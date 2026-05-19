import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function createElement(value = '') {
  return {
    value,
    classList: { add() {}, remove() {} },
  };
}

const elements = {
  searchInput: createElement(''),
  filterGroup: createElement(''),
  filterAssignee: createElement(''),
  filterStatus: createElement(''),
  filterDifficulty: createElement(''),
  filterMonth: createElement(''),
  quickFilterMode: createElement(''),
};

const sandbox = {
  console,
  document: {
    getElementById(id) {
      return elements[id] || null;
    },
    querySelectorAll() {
      return [];
    },
  },
  Date,
  globalData: [],
  currentStatusFilter: 'all',
  getToday() {
    const d = new Date('2026-05-19T00:00:00+07:00');
    d.setHours(0, 0, 0, 0);
    return d;
  },
  getEffectiveStatus(status) {
    return status;
  },
};

vm.createContext(sandbox);
vm.runInContext(
  fs.readFileSync('public/webapp/quan-ly-cong-viec/js/tasks.js', 'utf8'),
  sandbox,
);

const rows = [
  ['1', 'Trong 7 ngay', 'Doing', '', '', '', '2026-05-18', 'A', '10', '2026-05-24', '', 'To A', '2'],
  ['2', 'Trong 30 ngay', 'Doing', '', '', '', '2026-05-18', 'A', '10', '2026-06-05', '', 'To A', '2'],
  ['3', 'Ngoai 30 ngay', 'Doing', '', '', '', '2026-05-18', 'A', '10', '2026-06-25', '', 'To A', '2'],
  ['4', 'Khong han', 'Doing', '', '', '', '2026-05-18', 'A', '10', '', '', 'To A', '2'],
];

vm.runInContext(`globalData = ${JSON.stringify(rows)}`, sandbox);

elements.quickFilterMode.value = '7days';
assert.deepEqual(
  Array.from(sandbox.getFilteredData().map((row) => row[0])),
  ['1'],
  '7days quick filter should include only tasks due in the next 7 days',
);

elements.quickFilterMode.value = '30days';
assert.deepEqual(
  Array.from(sandbox.getFilteredData().map((row) => row[0])),
  ['1', '2'],
  '30days quick filter should include only tasks due in the next 30 days',
);

elements.quickFilterMode.value = '';
assert.equal(
  sandbox.getFilteredData().length,
  4,
  'empty quick filter should not restrict results',
);

console.log('quan-ly-cong-viec filter tests passed');

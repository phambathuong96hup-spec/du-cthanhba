/* ═══════════════════════════════════════════
   App — Bootstrap & Event Listeners
   ═══════════════════════════════════════════ */

// ── Theme ──
(function initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
})();

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.getElementById('themeIcon').className = newTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    showToast(newTheme === 'dark' ? 'Chế độ tối 🌙' : 'Chế độ sáng ☀️', 'primary');

    // Redraw charts on theme change
    if (!document.getElementById('pills-report').classList.contains('d-none')) {
        updateReport();
    }
}

// ── Sidebar ──
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.querySelector('.overlay').classList.toggle('active');
}

// ── Tab Switching ──
function switchTab(tabId, el) {
    document.querySelectorAll('.tab-pane-custom').forEach(d => d.classList.add('d-none'));
    document.getElementById(tabId).classList.remove('d-none');
    document.querySelectorAll('.nav-link-custom').forEach(l => l.classList.remove('active'));
    el.classList.add('active');

    const titles = {
        'pills-list': 'Danh sách công việc',
        'pills-report': 'Báo cáo & Thống kê',
        'pills-input': 'Giao việc mới',
        'pills-compliance': 'Quản lý Nội quy'
    };
    document.getElementById('pageTitle').innerText = titles[tabId] || '';

    if (window.innerWidth < 991) toggleSidebar();
}

function syncSearch(val) {
    if (document.getElementById('pills-list').classList.contains('d-none')) {
        document.querySelector('a[onclick*="pills-list"]').click();
    }
    document.getElementById('filterText').value = val;
    renderTable();
}

// ── Deadline Toggle ──
function toggleDeadline() {
    const type = document.getElementById('taskTypeSelect');
    const dl = document.getElementById('deadlineInput');
    if (type.value === 'Thường quy') {
        dl.value = ''; dl.disabled = true; dl.required = false;
    } else {
        dl.disabled = false; dl.required = true;
    }
}

// ── Init UI Elements ──
function initUI() {
    initCheckboxes();
    initSingleSelect('compliancePerson');
    initGroupSelect();
    toggleDeadline();

    const now = new Date();
    const monthStr = now.toISOString().slice(0, 7);
    document.getElementById('reportMonthSelect').value = monthStr;
    document.getElementById('filterMonth').value = monthStr;

    // Theme icon
    const currentTheme = document.documentElement.getAttribute('data-theme');
    document.getElementById('themeIcon').className = currentTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
}

function initGroupSelect() {
    const s = document.getElementById('groupSelect');
    s.innerHTML = '<option value="">-- Chọn tổ --</option>';
    GROUP_LIST.forEach(g => s.innerHTML += `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`);

    const f = document.getElementById('filterGroup');
    f.innerHTML = '<option value="">Tất cả</option>';
    GROUP_LIST.forEach(g => f.innerHTML += `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`);
}

function initCheckboxes() {
    const container = document.getElementById('checkboxContainer');
    const hidden = document.getElementById('hiddenAssigneeSelect');
    const textEl = document.getElementById('selectedText');
    const countEl = document.getElementById('selectedCount');

    container.innerHTML = "";
    hidden.innerHTML = "";

    ALL_STAFF.forEach((name, i) => {
        hidden.add(new Option(name, name));

        const div = document.createElement('div');
        div.className = 'person-item';
        div.style.cssText = 'padding:9px 12px;border-bottom:1px solid var(--border-color);cursor:pointer;transition:background 0.15s;';
        div.onmouseover = function () { this.style.background = 'var(--bg-body)'; };
        div.onmouseout = function () { this.style.background = 'transparent'; };
        div.onclick = function (e) { e.stopPropagation(); };
        div.innerHTML = `<div class="form-check">
            <input class="form-check-input" type="checkbox" value="${escapeHtml(name)}" id="chk${i}">
            <label class="form-check-label w-100 fw-medium" style="color:var(--text-main);cursor:pointer;font-size:0.88rem" for="chk${i}">${escapeHtml(name)}</label>
        </div>`;

        container.appendChild(div);
        div.querySelector('input').addEventListener('change', (e) => {
            hidden.options[i].selected = e.target.checked;
            updateAssigneeDisplay();
        });
    });
}

function updateAssigneeDisplay() {
    const s = document.getElementById('hiddenAssigneeSelect');
    const t = document.getElementById('selectedText');
    const c = document.getElementById('selectedCount');

    let cnt = 0, names = [];
    Array.from(s.options).forEach(o => {
        if (o.selected) { cnt++; names.push(o.value); }
    });
    c.innerText = cnt;
    t.innerText = cnt === 0 ? "-- Chọn nhân sự --" : (cnt <= 2 ? names.join(", ") : `Đã chọn ${cnt} người`);
}

function initSingleSelect(elId) {
    const s = document.getElementById(elId);
    s.innerHTML = '<option value="">-- Chọn nhân viên --</option>';
    for (const [group, people] of Object.entries(STAFF_GROUPS)) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group;
        people.forEach(n => optgroup.innerHTML += `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`);
        s.appendChild(optgroup);
    }
}

// ── DOMContentLoaded ──
document.addEventListener('DOMContentLoaded', () => {
    initUI();
    checkSession();
    loadTaskList();
    loadCompliance();
    startPolling(60000);

    // Task form submit
    document.getElementById('taskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser || !isAdminUser(currentUser)) return showToast("⛔ Chỉ Admin!", 'warning');

        const btn = document.getElementById('submitBtn');
        setBtnLoading(btn, true);

        const d = Object.fromEntries(new FormData(e.target).entries());
        d.assignee = Array.from(document.getElementById('hiddenAssigneeSelect').selectedOptions).map(o => o.value).join(', ');
        d.role = currentUser.role;

        try {
            const res = await apiFetch('add', d);
            showToast(res.message, res.status === 'success' ? 'success' : 'danger');
            if (res.status === 'success') {
                e.target.reset();
                document.querySelectorAll('#checkboxContainer input').forEach(c => c.checked = false);
                updateAssigneeDisplay();
                document.querySelector('a[onclick*="pills-list"]').click();
                loadTaskList();
            }
        } catch (err) {
            showToast("Lỗi: " + err.message, 'danger');
        } finally {
            setBtnLoading(btn, false, 'LƯU CÔNG VIỆC');
        }
    });

    // Compliance form submit
    document.getElementById('complianceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser || !isAdminUser(currentUser)) return showToast("⛔ Chỉ Admin!", 'warning');

        const btn = document.getElementById('btnCompliance');
        setBtnLoading(btn, true);

        const d = Object.fromEntries(new FormData(e.target).entries());
        d.role = currentUser.role;

        try {
            const res = await apiFetch('add_compliance', d);
            showToast(res.message, res.status === 'success' ? 'success' : 'danger');
            if (res.status === 'success') {
                e.target.reset();
                loadCompliance();
            }
        } catch (err) {
            showToast("Lỗi: " + err.message, 'danger');
        } finally {
            setBtnLoading(btn, false, 'Lưu ghi nhận');
        }
    });
});

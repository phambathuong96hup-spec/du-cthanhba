/* ═══════════════════════════════════════════
   App — Main Orchestrator
   ═══════════════════════════════════════════ */

// ── Theme ──
(function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.getElementById('themeIcon').className = newTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    showToast(newTheme === 'dark' ? 'Đã bật chế độ tối 🌙' : 'Đã bật chế độ sáng ☀️', 'primary');
}

// ── Sidebar Navigation ──
function showSection(section, clickedEl) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(section)?.classList.add('active');

    document.querySelectorAll('#sidebar ul li a').forEach(a => a.classList.remove('active'));
    if (clickedEl) clickedEl.classList.add('active');

    // Close mobile sidebar
    document.getElementById('sidebar')?.classList.remove('active');
    document.querySelector('.overlay')?.classList.remove('active');

    // Load data on demand
    if (section === 'sectionDashboard') loadDashboard();
    if (section === 'sectionCompliance') loadCompliance();
}

function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('active');
    document.querySelector('.overlay')?.classList.toggle('active');
}

// ── Desktop Sidebar Collapse ──
function toggleSidebarDesktop() {
    document.getElementById('sidebar')?.classList.toggle('collapsed');
}

// ── Deadline Toggle ──
function toggleDeadline() {
    const type = document.getElementById('taskTypeSelect');
    const dl = document.getElementById('deadlineInput');
    const req = document.getElementById('deadlineRequired');
    if (!type || !dl) return;
    if (type.value === 'Thường quy') {
        dl.value = '';
        dl.disabled = true;
        dl.required = false;
        if (req) req.style.display = 'none';
    } else {
        dl.disabled = false;
        dl.required = true;
        if (req) req.style.display = 'inline';
    }
}

// ── Populate Filter Dropdowns ──
function populateFilters() {
    // Assignee filter
    const assigneeSelect = document.getElementById('filterAssignee');
    if (assigneeSelect) {
        assigneeSelect.innerHTML = '<option value="">Tất cả</option>';
        ALL_STAFF.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            assigneeSelect.appendChild(opt);
        });
    }

    // Group filter
    const groupSelect = document.getElementById('filterGroup');
    if (groupSelect) {
        groupSelect.innerHTML = '<option value="">Tất cả</option>';
        GROUP_LIST.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g;
            opt.textContent = g;
            groupSelect.appendChild(opt);
        });
    }

    // Compliance name dropdown
    const compName = document.getElementById('compliancePerson');
    if (compName) {
        ALL_STAFF.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            compName.appendChild(opt);
        });
    }

    // Report month selector default
    const monthSelect = document.getElementById('reportMonthSelect');
    if (monthSelect) {
        const now = new Date();
        monthSelect.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
    // Theme icon
    const savedTheme = localStorage.getItem('theme') || 'light';
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = savedTheme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';

    // Session
    checkSession();

    // Filters
    populateFilters();

    // Search debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let debounce;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => { currentPage = 1; renderTasks(); }, 300);
        });
    }

    // Filter change listeners
    ['filterGroup', 'filterAssignee', 'filterStatus', 'filterDifficulty', 'filterMonth'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', applyFilters);
    });

    // Notifications
    updateNotificationUI();

    // Load initial data
    loadTaskList();

    // Start polling
    startPolling(60000);
});

// ── UI Navigation ──
window.switchTab = function(tabId, element) {
    document.querySelectorAll('.tab-pane-custom').forEach(tab => {
        tab.classList.add('d-none');
    });
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.remove('d-none');
    }

    if (element) {
        document.querySelectorAll('.nav-link-custom').forEach(link => {
            link.classList.remove('active');
        });
        element.classList.add('active');
    }

    if (window.innerWidth < 992) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    }
};

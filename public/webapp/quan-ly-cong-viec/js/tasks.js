/* ═══════════════════════════════════════════
   Tasks — CRUD, Render, Filter, Pagination
   ═══════════════════════════════════════════ */

let globalData = [];
let currentPage = 1;
const PAGE_SIZE = 15;
let currentStatusFilter = 'all';

async function loadTaskList(silent = false) {
    try {
        const res = await apiFetch(null);
        globalData = res.data || [];
        if (!silent) checkTaskNotifications(globalData);
        renderTasks();
        if (currentView === 'kanban') renderKanban();
    } catch (err) {
        if (!silent) showToast("Lỗi tải công việc: " + err.message, 'danger');
    }
}

function getFilteredData() {
    const today = getToday();
    const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const groupVal = document.getElementById('filterGroup')?.value || '';
    const assigneeVal = document.getElementById('filterAssignee')?.value || '';
    const statusVal = document.getElementById('filterStatus')?.value || '';
    const diffVal = document.getElementById('filterDifficulty')?.value || '';
    const monthVal = document.getElementById('filterMonth')?.value || '';

    return globalData.filter(r => {
        const rawSt = String(r[2]).trim();
        const status = getEffectiveStatus(rawSt, r[6]);
        const dlRaw = r[9] || r[4];
        const isOverdue = dlRaw && new Date(dlRaw) < today && status !== 'Done' && status !== 'Waiting';

        // Month filter
        if (monthVal && dlRaw) {
            const dl = new Date(dlRaw);
            const dlMonth = `${dl.getFullYear()}-${String(dl.getMonth() + 1).padStart(2, '0')}`;
            if (dlMonth !== monthVal) return false;
        }

        // Status tab filter
        if (currentStatusFilter === 'doing' && status !== 'Doing' && !isOverdue) return false;
        if (currentStatusFilter === 'done' && status !== 'Done') return false;
        if (currentStatusFilter === 'waiting' && status !== 'Waiting') return false;
        if (currentStatusFilter === 'overdue' && !isOverdue) return false;
        if (currentStatusFilter === 'todo' && status !== 'Todo') return false;

        // Dropdown status filter
        if (statusVal === 'Pending' && (status === 'Done' || status === 'Waiting')) return false;
        if (statusVal === 'Done' && status !== 'Done') return false;
        if (statusVal === 'Waiting' && status !== 'Waiting') return false;
        if (statusVal === 'Overdue' && !isOverdue) return false;
        if (statusVal === 'NoRoutine' && String(r[10]) !== 'Thực hiện C.Đạo') return false;

        // Text search
        if (searchVal) {
            const text = [r[1], r[5], r[7], r[11]].join(' ').toLowerCase();
            if (!text.includes(searchVal)) return false;
        }

        // Dropdown filters
        if (groupVal && String(r[11]) !== groupVal) return false;
        if (assigneeVal && !String(r[7]).includes(assigneeVal)) return false;
        if (diffVal && String(r[12]) !== diffVal) return false;

        return true;
    });
}

function filterByStatus(status, btn) {
    currentStatusFilter = status;
    currentPage = 1;
    document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderTasks();
}

function renderTasks() {
    const today = getToday();
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);

    const filtered = getFilteredData();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageData = filtered.slice(start, start + PAGE_SIZE);

    // Update status counts
    updateStatusCounts();

    const tbody = document.getElementById('taskBody');
    if (!tbody) return;

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-5">
            <i class="bi bi-inbox fs-1 d-block mb-2 opacity-25"></i>Không có công việc nào</td></tr>`;
        updatePagination(0, 0);
        return;
    }

    tbody.innerHTML = pageData.map((r, i) => {
        const id = r[0], name = r[1], rawSt = String(r[2]).trim();
        const note = r[5], assignee = r[7], prog = parseProgress(r[8]);
        const dlRaw = r[9] || r[4];
        const group = r[11] || '';
        const difficulty = r[12] || '2';
        const status = getEffectiveStatus(rawSt, r[6]);

        const isOverdue = dlRaw && new Date(dlRaw) < today && status !== 'Done' && status !== 'Waiting';

        // Status badge
        let statusBadge = '';
        if (status === 'Done') statusBadge = '<span class="status-badge bg-done">Hoàn thành</span>';
        else if (status === 'Waiting') statusBadge = '<span class="status-badge bg-waiting">Chờ duyệt</span>';
        else if (isOverdue) statusBadge = '<span class="status-badge bg-overdue">Quá hạn</span>';
        else if (status === 'Todo') statusBadge = '<span class="status-badge bg-todo">Mới tạo</span>';
        else statusBadge = '<span class="status-badge bg-doing">Đang làm</span>';

        // Deadline display
        let dlDisplay = '<i class="bi bi-infinity text-muted"></i>';
        if (dlRaw) {
            const dl = new Date(dlRaw);
            const dlStr = dl.toLocaleDateString('vi-VN');
            let dlClass = '';
            if (isOverdue) dlClass = 'date-overdue';
            else if (dl.toDateString() === today.toDateString()) dlClass = 'date-today';
            else if (dl <= tomorrow) dlClass = 'date-tomorrow';
            else if (dl <= nextWeek) dlClass = 'date-week';
            dlDisplay = `<span class="date-badge ${dlClass}">${escapeHtml(dlStr)}</span>`;
        }

        // Progress bar
        let progColor = '#10b981';
        if (prog < 30) progColor = '#ef4444';
        else if (prog < 70) progColor = '#f59e0b';

        // Assignee avatars
        const assignees = String(assignee).split(',').map(s => s.trim()).filter(Boolean);
        const avatarHtml = assignees.slice(0, 3).map(n => {
            const c = getRandomColor(n);
            return `<div title="${escapeHtml(n)}" style="width:26px;height:26px;border-radius:8px;background:${c};color:white;display:inline-flex;align-items:center;justify-content:center;font-size:0.55rem;font-weight:700;margin-right:-6px;border:2px solid var(--surface)">${escapeHtml(getInitials(n))}</div>`;
        }).join('');

        // Priority
        const priorityLabel = { '1': 'Thấp', '2': 'TB', '3': 'Cao', '4': 'Khẩn' }[difficulty] || 'TB';

        return `<tr class="fade-in cursor-pointer" style="animation-delay:${i * 25}ms" onclick="openTaskDetail('${escapeHtml(id)}')">
            <td class="fw-bold text-center" style="color:var(--text-light);font-size:0.75rem">${start + i + 1}</td>
            <td><div class="fw-bold" style="font-size:0.85rem;max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(name)}</div>
                ${group ? `<span style="font-size:0.68rem;color:var(--text-light)">${escapeHtml(group)}</span>` : ''}</td>
            <td><span class="priority-badge priority-${escapeHtml(difficulty)}">${escapeHtml(priorityLabel)}</span></td>
            <td style="min-width:100px">
                <div class="d-flex align-items-center gap-2">
                    <div class="progress" style="height:5px;flex:1;border-radius:4px;background:var(--border-color)">
                        <div class="progress-bar" style="width:${prog}%;background:${progColor};border-radius:4px"></div>
                    </div>
                    <span style="font-size:0.72rem;font-weight:700;min-width:28px;text-align:right">${prog}%</span>
                </div>
            </td>
            <td><div class="d-flex align-items-center">${avatarHtml}</div></td>
            <td>${dlDisplay}</td>
            <td>${statusBadge}</td>
            <td class="text-center">
                <div class="d-flex justify-content-center gap-1">
                    ${status !== 'Done' && currentUser ? `<button class="btn btn-sm btn-outline-success rounded-pill px-2" onclick="event.stopPropagation();updateProgress('${escapeHtml(id)}')" title="Cập nhật tiến độ"><i class="bi bi-arrow-up-circle"></i></button>` : ''}
                    ${status === 'Waiting' && isAdminUser(currentUser) ? `<button class="btn btn-sm btn-outline-primary rounded-pill px-2" onclick="event.stopPropagation();approveDone('${escapeHtml(id)}')" title="Duyệt"><i class="bi bi-check2-all"></i></button>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');

    updatePagination(filtered.length, totalPages);
}

function updateStatusCounts() {
    const today = getToday();
    let counts = { all: 0, doing: 0, done: 0, waiting: 0, overdue: 0, todo: 0 };

    globalData.forEach(r => {
        const rawSt = String(r[2]).trim();
        const status = getEffectiveStatus(rawSt, r[6]);
        const dlRaw = r[9] || r[4];
        const isOverdue = dlRaw && new Date(dlRaw) < today && status !== 'Done' && status !== 'Waiting';

        counts.all++;
        if (status === 'Done') counts.done++;
        else if (status === 'Waiting') counts.waiting++;
        else if (isOverdue) counts.overdue++;
        else if (status === 'Todo') counts.todo++;
        else counts.doing++;
    });

    Object.keys(counts).forEach(k => {
        const el = document.getElementById(`count-${k}`);
        if (el) el.innerText = counts[k];
    });
}

function updatePagination(total, totalPages) {
    const info = document.getElementById('paginationInfo');
    const current = document.getElementById('paginationCurrent');
    const prevBtn = document.getElementById('btnPrevPage');
    const nextBtn = document.getElementById('btnNextPage');

    if (info) info.innerText = `${total} kết quả`;
    if (current) current.innerText = `${currentPage} / ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

function changePage(dir) {
    currentPage += dir;
    renderTasks();
}

/* ═══ Task CRUD ═══ */
function showTaskModal() {
    if (!currentUser || !isAdminUser(currentUser)) {
        return showToast('⛔ Chỉ Admin mới có quyền tạo!', 'warning');
    }
    document.getElementById('taskForm')?.reset();
    document.getElementById('taskModalLabel').innerText = 'Tạo công việc mới';
    document.getElementById('editTaskId').value = '';

    // Populate assignee checkboxes
    populateAssigneeCheckboxes();

    new bootstrap.Modal(document.getElementById('taskModal')).show();
}

function populateAssigneeCheckboxes() {
    const container = document.getElementById('assigneeCheckboxes');
    if (!container) return;

    container.innerHTML = Object.entries(STAFF_GROUPS).map(([group, members]) => `
        <div class="mb-2">
            <div class="fw-bold small text-muted mb-1">${escapeHtml(group)}</div>
            ${members.map(m => `
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="checkbox" name="assignees" value="${escapeHtml(m)}" id="chk_${escapeHtml(m.replace(/\s/g,'_'))}">
                    <label class="form-check-label small" for="chk_${escapeHtml(m.replace(/\s/g,'_'))}">${escapeHtml(m)}</label>
                </div>
            `).join('')}
        </div>
    `).join('');
}

async function submitTask(btn) {
    const form = document.getElementById('taskForm');
    const editId = form.elements['editTaskId'].value;
    const name = form.elements['taskName'].value.trim();
    const deadline = form.elements['deadline'].value;
    const note = form.elements['notes'].value;
    const group = form.elements['group']?.value || '';
    const type = form.elements['type']?.value || 'Thường quy';
    const difficulty = form.elements['difficulty']?.value || '2';

    const checked = document.querySelectorAll('input[name="assignees"]:checked');
    const assignees = Array.from(checked).map(c => c.value).join(', ');

    if (!name) return showToast("Vui lòng nhập tên công việc!", 'warning');

    setBtnLoading(btn, true);
    try {
        const action = editId ? 'edit_task' : 'add_task';
        const payload = {
            id: editId || undefined,
            name, deadline, note, assignee: assignees,
            group, type, difficulty,
            role: currentUser.role
        };
        const res = await apiFetch(action, payload);
        showToast(res.message || (editId ? 'Đã cập nhật!' : 'Đã tạo công việc!'), 'success');
        bootstrap.Modal.getInstance(document.getElementById('taskModal'))?.hide();
        loadTaskList();
    } catch (err) {
        showToast("Lỗi: " + err.message, 'danger');
    } finally {
        setBtnLoading(btn, false, editId ? 'Cập nhật' : '<i class="bi bi-plus-lg me-1"></i>Tạo công việc');
    }
}

function openEditTask(id) {
    const task = globalData.find(r => r[0] == id);
    if (!task) return;

    document.getElementById('taskModalLabel').innerText = 'Chỉnh sửa công việc';
    const form = document.getElementById('taskForm');
    form.elements['editTaskId'].value = id;
    form.elements['taskName'].value = task[1] || '';
    form.elements['deadline'].value = task[9] || task[4] || '';
    form.elements['notes'].value = task[5] || '';
    if (form.elements['group']) form.elements['group'].value = task[11] || '';
    if (form.elements['type']) form.elements['type'].value = task[10] || 'Thường quy';
    if (form.elements['difficulty']) form.elements['difficulty'].value = task[12] || '2';

    populateAssigneeCheckboxes();
    const assignees = String(task[7]).split(',').map(s => s.trim());
    assignees.forEach(name => {
        const chk = document.querySelector(`input[name="assignees"][value="${name}"]`);
        if (chk) chk.checked = true;
    });

    new bootstrap.Modal(document.getElementById('taskModal')).show();
}

async function updateProgress(id) {
    const val = prompt("Nhập tiến độ mới (0-100):", "");
    if (val === null) return;
    const prog = parseInt(val);
    if (isNaN(prog) || prog < 0 || prog > 100) return showToast("Giá trị không hợp lệ!", 'warning');

    try {
        await apiFetch('update_progress', {
            id, progress: prog,
            user_fullname: currentUser.name,
            role: currentUser.role
        });
        showToast("Đã cập nhật tiến độ!", 'success');
        loadTaskList();
    } catch (err) {
        showToast("Lỗi: " + err.message, 'danger');
    }
}

async function approveDone(id) {
    if (!confirm("Duyệt hoàn thành công việc này?")) return;
    try {
        await apiFetch('approve_done', { id, role: currentUser.role });
        showToast("Đã duyệt hoàn thành!", 'success');
        loadTaskList();
    } catch (err) {
        showToast("Lỗi: " + err.message, 'danger');
    }
}

function applyFilters() {
    currentPage = 1;
    renderTasks();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterGroup').value = '';
    document.getElementById('filterAssignee').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterDifficulty').value = '';
    document.getElementById('filterMonth').value = '';
    currentStatusFilter = 'all';
    document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.status-tab[data-status="all"]')?.classList.add('active');
    currentPage = 1;
    renderTasks();
}

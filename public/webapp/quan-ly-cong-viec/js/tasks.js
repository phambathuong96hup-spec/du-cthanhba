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
        populateFilter();
        renderTasks();
        if (typeof currentView !== 'undefined' && currentView === 'kanban') {
            if(typeof renderKanban === 'function') renderKanban();
        }
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
        if (statusVal === 'Doing' && (status !== 'Doing' || isOverdue)) return false;
        if (statusVal === 'Done' && status !== 'Done') return false;
        if (statusVal === 'Waiting' && status !== 'Waiting') return false;
        if (statusVal === 'Overdue' && !isOverdue) return false;
        if (statusVal === 'NewTask' && status !== 'Todo') return false;

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

function populateFilter() {
    const sGrp = document.getElementById('filterGroup');
    const sAsgn = document.getElementById('filterAssignee');
    
    if (sGrp) sGrp.innerHTML = '<option value="">Tất cả</option>';
    if (sAsgn) sAsgn.innerHTML = '<option value="">Tất cả</option>';
    
    let g = [], a = [];
    globalData.forEach(r => {
        if (r[11]) g.push(String(r[11]).trim());
        if (r[7]) a.push(...String(r[7]).split(',').map(v => v.trim()).filter(v => v));
    });
    
    if (sGrp) [...new Set(g)].sort().forEach(n => { if (n) sGrp.innerHTML += `<option value="${n}">${n}</option>`; });
    if (sAsgn) [...new Set(a)].sort().forEach(n => { if (n) sAsgn.innerHTML += `<option value="${n}">${n}</option>`; });
}

function applyFilters() {
    currentPage = 1;
    renderTasks();
    if (typeof currentView !== 'undefined' && currentView === 'kanban' && typeof renderKanban === 'function') {
        renderKanban();
    }
}

function syncSearch(val) {
    const searchInput = document.getElementById('searchInput');
    if(searchInput) searchInput.value = val;
    applyFilters();
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
    if (currentPage < 1) currentPage = 1;

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
        else if (status === 'Todo') statusBadge = `<span class="status-badge bg-todo" style="cursor:pointer" title="Bấm để bắt đầu làm" onclick="event.stopPropagation();startTask('${escapeHtml(id)}')">Mới tạo ▶</span>`;
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

        // Action Buttons Logic
        let isOwner = currentUser && (isAdminUser(currentUser) || assignees.includes(currentUser.name));
        let disableControl = isOwner ? "" : "pointer-events: none; opacity: 0.6;";
        let fileUrl = r[13] || "";

        let actionBtns = '';
        let attachLink = (fileUrl && currentUser && isAdminUser(currentUser)) 
            ? `<button onclick="event.stopPropagation();openReviewModal('${escapeHtml(id)}')" class="btn btn-sm btn-white border shadow-sm text-primary" title="Xem báo cáo"><i class="bi bi-file-earmark-text-fill"></i></button>` 
            : '';

        if (status === 'Done') {
            actionBtns = '<span class="text-success"><i class="bi bi-check-circle-fill fs-5"></i></span>';
        } else if (status === 'Waiting') {
            actionBtns = attachLink;
            if (currentUser && isAdminUser(currentUser)) {
                actionBtns += `
                <button class="btn btn-sm btn-success ms-1" onclick="event.stopPropagation();approveTask('${escapeHtml(id)}')" title="Duyệt"><i class="bi bi-check-lg"></i></button>
                <button class="btn btn-sm btn-danger ms-1" onclick="event.stopPropagation();rejectTask('${escapeHtml(id)}')" title="Từ chối"><i class="bi bi-x-lg"></i></button>`;
            } else {
                actionBtns += `<span class="text-muted small fst-italic">Đợi duyệt...</span>`;
            }
        } else {
            if (currentUser && isAdminUser(currentUser)) {
                actionBtns = `<button class="btn btn-sm btn-outline-success rounded-pill px-3" onclick="event.stopPropagation();approveTask('${escapeHtml(id)}')">Duyệt ngay</button>`;
            } else {
                actionBtns = `<div style="${disableControl}">
                    <button class="btn btn-sm btn-primary-custom py-1 px-2" style="font-size:0.8rem" onclick="event.stopPropagation();openReportModal('${escapeHtml(id)}')" title="Báo cáo"><i class="bi bi-send-fill"></i></button>
                    <button class="btn btn-sm btn-white border text-warning ms-1 py-1 px-2" style="font-size:0.8rem" onclick="event.stopPropagation();triggerTaskEmail('${escapeHtml(id)}')" title="Nhắc"><i class="bi bi-envelope-fill"></i></button>
                </div>`;
            }
        }

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
                <div class="d-flex justify-content-center align-items-center gap-1">
                    ${actionBtns}
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
    const filtered = getFilteredData();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    let newPage = currentPage + dir;
    if (newPage < 1) newPage = 1;
    if (newPage > totalPages) newPage = totalPages;
    currentPage = newPage;
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

    // Populate group select & assignee checkboxes
    populateGroupSelect();
    populateAssigneeCheckboxes();

    new bootstrap.Modal(document.getElementById('taskModal')).show();
}

function populateGroupSelect() {
    const groupSelect = document.getElementById('groupSelect');
    if (!groupSelect) return;
    groupSelect.innerHTML = '<option value="">-- Chọn tổ --</option>';
    GROUP_LIST.forEach(group => {
        const opt = document.createElement('option');
        opt.value = group;
        opt.textContent = group;
        groupSelect.appendChild(opt);
    });
}

function populateAssigneeCheckboxes() {
    const container = document.getElementById('checkboxContainer');
    const hidden = document.getElementById('hiddenAssigneeSelect');
    if (!container || !hidden) return;

    container.innerHTML = '';
    hidden.innerHTML = '';

    const allStaff = ALL_STAFF || [];
    allStaff.forEach((name, i) => {
        hidden.add(new Option(name, name));

        const div = document.createElement('div');
        div.className = 'person-item';
        div.style.cssText = 'padding:9px 12px;border-bottom:1px solid var(--border-color);cursor:pointer;transition:background 0.15s;';
        div.onmouseover = function () { this.style.background = 'var(--bg-body)'; };
        div.onmouseout = function () { this.style.background = 'transparent'; };
        div.onclick = function (e) { e.stopPropagation(); };
        div.innerHTML = `<div class="form-check">
            <input class="form-check-input" type="checkbox" value="${escapeHtml(name)}" id="chkModal${i}">
            <label class="form-check-label w-100 fw-medium" style="color:var(--text-main);cursor:pointer;font-size:0.88rem" for="chkModal${i}">${escapeHtml(name)}</label>
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
    if (!s || !t || !c) return;

    let cnt = 0, names = [];
    Array.from(s.options).forEach(o => {
        if (o.selected) { cnt++; names.push(o.value); }
    });
    c.innerText = cnt;
    t.innerText = cnt === 0 ? '-- Chọn nhân sự --' : (cnt <= 2 ? names.join(', ') : `Đã chọn ${cnt} người`);
}

async function submitTask(btn) {
    const form = document.getElementById('taskForm');
    const editId = form.elements['editTaskId']?.value || '';
    const name = form.elements['taskName']?.value?.trim() || '';
    const deadline = form.elements['deadline']?.value || '';
    const note = form.elements['notes']?.value || '';
    const group = form.elements['group']?.value || '';
    const type = form.elements['type']?.value || 'Thường quy';
    const difficulty = form.elements['difficulty']?.value || '2';

    // Get selected assignees from hidden select
    const hiddenSelect = document.getElementById('hiddenAssigneeSelect');
    const assignees = hiddenSelect 
        ? Array.from(hiddenSelect.selectedOptions).map(o => o.value).join(', ')
        : '';

    if (!name) return showToast("Vui lòng nhập tên công việc!", 'warning');

    setBtnLoading(btn, true);
    try {
        const action = editId ? 'edit_task' : 'add';
        const payload = {
            id: editId || undefined,
            taskName: name,
            deadline, notes: note, assignee: assignees,
            group, type, taskType: type, difficulty,
            user_fullname: currentUser.name,
            role: currentUser.role
        };
        const res = await apiFetch(action, payload);
        if (res.status === 'error') throw new Error(res.message || 'Lỗi không xác định từ server');
        showToast(res.message || (editId ? 'Đã cập nhật!' : 'Đã tạo công việc!'), 'success');
        bootstrap.Modal.getInstance(document.getElementById('taskModal'))?.hide();
        // Reset form và assignee checkboxes
        form.reset();
        document.getElementById('editTaskId').value = '';
        const container = document.getElementById('checkboxContainer');
        if (container) container.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
        const hidden = document.getElementById('hiddenAssigneeSelect');
        if (hidden) Array.from(hidden.options).forEach(o => o.selected = false);
        updateAssigneeDisplay();
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
    if (form.elements['type']) form.elements['type'].value = task[10] || 'Thường quy';
    if (form.elements['difficulty']) form.elements['difficulty'].value = task[12] || '2';

    populateGroupSelect();
    if (form.elements['group']) form.elements['group'].value = task[11] || '';

    populateAssigneeCheckboxes();
    const assigneeNames = String(task[7]).split(',').map(s => s.trim()).filter(Boolean);
    const hiddenSelect = document.getElementById('hiddenAssigneeSelect');
    if (hiddenSelect) {
        Array.from(hiddenSelect.options).forEach(opt => {
            opt.selected = assigneeNames.includes(opt.value);
        });
        // Check corresponding checkboxes
        const container = document.getElementById('checkboxContainer');
        if (container) {
            container.querySelectorAll('input[type="checkbox"]').forEach(chk => {
                chk.checked = assigneeNames.includes(chk.value);
            });
        }
        updateAssigneeDisplay();
    }

    new bootstrap.Modal(document.getElementById('taskModal')).show();
}

async function startTask(id) {
    const task = globalData.find(r => r[0] == id);
    if (!task) return;
    if (currentUser && !isAdminUser(currentUser) && !String(task[7]).includes(currentUser.name)) {
        return showToast('⛔ Không phải việc của bạn!', 'warning');
    }
    try {
        await apiFetch('update_progress', { id, progress: 1, user_fullname: currentUser.name, role: currentUser.role });
        showToast('Đã chuyển sang Đang làm!', 'success');
        loadTaskList();
    } catch (err) {
        showToast('Lỗi: ' + err.message, 'danger');
    }
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

/**
 * Quick Filter: 7 days / 30 days / overdue
 */
function applyQuickFilter(mode, btn) {
    // Highlight active button
    document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const monthInput = document.getElementById('filterMonth');
    if (monthInput) monthInput.value = '';

    // Clear other filters
    document.getElementById('filterStatus').value = '';
    currentStatusFilter = 'all';

    if (mode === 'overdue') {
        // Show overdue tasks only
        document.getElementById('filterStatus').value = 'Overdue';
    } else if (mode === '7days') {
        // Set month filter to current month
        const now = new Date();
        monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        document.getElementById('quickFilterMode').value = '7days';
    } else if (mode === '30days') {
        document.getElementById('quickFilterMode').value = '30days';
    }

    currentPage = 1;
    renderTasks();
}

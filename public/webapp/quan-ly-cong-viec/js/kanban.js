/* ═══════════════════════════════════════════
   Kanban — Board View with Drag & Drop
   ═══════════════════════════════════════════ */

let currentView = 'table';

function switchView(view, btn) {
    currentView = view;
    document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const tableContainer = document.getElementById('tableViewContainer');
    const kanbanContainer = document.getElementById('kanbanViewContainer');

    if (view === 'table') {
        tableContainer.style.display = '';
        kanbanContainer.style.display = 'none';
    } else if (view === 'kanban') {
        tableContainer.style.display = 'none';
        kanbanContainer.style.display = '';
        renderKanban();
    }
}

function renderKanban() {
    const today = getToday();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const columns = { Todo: [], Doing: [], Waiting: [], Done: [] };

    globalData.forEach(r => {
        const rawSt = String(r[2]).trim();
        const status = getEffectiveStatus(rawSt, r[6]);
        const dlRaw = r[9] || r[4];
        const isOverdue = dlRaw && new Date(dlRaw) < today && status !== 'Done' && status !== 'Waiting';

        let col = 'Doing';
        if (status === 'Done') col = 'Done';
        else if (status === 'Waiting') col = 'Waiting';
        else if (status === 'Todo') col = 'Todo';
        else if (isOverdue) col = 'Doing'; // overdue still in Doing

        if (columns[col]) columns[col].push(r);
    });

    Object.keys(columns).forEach(key => {
        const containerId = `kanban-${key.toLowerCase()}`;
        const countId = `kanban-count-${key.toLowerCase()}`;
        const container = document.getElementById(containerId);
        const countEl = document.getElementById(countId);
        if (!container) return;

        countEl.innerText = columns[key].length;

        if (columns[key].length === 0) {
            container.innerHTML = `<div class="empty-state" style="padding:30px 10px"><i class="bi bi-inbox" style="font-size:1.5rem"></i><p style="font-size:0.75rem">Trống</p></div>`;
            return;
        }

        container.innerHTML = columns[key].map(r => {
            const id = r[0], name = r[1], assignee = r[7], prog = parseProgress(r[8]);
            const dlRaw = r[9] || r[4];
            const difficulty = r[12] || '2';
            const assignees = String(assignee).split(',').map(s => s.trim()).filter(Boolean);
            const firstAssignee = assignees[0] || 'N/A';
            const color = getRandomColor(firstAssignee);
            const initials = getInitials(firstAssignee);
            const dlDisp = dlRaw ? new Date(dlRaw).toLocaleDateString('vi-VN') : '';
            const isOverdue = dlRaw && new Date(dlRaw) < today && key !== 'Done';
            const priorityLabel = { '1': 'Thấp', '2': 'TB', '3': 'Cao', '4': 'Khẩn' }[difficulty] || 'TB';

            let barColor = '#10b981';
            if (prog < 30) barColor = '#ef4444';
            else if (prog < 70) barColor = '#f59e0b';

            return `<div class="kanban-card" draggable="true" data-id="${escapeHtml(id)}"
                ondragstart="onDragStart(event)" ondragend="onDragEnd(event)"
                onclick="openTaskDetail('${escapeHtml(id)}')">
                <div class="d-flex align-items-start justify-content-between gap-2 mb-1">
                    <span class="priority-badge priority-${escapeHtml(difficulty)}">${escapeHtml(priorityLabel)}</span>
                    ${isOverdue ? '<span class="date-badge date-overdue" style="font-size:0.6rem">Quá hạn</span>' : ''}
                </div>
                <div class="kanban-card-title">${escapeHtml(name)}</div>
                <div class="kanban-card-meta">
                    <div class="d-flex align-items-center gap-2">
                        <div class="kanban-card-avatar" style="background:${color}">${escapeHtml(initials)}</div>
                        <span style="font-size:0.7rem;color:var(--text-secondary)">${escapeHtml(firstAssignee)}</span>
                    </div>
                    <span class="kanban-card-date">${dlDisp ? '<i class="bi bi-calendar3 me-1"></i>' + escapeHtml(dlDisp) : '<i class="bi bi-infinity"></i>'}</span>
                </div>
                <div class="kanban-card-progress">
                    <div class="kanban-card-progress-fill" style="width:${prog}%;background:${barColor}"></div>
                </div>
            </div>`;
        }).join('');
    });

    // Setup drop zones
    setupDragDrop();
}

function setupDragDrop() {
    document.querySelectorAll('.kanban-col-body').forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('drop-highlight');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('drop-highlight'));
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('drop-highlight');
            const id = e.dataTransfer.getData('text/plain');
            const newStatus = zone.closest('.kanban-column').dataset.status;
            updateTaskStatusFromKanban(id, newStatus);
        });
    });
}

function onDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.drop-highlight').forEach(el => el.classList.remove('drop-highlight'));
}

async function updateTaskStatusFromKanban(id, newStatus) {
    if (!currentUser) return showToast("Vui lòng đăng nhập!", 'warning');

    // Map kanban column status to progress values
    const progressMap = { 'Todo': 0, 'Doing': 10, 'Waiting': 100, 'Done': 100 };
    const newProgress = progressMap[newStatus] || 0;

    try {
        if (newStatus === 'Done' && currentUser.role === 'Admin') {
            await apiFetch('approve_done', { id, role: currentUser.role });
        } else if (newStatus === 'Waiting') {
            // Submit for review
            await apiFetch('update_progress', {
                id, progress: 100, user_fullname: currentUser.name, role: currentUser.role
            });
        } else {
            await apiFetch('update_progress', {
                id, progress: newProgress, user_fullname: currentUser.name, role: currentUser.role
            });
        }
        showToast("Đã cập nhật trạng thái!", 'success');
        loadTaskList();
    } catch (err) {
        showToast("Lỗi: " + err.message, 'danger');
    }
}

/* ═══════════════════════════════════════════
   Task Detail Modal + Checklist
   ═══════════════════════════════════════════ */

// Local checklist storage (per task)
let taskChecklists = JSON.parse(localStorage.getItem('taskChecklists') || '{}');
let currentDetailTaskId = null;

function openTaskDetail(id) {
    const task = globalData.find(r => r[0] == id);
    if (!task) return;
    currentDetailTaskId = id;

    const status = getEffectiveStatus(String(task[2]).trim(), task[6]);
    const difficulty = task[12] || '2';
    const dlRaw = task[9] || task[4];
    const prog = parseProgress(task[8]);
    const today = getToday();
    const isOverdue = dlRaw && new Date(dlRaw) < today && status !== 'Done';

    // Task ID display
    const idx = globalData.indexOf(task);
    document.getElementById('detailTaskId').innerText = `CV-${String(idx + 1).padStart(3, '0')}`;
    document.getElementById('detailTaskName').innerText = task[1];

    // Status badge
    const statusMap = {
        'Done': '<span class="status-badge bg-done">Hoàn thành</span>',
        'Waiting': '<span class="status-badge bg-waiting">Chờ duyệt</span>',
        'Doing': isOverdue ? '<span class="status-badge bg-overdue">Quá hạn</span>' : '<span class="status-badge bg-doing">Đang làm</span>',
        'Todo': '<span class="status-badge bg-todo">Mới tạo</span>'
    };
    document.getElementById('detailStatus').innerHTML = statusMap[status] || statusMap['Todo'];

    // Priority
    const priorityMap = {
        '1': '<span class="priority-badge priority-1">Thấp</span>',
        '2': '<span class="priority-badge priority-2">Trung bình</span>',
        '3': '<span class="priority-badge priority-3">Cao</span>',
        '4': '<span class="priority-badge priority-4">Khẩn cấp</span>'
    };
    document.getElementById('detailPriority').innerHTML = priorityMap[difficulty] || priorityMap['2'];

    // Deadline
    if (dlRaw) {
        const dl = new Date(dlRaw);
        const dlStr = dl.toLocaleDateString('vi-VN');
        let cls = '';
        if (isOverdue) cls = 'date-overdue';
        else if (dl.toDateString() === today.toDateString()) cls = 'date-today';
        document.getElementById('detailDeadline').innerHTML = `<span class="date-badge ${cls}">${escapeHtml(dlStr)}</span>`;
    } else {
        document.getElementById('detailDeadline').innerHTML = '<span class="text-muted"><i class="bi bi-infinity"></i> Thường quy</span>';
    }

    // Progress
    const progColor = prog >= 100 ? '#10b981' : prog >= 50 ? '#f59e0b' : '#ef4444';
    document.getElementById('detailProgress').innerHTML = `
        <div class="d-flex align-items-center gap-2">
            <div class="progress" style="height:6px;flex:1;border-radius:6px;background:var(--border-color)">
                <div class="progress-bar" style="width:${prog}%;background:${progColor};border-radius:6px"></div>
            </div>
            <span class="fw-bold small" style="color:var(--text-main)">${prog}%</span>
        </div>`;

    // Assignees
    const assignees = String(task[7]).split(',').map(s => s.trim()).filter(Boolean);
    document.getElementById('detailAssignee').innerHTML = assignees.map(n => {
        const color = getRandomColor(n);
        return `<div class="d-flex align-items-center gap-2 px-2 py-1 rounded-pill" style="background:var(--bg-body)">
            <div style="width:22px;height:22px;border-radius:6px;background:${color};color:white;display:flex;align-items:center;justify-content:center;font-size:0.55rem;font-weight:700">${escapeHtml(getInitials(n))}</div>
            <span style="font-size:0.8rem;font-weight:600">${escapeHtml(n)}</span>
        </div>`;
    }).join('');

    // Notes
    document.getElementById('detailNotes').innerText = task[5] || 'Không có ghi chú';

    // Checklist
    renderChecklist(id);

    // Timeline
    const timeline = document.getElementById('detailTimeline');
    const created = task[6] ? new Date(task[6]).toLocaleDateString('vi-VN') : '?';
    let items = [`<div class="timeline-item"><div class="timeline-time">${escapeHtml(created)}</div>Công việc được tạo</div>`];
    if (status === 'Done') items.push(`<div class="timeline-item"><div class="timeline-time">Đã xong</div>Công việc hoàn thành ✅</div>`);
    else if (status === 'Waiting') items.push(`<div class="timeline-item"><div class="timeline-time">Chờ duyệt</div>Báo cáo đã gửi, đang chờ Admin duyệt</div>`);
    timeline.innerHTML = items.join('');

    new bootstrap.Modal(document.getElementById('taskDetailModal')).show();
}

function renderChecklist(taskId) {
    const items = taskChecklists[taskId] || [];
    const container = document.getElementById('checklistContainer');
    const doneCount = items.filter(i => i.done).length;
    document.getElementById('checklistProgress').innerText = `${doneCount}/${items.length}`;

    if (items.length === 0) {
        container.innerHTML = '<div class="text-muted small py-2">Chưa có checklist. Thêm đầu việc nhỏ bên dưới.</div>';
        return;
    }

    container.innerHTML = items.map((item, i) => `
        <div class="checklist-item ${item.done ? 'checked' : ''}">
            <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleChecklistItem(${i})">
            <label onclick="toggleChecklistItem(${i})">${escapeHtml(item.text)}</label>
            <i class="bi bi-x delete-btn" onclick="deleteChecklistItem(${i})"></i>
        </div>
    `).join('');
}

function addChecklistItem() {
    const input = document.getElementById('newChecklistItem');
    const text = input.value.trim();
    if (!text || !currentDetailTaskId) return;

    if (!taskChecklists[currentDetailTaskId]) taskChecklists[currentDetailTaskId] = [];
    taskChecklists[currentDetailTaskId].push({ text, done: false });
    localStorage.setItem('taskChecklists', JSON.stringify(taskChecklists));
    input.value = '';
    renderChecklist(currentDetailTaskId);
}

function toggleChecklistItem(index) {
    if (!currentDetailTaskId) return;
    const items = taskChecklists[currentDetailTaskId] || [];
    if (items[index]) {
        items[index].done = !items[index].done;
        localStorage.setItem('taskChecklists', JSON.stringify(taskChecklists));
        renderChecklist(currentDetailTaskId);
    }
}

function deleteChecklistItem(index) {
    if (!currentDetailTaskId) return;
    const items = taskChecklists[currentDetailTaskId] || [];
    items.splice(index, 1);
    localStorage.setItem('taskChecklists', JSON.stringify(taskChecklists));
    renderChecklist(currentDetailTaskId);
}

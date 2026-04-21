/* ═══════════════════════════════════════════
   Tasks — CRUD, Render, Filter
   ═══════════════════════════════════════════ */

let globalData = [];

async function loadTaskList(isPolling = false) {
    if (!isPolling) {
        const sk = `<tr><td colspan="7"><div class="d-flex flex-column gap-3 p-3">
            <span class="skeleton" style="width:65%"></span>
            <span class="skeleton" style="width:80%"></span>
            <span class="skeleton" style="width:45%"></span>
        </div></td></tr>`;
        document.getElementById('taskTableBody').innerHTML = sk + sk + sk;
    }

    try {
        const res = await apiFetch(null);
        globalData = res.data || [];
        checkTaskNotifications(globalData);
        populateFilter();
        renderTable();
    } catch (err) {
        console.error("Load tasks failed:", err);
        if (!isPolling) {
            document.getElementById('taskTableBody').innerHTML =
                `<tr><td colspan="7" class="text-center text-danger py-5">
                    <i class="bi bi-wifi-off fs-3 d-block mb-2"></i>
                    Lỗi tải dữ liệu. <a href="#" onclick="loadTaskList();return false;" class="text-primary fw-bold">Thử lại</a>
                </td></tr>`;
        }
    }
}

function populateFilter() {
    const s = document.getElementById('filterAssignee');
    s.innerHTML = '<option value="">Tất cả</option>';
    const names = new Set();
    globalData.forEach(r => {
        String(r[7]).split(',').map(v => v.trim()).filter(Boolean).forEach(n => names.add(n));
    });
    [...names].sort().forEach(n => {
        s.innerHTML += `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`;
    });
}

let currentPage = 1;
const PAGE_SIZE = 15;
let filteredData = [];

function renderTable() {
    const tb = document.getElementById('taskTableBody');
    const fMonth = document.getElementById('filterMonth').value;
    const fG = document.getElementById('filterGroup').value.toLowerCase().trim();
    const fN = document.getElementById('filterAssignee').value.toLowerCase().trim();
    const fS = document.getElementById('filterStatus').value;
    const fD = document.getElementById('filterDifficulty').value;
    const fT = document.getElementById('filterText').value.toLowerCase().trim();
    const quickMode = document.getElementById('quickFilterMode').value;
    const statusTab = document.getElementById('statusTabFilter').value;
    const today = getToday();
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const weekAhead = new Date(today); weekAhead.setDate(weekAhead.getDate() + 7);

    let filterStart = null, filterEnd = null;
    if (fMonth) {
        const [y, m] = fMonth.split('-').map(Number);
        filterStart = new Date(y, m - 1, 1);
        filterEnd = new Date(y, m, 0, 23, 59, 59);
    }

    // Count all statuses for tabs (before filtering)
    let countAll = 0, countDoing = 0, countWaiting = 0, countOverdue = 0, countDone = 0;
    globalData.forEach(r => {
        const st = getEffectiveStatus(String(r[2]).trim(), r[6]);
        const dlRaw = r[9] || r[4];
        const isOvd = dlRaw && new Date(dlRaw) < today && st !== 'Done' && st !== 'Waiting';
        countAll++;
        if (st === 'Done') countDone++;
        else if (st === 'Waiting') countWaiting++;
        else if (isOvd) countOverdue++;
        else countDoing++;
    });
    const ce = id => document.getElementById(id);
    if (ce('count-all')) ce('count-all').innerText = countAll;
    if (ce('count-doing')) ce('count-doing').innerText = countDoing;
    if (ce('count-waiting')) ce('count-waiting').innerText = countWaiting;
    if (ce('count-overdue')) ce('count-overdue').innerText = countOverdue;
    if (ce('count-done')) ce('count-done').innerText = countDone;

    let flt = globalData.filter(r => {
        const group = String(r[11] || "").toLowerCase();
        const as = String(r[7]).toLowerCase();
        const rawSt = String(r[2]).trim();
        const nm = String(r[1]).toLowerCase();
        const diff = String(r[12] || "");
        const st = getEffectiveStatus(rawSt, r[6]);
        const type = String(r[10] || "Thường quy");
        const dlRaw = r[9] || r[4];
        const isOverdue = dlRaw && new Date(dlRaw) < today && st !== 'Done' && st !== 'Waiting';

        // Status tab filter
        if (statusTab) {
            if (statusTab === 'Doing' && (st === 'Done' || st === 'Waiting' || isOverdue)) return false;
            if (statusTab === 'Waiting' && st !== 'Waiting') return false;
            if (statusTab === 'Overdue' && !isOverdue) return false;
            if (statusTab === 'Done' && st !== 'Done') return false;
        }

        // Quick time filter
        if (quickMode === '7days') {
            const dl = dlRaw ? new Date(dlRaw) : null;
            if (!dl || dl > weekAhead || dl < today) return false;
        } else if (quickMode === '30days') {
            const thirtyDays = new Date(today); thirtyDays.setDate(thirtyDays.getDate() + 30);
            const dl = dlRaw ? new Date(dlRaw) : null;
            if (!dl || dl > thirtyDays || dl < today) return false;
        } else if (quickMode === 'overdue') {
            if (!isOverdue) return false;
        }

        // Status filter (dropdown)
        let statusMatch = true;
        if (fS === 'Pending') statusMatch = st !== 'Done' && st !== 'Waiting';
        else if (fS === 'Done') statusMatch = st === 'Done';
        else if (fS === 'Waiting') statusMatch = st === 'Waiting';
        else if (fS === 'Overdue') statusMatch = isOverdue;
        else if (fS === 'NoRoutine') statusMatch = type !== 'Thường quy';

        // Month overlap
        let monthMatch = true;
        if (filterStart && filterEnd) {
            let taskStart = new Date(r[6]);
            let taskEnd = dlRaw ? new Date(dlRaw) : new Date();
            if (!dlRaw && st !== 'Done') taskEnd = new Date(today.getFullYear() + 1, 0, 1);
            taskStart.setHours(0, 0, 0, 0);
            taskEnd.setHours(23, 59, 59, 999);
            monthMatch = taskStart <= filterEnd && taskEnd >= filterStart;
        }

        return (fG === "" || group.includes(fG))
            && (fN === "" || as.includes(fN))
            && (fD === "" || diff === fD)
            && statusMatch && monthMatch
            && (fT === "" || nm.includes(fT));
    });

    // Sort
    flt.sort((a, b) => {
        const grpA = (a[11] || "").toLowerCase(), grpB = (b[11] || "").toLowerCase();
        if (grpA < grpB) return -1; if (grpA > grpB) return 1;
        const stA = getEffectiveStatus(String(a[2]).trim(), a[6]);
        const stB = getEffectiveStatus(String(b[2]).trim(), b[6]);
        if (stA === 'Waiting' && stB !== 'Waiting') return -1;
        if (stA !== 'Waiting' && stB === 'Waiting') return 1;
        if (stA === 'Done' && stB !== 'Done') return 1;
        if (stA !== 'Done' && stB === 'Done') return -1;
        const dA = new Date(a[9] || a[4] || '9999-12-31');
        const dB = new Date(b[9] || b[4] || '9999-12-31');
        return dA - dB;
    });

    filteredData = flt;

    // Pagination
    const totalPages = Math.max(1, Math.ceil(flt.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const pageData = flt.slice(startIdx, startIdx + PAGE_SIZE);

    // Update pagination UI
    document.getElementById('paginationInfo').innerText = `${flt.length} công việc`;
    document.getElementById('paginationCurrent').innerText = `${currentPage}/${totalPages}`;
    document.getElementById('btnPrevPage').disabled = currentPage <= 1;
    document.getElementById('btnNextPage').disabled = currentPage >= totalPages;

    if (flt.length === 0) {
        tb.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-5">
            <i class="bi bi-inbox fs-3 d-block mb-2 opacity-50"></i>
            Không tìm thấy công việc nào.
        </td></tr>`;
        return;
    }

    const priorityLabels = { '1': 'Thấp', '2': 'TB', '3': 'Cao', '4': 'Khẩn cấp' };

    const rows = [];
    pageData.forEach((r, idx) => {
        const id = r[0], name = r[1], rawStatus = String(r[2]).trim(), assignee = r[7];
        const type = r[10] || "Thường quy", group = r[11] || "";
        const difficulty = r[12] || "";
        const status = getEffectiveStatus(rawStatus, r[6]);
        const dlRaw = r[9] || r[4];
        const dlDisp = dlRaw ? new Date(dlRaw).toLocaleDateString('vi-VN') : '';
        const fileUrl = r[13] || "";
        const prog = parseProgress(r[8]);
        const isOwner = currentUser && (currentUser.role === 'Admin' || assignee.includes(currentUser.name));
        const disableControl = isOwner ? "" : "pointer-events:none;opacity:0.5;";
        const isOverdue = dlRaw && new Date(dlRaw) < today && status !== 'Done' && status !== 'Waiting';

        // Task ID
        const globalIdx = globalData.indexOf(r);
        const taskIdStr = `CV-${String(globalIdx + 1).padStart(3, '0')}`;

        // Status badge
        let statusBadgeHtml = '';
        if (status === 'Todo' && isOwner) {
            statusBadgeHtml = `<span class="status-badge bg-todo cursor-pointer" onclick="event.stopPropagation();startTask('${escapeHtml(id)}')" title="Bấm để bắt đầu"><i class="bi bi-play-circle-fill me-1"></i>Bắt đầu</span>`;
        } else if (status === 'Done') {
            statusBadgeHtml = '<span class="status-badge bg-done">Hoàn thành</span>';
        } else if (status === 'Waiting') {
            statusBadgeHtml = '<span class="status-badge bg-waiting">Chờ duyệt</span>';
        } else if (isOverdue) {
            statusBadgeHtml = '<span class="status-badge bg-overdue">Quá hạn</span>';
        } else if (status === 'Doing') {
            statusBadgeHtml = '<span class="status-badge bg-doing">Đang làm</span>';
        } else {
            statusBadgeHtml = '<span class="status-badge bg-todo">Mới tạo</span>';
        }

        // Priority badge (replaces stars)
        let priorityHtml = '';
        if (difficulty) {
            const label = priorityLabels[difficulty] || 'TB';
            priorityHtml = `<span class="priority-badge priority-${escapeHtml(difficulty)}">${escapeHtml(label)}</span>`;
        }

        // Date badge with color coding
        let dlHtml = '';
        if (!dlRaw || type === 'Thường quy') {
            dlHtml = '<span class="text-muted small"><i class="bi bi-infinity"></i> TQ</span>';
        } else {
            const dlDate = new Date(dlRaw);
            let dateClass = '';
            if (isOverdue) dateClass = 'date-overdue';
            else if (dlDate.toDateString() === today.toDateString()) dateClass = 'date-today';
            else if (dlDate.toDateString() === tomorrow.toDateString()) dateClass = 'date-tomorrow';
            else if (dlDate <= weekAhead) dateClass = 'date-week';

            if (dateClass) {
                dlHtml = `<span class="date-badge ${dateClass}">${escapeHtml(dlDisp)}</span>`;
            } else {
                dlHtml = `<span class="fw-bold small" style="color:var(--text-main)">${escapeHtml(dlDisp)}</span>`;
            }
        }

        // Progress slider
        let slider = status === 'Done'
            ? `<div class="progress" style="height:5px;width:90px;border-radius:10px;"><div class="progress-bar bg-success" style="width:100%"></div></div>`
            : `<div class="d-flex align-items-center" style="${disableControl}">
                <input type="range" class="form-range me-2" style="width:65px" min="0" max="100" step="10" value="${prog}" onclick="event.stopPropagation()" onchange="updateProgress('${escapeHtml(id)}',this.value)">
                <span class="badge bg-light text-dark border" id="val-${escapeHtml(id)}" style="width:38px;font-size:0.72rem">${prog}%</span>
               </div>`;

        // Action buttons
        let actionBtns = '';
        const safeId = escapeHtml(id);
        const attachLink = (fileUrl && currentUser && currentUser.role === 'Admin')
            ? `<button onclick="event.stopPropagation();openReviewModal('${safeId}')" class="btn btn-sm border text-primary" title="Xem báo cáo" style="border-radius:8px"><i class="bi bi-file-earmark-text-fill"></i></button> `
            : '';

        if (status === 'Done') {
            actionBtns = '<span class="text-success"><i class="bi bi-check-circle-fill fs-5"></i></span>';
        } else if (status === 'Waiting') {
            actionBtns = attachLink;
            if (currentUser && currentUser.role === 'Admin') {
                actionBtns += `<button class="btn btn-sm btn-success ms-1" onclick="event.stopPropagation();approveTask('${safeId}')" title="Duyệt" style="border-radius:8px"><i class="bi bi-check-lg"></i></button>
                    <button class="btn btn-sm btn-danger ms-1" onclick="event.stopPropagation();rejectTask('${safeId}')" title="Từ chối" style="border-radius:8px"><i class="bi bi-x-lg"></i></button>`;
            } else {
                actionBtns += '<span class="text-muted small fst-italic">Đợi duyệt...</span>';
            }
        } else if (currentUser && currentUser.role === 'Admin') {
            actionBtns = `<button class="btn btn-sm btn-outline-success rounded-pill px-3" onclick="event.stopPropagation();approveTask('${safeId}')">Duyệt</button>`;
        } else {
            actionBtns = `<div style="${disableControl}">
                <button class="btn btn-sm btn-primary-custom py-1 px-2" style="font-size:0.78rem" onclick="event.stopPropagation();openReportModal('${safeId}')" title="Báo cáo"><i class="bi bi-send-fill"></i></button>
            </div>`;
        }

        const editBtn = (currentUser && currentUser.role === 'Admin')
            ? `<button class="btn btn-sm text-muted p-0 ms-2" style="opacity:0.4" onclick="event.stopPropagation();openEditTask('${safeId}')" title="Sửa"><i class="bi bi-pencil-square"></i></button>`
            : '';

        const assignees = assignee.split(',').map(s => s.trim()).filter(Boolean);
        const firstAssignee = assignees[0] || '';
        const assigneeHtml = firstAssignee
            ? `<div class="d-flex align-items-center gap-2">
                <div style="width:24px;height:24px;border-radius:7px;background:${getRandomColor(firstAssignee)};color:white;display:flex;align-items:center;justify-content:center;font-size:0.55rem;font-weight:700;flex-shrink:0">${escapeHtml(getInitials(firstAssignee))}</div>
                <span class="fw-bold" style="font-size:0.8rem;color:var(--text-main)">${escapeHtml(firstAssignee)}${assignees.length > 1 ? ' <span class="text-muted">+' + (assignees.length - 1) + '</span>' : ''}</span>
              </div>`
            : '<span class="text-muted small">Chưa giao</span>';

        rows.push(`<tr style="cursor:pointer" onclick="openTaskDetail('${safeId}')">
            <td><span class="text-muted" style="font-size:0.72rem;font-weight:600">${escapeHtml(taskIdStr)}</span></td>
            <td>
                <div class="d-flex align-items-center">
                    <span class="fw-bold text-wrap" style="font-size:0.88rem;color:var(--text-main)">${escapeHtml(name)}</span>
                    ${editBtn}
                </div>
            </td>
            <td class="text-center">${priorityHtml}</td>
            <td>${slider}</td>
            <td>${assigneeHtml}</td>
            <td class="small">${dlHtml}</td>
            <td>${statusBadgeHtml}</td>
            <td class="text-center">${actionBtns}</td>
        </tr>`);
    });

    tb.innerHTML = rows.join('');

    // If kanban is active, also update it
    if (currentView === 'kanban') renderKanban();
}

function changePage(delta) {
    currentPage += delta;
    renderTable();
}

function filterByStatusTab(status, btn) {
    document.querySelectorAll('.status-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('statusTabFilter').value = status;
    currentPage = 1;
    renderTable();
}

function applyQuickFilter(mode, btn) {
    const current = document.getElementById('quickFilterMode').value;
    document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));

    if (current === mode) {
        document.getElementById('quickFilterMode').value = '';
    } else {
        document.getElementById('quickFilterMode').value = mode;
        if (btn) btn.classList.add('active');
    }
    currentPage = 1;
    renderTable();
}

function startTask(id) {
    if (!confirm("Bắt đầu thực hiện công việc này?")) return;
    updateProgress(id, 5);
}

async function updateProgress(id, v) {
    if (!currentUser) return showToast("Vui lòng đăng nhập!", 'warning');

    if (v == 100 && currentUser.role !== 'Admin') {
        if (confirm("Bạn muốn báo cáo hoàn thành công việc này?")) {
            openReportModal(id);
            const el = document.getElementById(`val-${id}`);
            if (el) el.innerText = '100%';
            return;
        } else {
            v = 90;
        }
    }

    const el = document.getElementById(`val-${id}`);
    if (el) el.innerText = v + '%';

    try {
        const res = await apiFetch('update_progress', {
            id, progress: v, user_fullname: currentUser.name, role: currentUser.role
        });
        if (res.status === 'error') {
            showToast(res.message, 'danger');
            loadTaskList();
        } else if (v == 100 && currentUser.role === 'Admin') {
            loadTaskList();
        }
    } catch (err) {
        showToast("Lỗi cập nhật: " + err.message, 'danger');
    }
}

function openReportModal(id) {
    if (!currentUser) return showToast("Vui lòng đăng nhập!", 'warning');
    document.getElementById('reportTaskId').value = id;
    document.getElementById('reportFile').value = '';
    document.getElementById('fileListDisplay').innerHTML = '';
    document.getElementById('fileError').style.display = 'none';
    document.getElementById('compressStatus').innerText = '';
    document.getElementById('uploadProgress').style.display = 'none';
    new bootstrap.Modal(document.getElementById('reportModal')).show();
}

function displaySelectedFiles() {
    const input = document.getElementById('reportFile');
    const display = document.getElementById('fileListDisplay');
    if (input.files.length > 0) {
        display.innerHTML = Array.from(input.files).map(f => `<div class="d-flex align-items-center gap-1 mb-1"><i class="bi bi-paperclip text-primary"></i> ${escapeHtml(f.name)} <small class="text-muted">(${(f.size / 1024).toFixed(0)}KB)</small></div>`).join('');
    } else {
        display.innerHTML = "";
    }
}

function getMimeType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const map = {
        'pdf': 'application/pdf', 'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png'
    };
    return map[ext] || 'application/octet-stream';
}

async function submitReport() {
    const id = document.getElementById('reportTaskId').value;
    const fileInput = document.getElementById('reportFile');
    const files = fileInput.files;
    const btn = document.getElementById('btnSubmitReport');
    const errDiv = document.getElementById('fileError');
    const statusDiv = document.getElementById('compressStatus');
    const progressDiv = document.getElementById('uploadProgress');

    if (files.length === 0) {
        errDiv.innerText = "Vui lòng chọn ít nhất 1 file!";
        errDiv.style.display = 'block';
        return;
    }

    let totalSize = 0;
    for (let i = 0; i < files.length; i++) totalSize += files[i].size;
    if (totalSize > 10 * 1024 * 1024) {
        errDiv.innerText = "Tổng dung lượng > 10MB.";
        errDiv.style.display = 'block';
        return;
    }

    setBtnLoading(btn, true);
    errDiv.style.display = 'none';
    progressDiv.style.display = 'block';
    statusDiv.innerText = `Đang đọc ${files.length} file...`;

    let filePayloads = [];
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = e => reject(e);
                reader.readAsDataURL(file);
            });
            filePayloads.push({
                fileName: file.name,
                mimeType: file.type || getMimeType(file.name),
                fileData: base64
            });
        }
    } catch (e) {
        errDiv.innerText = "Lỗi đọc file.";
        errDiv.style.display = 'block';
        setBtnLoading(btn, false, 'Gửi báo cáo');
        return;
    }

    statusDiv.innerText = "Đang gửi...";

    try {
        const res = await apiFetch('report_done', {
            id, user_fullname: currentUser.name, files: filePayloads
        }, 60000);

        if (res.status === 'success') {
            showToast("✅ " + res.message, 'success');
            bootstrap.Modal.getInstance(document.getElementById('reportModal'))?.hide();
            loadTaskList();
        } else {
            showToast("⚠️ " + res.message, 'danger');
        }
    } catch (err) {
        showToast("Lỗi: " + err.message, 'danger');
    } finally {
        setBtnLoading(btn, false, 'Gửi báo cáo');
        progressDiv.style.display = 'none';
        statusDiv.innerText = "";
        document.getElementById('fileListDisplay').innerHTML = "";
    }
}

async function approveTask(id) {
    if (!currentUser || currentUser.role !== 'Admin') return showToast("⛔ Chỉ Admin!", 'warning');
    if (!confirm('Duyệt hoàn thành công việc này?')) return;
    try {
        const res = await apiFetch('approve_done', { id, role: currentUser.role });
        showToast(res.message, 'success');
        loadTaskList();
    } catch (err) { showToast("Lỗi: " + err.message, 'danger'); }
}

async function rejectTask(id) {
    if (!currentUser || currentUser.role !== 'Admin') return showToast("⛔ Chỉ Admin!", 'warning');
    if (!confirm('Từ chối báo cáo này?')) return;
    try {
        const res = await apiFetch('reject_done', { id, role: currentUser.role });
        showToast(res.message, 'warning');
        loadTaskList();
    } catch (err) { showToast("Lỗi: " + err.message, 'danger'); }
}

function openEditTask(id) {
    const task = globalData.find(r => r[0] == id);
    if (!task) return;
    document.getElementById('editTaskId').value = id;
    document.getElementById('editTaskName').value = task[1];
    document.getElementById('editTaskAssignee').value = task[7];
    document.getElementById('editTaskNotes').value = task[5] || '';

    const deadline = task[9] || task[4];
    if (deadline) {
        const d = new Date(deadline);
        document.getElementById('editTaskDeadline').value = d.toISOString().split('T')[0];
    } else {
        document.getElementById('editTaskDeadline').value = '';
    }

    if (task[12]) document.getElementById('editTaskDifficulty').value = task[12];
    new bootstrap.Modal(document.getElementById('editTaskModal')).show();
}

async function submitEditTask() {
    const payload = {
        id: document.getElementById('editTaskId').value,
        taskName: document.getElementById('editTaskName').value,
        deadline: document.getElementById('editTaskDeadline').value,
        difficulty: document.getElementById('editTaskDifficulty').value,
        notes: document.getElementById('editTaskNotes').value,
        role: currentUser.role
    };

    try {
        const res = await apiFetch('edit_task', payload);
        showToast(res.message, 'success');
        bootstrap.Modal.getInstance(document.getElementById('editTaskModal'))?.hide();
        loadTaskList();
    } catch (err) { showToast("Lỗi: " + err.message, 'danger'); }
}

function openReviewModal(id) {
    const task = globalData.find(r => r[0] == id);
    if (!task) return;
    document.getElementById('reviewTaskId').value = id;
    document.getElementById('reviewTaskName').innerText = task[1];
    document.getElementById('reviewAssignee').innerText = task[7];

    const container = document.getElementById('reviewFileContainer');
    if (task[13]) {
        const fileUrls = String(task[13]).split('\n');
        container.innerHTML = fileUrls.filter(u => u.trim()).map((url, i) =>
            `<a href="${escapeHtml(url)}" target="_blank" class="btn btn-outline-primary w-100 fw-bold" style="border-radius:10px"><i class="bi bi-cloud-arrow-down-fill"></i> Mở File ${i + 1}</a>`
        ).join('');
    } else {
        container.innerHTML = '<span class="text-muted fst-italic">Không có file đính kèm.</span>';
    }
    new bootstrap.Modal(document.getElementById('reviewModal')).show();
}

function submitReviewDecision(type) {
    const id = document.getElementById('reviewTaskId').value;
    if (type === 'approve') approveTask(id); else rejectTask(id);
    bootstrap.Modal.getInstance(document.getElementById('reviewModal'))?.hide();
}

async function sendEmailBackend(id) {
    const task = globalData.find(r => r[0] == id);
    if (!task) return showToast("Không tìm thấy!", 'danger');

    const taskName = task[1], assignee = task[7];
    const dlRaw = task[9] || task[4];
    const dl = dlRaw ? new Date(dlRaw).toLocaleDateString('vi-VN') : 'Sớm nhất';

    if (!confirm(`Gửi mail nhắc nhở cho ${assignee}?`)) return;

    try {
        const res = await apiFetch('send_email_manual', { taskName, assignee, deadline: dl });
        showToast(res.message, res.status === 'success' ? 'success' : 'danger');
    } catch (err) { showToast("Lỗi: " + err.message, 'danger'); }
}

async function triggerBulkEmail(btn) {
    if (!currentUser || currentUser.role !== 'Admin') return showToast("⛔ Chỉ Admin!", 'warning');

    const pending = globalData.filter(r => {
        const status = String(r[2]).trim();
        return status !== 'Done' && status !== 'Waiting';
    });

    if (pending.length === 0) return showToast("Không có việc cần gửi!", 'primary');
    if (!confirm(`Gửi mail nhắc cho ${pending.length} đầu việc chưa xong?`)) return;

    setBtnLoading(btn, true);
    try {
        const res = await apiFetch('send_bulk_email', {
            taskIds: pending.map(r => r[0]), sender: currentUser.name
        });
        showToast(res.message, 'success');
    } catch (err) { showToast("Lỗi: " + err.message, 'danger'); }
    finally { setBtnLoading(btn, false, '<i class="bi bi-envelope"></i>'); }
}

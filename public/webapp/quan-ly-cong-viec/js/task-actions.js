/* ═══════════════════════════════════════════
   Task Actions — Delete & Edit from Detail Modal
   ═══════════════════════════════════════════ */

/**
 * Delete a task from the Task Detail Modal.
 * Requires admin permissions. Confirms before deleting.
 */
async function deleteTaskFromDetail() {
    if (!currentUser || !isAdminUser(currentUser)) {
        return showToast('⛔ Chỉ Admin mới có quyền xóa!', 'warning');
    }
    if (!currentDetailTaskId) return;

    const task = globalData.find(r => r[0] == currentDetailTaskId);
    const taskName = task ? task[1] : currentDetailTaskId;

    if (!confirm('Bạn chắc chắn muốn XÓA công việc:\n"' + taskName + '"?\n\nHành động này không thể hoàn tác.')) {
        return;
    }

    try {
        const res = await apiFetch('delete_task', {
            ...getAuthPayload(),
            id: currentDetailTaskId,
        });
        if (res.status === 'error') throw new Error(res.message || 'Không thể xóa công việc');
        showToast(res.message || 'Đã xóa công việc thành công!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'))?.hide();
        loadTaskList();
    } catch (err) {
        showToast('Lỗi: ' + err.message, 'danger');
    }
}

/**
 * Open the Edit Task modal from the Task Detail Modal.
 * Closes the detail modal first, then opens the edit modal.
 */
function editTaskFromDetail() {
    if (!currentUser || !isAdminUser(currentUser)) {
        return showToast('⛔ Chỉ Admin mới có quyền sửa!', 'warning');
    }
    if (!currentDetailTaskId) return;

    const detailModal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    if (detailModal) detailModal.hide();

    setTimeout(function() {
        openEditTask(currentDetailTaskId);
    }, 350);
}

/**
 * Open the Review Modal to approve or reject a task.
 */
function openReviewModal(id) {
    if (!currentUser || !isAdminUser(currentUser)) {
        return showToast('⛔ Chỉ Admin mới có quyền duyệt báo cáo!', 'warning');
    }
    const task = globalData.find(t => t[0] == id);
    if (!task) return;
    
    document.getElementById('reviewTaskId').value = id;
    document.getElementById('reviewTaskName').innerText = task[1] || 'Không tên';
    document.getElementById('reviewAssignee').innerText = task[7] || 'Chưa phân công';
    
    const fileContainer = document.getElementById('reviewFileContainer');
    fileContainer.innerHTML = '';
    const fileUrl = task[13]; // Column 14 = File evidence URLs
    if (fileUrl && String(fileUrl).trim() !== '') {
        const links = String(fileUrl)
            .split('\n')
            .map(safeExternalUrl)
            .filter(Boolean);
        fileContainer.innerHTML = links.map((url, idx) =>
            `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary me-1 mb-1"><i class="bi bi-link-45deg"></i> Tài liệu ${links.length > 1 ? (idx + 1) : ''}</a>`
        ).join('');
        if (links.length === 0) {
            fileContainer.innerHTML = `<span class="text-muted small">Không có tài liệu hợp lệ.</span>`;
        }
    } else {
        fileContainer.innerHTML = `<span class="text-muted small">Không có tài liệu đính kèm.</span>`;
    }
    
    new bootstrap.Modal(document.getElementById('reviewModal')).show();
}

/**
 * Submit decision from the Review Modal.
 */
async function submitReviewDecision(decision) {
    const id = document.getElementById('reviewTaskId').value;
    if (!id) return;
    
    try {
        if (decision === 'approve') {
            const res = await apiFetch('approve_done', { ...getAuthPayload(), id });
            if (res.status === 'error') throw new Error(res.message || 'Không thể duyệt báo cáo');
            showToast("Đã duyệt báo cáo thành công!", 'success');
        } else if (decision === 'reject') {
            const res = await apiFetch('reject_done', { ...getAuthPayload(), id });
            if (res.status === 'error') throw new Error(res.message || 'Không thể trả lại báo cáo');
            showToast("Đã trả lại báo cáo!", 'warning');
        }
        bootstrap.Modal.getInstance(document.getElementById('reviewModal'))?.hide();
        loadTaskList();
    } catch (err) {
        showToast("Lỗi: " + err.message, 'danger');
    }
}

/**
 * Trigger sending reminder email for a specific task.
 */
async function triggerTaskEmail(id) {
    if (!currentUser || !isAdminUser(currentUser)) {
        return showToast('⛔ Chỉ Admin mới có quyền gửi mail!', 'warning');
    }
    const task = globalData.find(t => t[0] == id);
    if (!task) return showToast('Không tìm thấy công việc!', 'warning');
    if (!confirm("Bạn muốn gửi mail nhắc nhở công việc này?")) return;
    
    try {
        const res = await apiFetch('send_email_manual', {
            ...getAuthPayload(),
            id,
            taskName: task[1] || '',
            assignee: task[7] || '',
            deadline: task[9] || task[4] || '',
        });
        if (res.status === 'error') throw new Error(res.message || 'Không thể gửi mail nhắc');
        showToast("Đã gửi mail nhắc nhở!", 'success');
    } catch (err) {
        showToast("Lỗi: " + err.message, 'danger');
    }
}

/**
 * Trigger bulk sending reminder emails for all pending/overdue tasks.
 */
async function triggerBulkEmail(btn) {
    if (!currentUser || !isAdminUser(currentUser)) {
        return showToast('⛔ Chỉ Admin mới có quyền gửi mail!', 'warning');
    }
    if (!confirm("Gửi mail nhắc nhở cho tất cả các công việc Chưa xong & Quá hạn?")) return;
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang gửi...';
    btn.disabled = true;
    
    try {
        const res = await apiFetch('send_bulk_email', getAuthPayload());
        if (res.status === 'error') throw new Error(res.message || 'Không thể gửi mail hàng loạt');
        showToast(res?.message || "Đã gửi mail nhắc nhở hàng loạt!", 'success');
    } catch (err) {
        showToast("Lỗi: " + err.message, 'danger');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/**
 * Report Modal Logic
 */
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
        let names = Array.from(input.files).map(f => "📎 " + escapeHtml(f.name)).join("<br>");
        display.innerHTML = names;
    } else {
        display.innerHTML = "";
    }
}

function getMimeType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const map = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png'
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
        errDiv.style.display = 'block'; return; 
    }
    
    let totalSize = 0;
    for (let i = 0; i < files.length; i++) totalSize += files[i].size;
    
    if (totalSize > 10 * 1024 * 1024) {
        errDiv.innerText = "Tổng dung lượng >10MB. Vui lòng gửi ít file hơn."; 
        errDiv.style.display = 'block'; return;
    }

    btn.disabled = true; btn.innerText = "Đang xử lý...";
    errDiv.style.display = 'none'; progressDiv.style.display = 'block';
    statusDiv.innerText = `Đang đọc ${files.length} file...`;

    let filePayloads = [];
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e);
                reader.readAsDataURL(file);
            });
            
            filePayloads.push({
                fileName: file.name,
                mimeType: file.type || getMimeType(file.name),
                fileData: base64
            });
        }
    } catch (e) {
        console.error(e);
        errDiv.innerText = "Lỗi đọc file."; errDiv.style.display = 'block';
        btn.disabled = false; btn.innerText = "Gửi báo cáo";
        return;
    }

    statusDiv.innerText = "Đang gửi...";

    const payload = {
        ...getAuthPayload(),
        id: id,
        files: filePayloads
    };

    fetch(SCRIPT_URL + "?action=report_done", {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(async r => {
        const text = await r.text();
        try {
            const res = JSON.parse(text);
            if(res.status === 'success') {
                showToast("✅ " + res.message, 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('reportModal'));
                if (modal) modal.hide();
                loadTaskList();
            } else {
                showToast("⚠️ Lỗi từ Server: " + res.message, 'danger');
            }
        } catch(e) {
            showToast("Lỗi phản hồi Server.", 'danger');
        }
    })
    .catch(err => { showToast("Lỗi kết nối mạng: " + err, 'danger'); })
    .finally(() => {
        btn.disabled = false; btn.innerText = "Gửi báo cáo";
        progressDiv.style.display = 'none'; statusDiv.innerText = "";
        document.getElementById('fileListDisplay').innerHTML = "";
    });
}

function approveTask(id) {
    if(!currentUser || !isAdminUser(currentUser)) return showToast("⛔ Chỉ Admin mới được duyệt!", 'warning');
    if(!confirm('Duyệt hoàn thành công việc này?')) return;

    // Reuse centralized logic via apiFetch
    apiFetch('approve_done', { ...getAuthPayload(), id })
        .then(res => {
            if (res.status === 'error') throw new Error(res.message || 'Lỗi duyệt');
            showToast("Đã duyệt báo cáo thành công!", 'success'); loadTaskList();
        })
        .catch(err => showToast(err.message || "Lỗi duyệt", 'danger'));
}

function rejectTask(id) {
    if(!currentUser || !isAdminUser(currentUser)) return showToast("⛔ Chỉ Admin mới được duyệt!", 'warning');
    if(!confirm('Trả lại báo cáo này?')) return;

    // Reuse centralized logic via apiFetch — calls reject_done (NOT update_progress)
    apiFetch('reject_done', { ...getAuthPayload(), id })
        .then(res => {
            if (res.status === 'error') throw new Error(res.message || 'Lỗi reject');
            showToast("Đã trả lại báo cáo!", 'warning'); loadTaskList();
        })
        .catch(err => showToast(err.message || "Lỗi reject", 'danger'));
}

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
            id: currentDetailTaskId,
            role: currentUser.role
        });
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
    const fileUrl = task[10]; // Assuming index 10 is 'Tài liệu' / file upload
    if (fileUrl && String(fileUrl).trim() !== '') {
        fileContainer.innerHTML = `<a href="${escapeHtml(fileUrl)}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="bi bi-link-45deg"></i> Xem tài liệu đính kèm</a>`;
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
            await apiFetch('approve_done', { id, role: currentUser.role });
            showToast("Đã duyệt báo cáo thành công!", 'success');
        } else if (decision === 'reject') {
            // Revert progress back to Doing (e.g. 50%)
            await apiFetch('update_progress', { id, progress: 50, user_fullname: currentUser.name, role: currentUser.role });
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
    if (!confirm("Bạn muốn gửi mail nhắc nhở công việc này?")) return;
    
    try {
        await apiFetch('send_task_email', { id, role: currentUser.role });
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
        const res = await apiFetch('send_bulk_email', { role: currentUser.role });
        showToast(res?.message || "Đã gửi mail nhắc nhở hàng loạt!", 'success');
    } catch (err) {
        showToast("Lỗi: " + err.message, 'danger');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

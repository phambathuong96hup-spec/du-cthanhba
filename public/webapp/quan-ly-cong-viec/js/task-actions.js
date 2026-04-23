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

    // Close the detail modal first
    const detailModal = bootstrap.Modal.getInstance(document.getElementById('taskDetailModal'));
    if (detailModal) detailModal.hide();

    // Wait for the detail modal close animation to finish, then open edit modal
    setTimeout(function() {
        openEditTask(currentDetailTaskId);
    }, 350);
}

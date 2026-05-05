/* ═══════════════════════════════════════════
   Compliance — Nội quy / Khen thưởng
   ═══════════════════════════════════════════ */

let globalCompliance = [];

async function loadCompliance(silent = false) {
    try {
        const res = await apiFetch('read_compliance');
        globalCompliance = res.data || [];
        if (!silent) checkComplianceNotifications(globalCompliance);
        renderCompliance();
    } catch (err) {
        if (!silent) showToast("Lỗi tải nội quy: " + err.message, 'danger');
    }
}

function renderCompliance() {
    const tbody = document.getElementById('complianceBody');
    if (!tbody) return;

    if (globalCompliance.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-5">
            <i class="bi bi-clipboard-check fs-1 d-block mb-2 opacity-25"></i>Chưa có dữ liệu nội quy</td></tr>`;
        return;
    }

    tbody.innerHTML = globalCompliance.map((r, i) => {
        const hasExtraCol = r.length >= 6;
        const date = r[1] ? new Date(r[1]).toLocaleDateString('vi-VN') : '';
        const name = r[2] || '';
        const type = hasExtraCol ? r[3] : (String(r[3]).includes("Khen") ? "Khen thưởng" : "Vi phạm");
        const content = hasExtraCol ? r[4] : r[3];
        const note = hasExtraCol ? r[5] : r[4];
        const isReward = type.includes("Khen");
        const badgeClass = isReward ? 'bg-warning text-dark' : 'bg-danger';

        return `<tr class="fade-in" style="animation-delay:${i * 30}ms">
            <td class="fw-bold text-center" style="color:var(--text-light)">${i + 1}</td>
            <td><span class="date-badge">${escapeHtml(date)}</span></td>
            <td class="fw-semibold">${escapeHtml(name)}</td>
            <td><span class="badge ${badgeClass} rounded-pill px-3">${isReward ? '🏆' : '⚠️'} ${escapeHtml(type)}</span></td>
            <td>${escapeHtml(content)}</td>
            <td class="text-muted small">${escapeHtml(note || '')}</td>
        </tr>`;
    }).join('');
}

function showComplianceModal() {
    if (!currentUser || !isAdminUser(currentUser)) {
        return showToast('⛔ Chỉ Admin mới có quyền ghi nhận!', 'warning');
    }
    document.getElementById('complianceForm')?.reset();
    new bootstrap.Modal(document.getElementById('complianceModal')).show();
}

async function submitCompliance(btn) {
    const form = document.getElementById('complianceForm');
    const date = form.elements['date'].value;
    const name = form.elements['person'].value;
    const type = form.elements['type'].value;
    const content = form.elements['content'].value;
    const note = form.elements['note'].value;

    if (!date || !name || !content) return showToast("Vui lòng điền đầy đủ!", 'warning');

    setBtnLoading(btn, true);
    try {
        const res = await apiFetch('add_compliance', { date, name, type, content, note });
        showToast(res.message || "Đã ghi nhận!", 'success');
        bootstrap.Modal.getInstance(document.getElementById('complianceModal'))?.hide();
        loadCompliance();
    } catch (err) {
        showToast("Lỗi: " + err.message, 'danger');
    } finally {
        setBtnLoading(btn, false, '<i class="bi bi-check-lg me-1"></i>Ghi nhận');
    }
}

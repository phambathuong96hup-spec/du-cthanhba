/* ═══════════════════════════════════════════
   Compliance — Nội quy / Khen thưởng
   ═══════════════════════════════════════════ */

let globalCompliance = [];

function normalizeComplianceRow(row) {
    const hasExtraCol = row.length >= 6;
    return {
        id: row[0] || '',
        date: row[1] || '',
        name: row[2] || '',
        type: hasExtraCol ? (row[3] || '') : (String(row[3] || '').includes('Khen') ? 'Khen thưởng' : 'Vi phạm'),
        content: hasExtraCol ? (row[4] || '') : (row[3] || ''),
        note: hasExtraCol ? (row[5] || '') : (row[4] || ''),
    };
}

function encodeComplianceId(id) {
    return encodeURIComponent(String(id || ''));
}

function toDateInputValue(value) {
    if (!value) return new Date().toISOString().slice(0, 10);
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

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

    updateComplianceSummary(globalCompliance);

    if (globalCompliance.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">
            <i class="bi bi-clipboard-check fs-1 d-block mb-2 opacity-25"></i>Chưa có dữ liệu nội quy</td></tr>`;
        return;
    }

    const canManage = isAdminUser();
    tbody.innerHTML = globalCompliance.map((r, i) => {
        const item = normalizeComplianceRow(r);
        const date = item.date ? new Date(item.date).toLocaleDateString('vi-VN') : '';
        const isReward = item.type.includes("Khen");
        const badgeClass = isReward ? 'bg-warning text-dark' : 'bg-danger';
        const actions = canManage ? `
            <button type="button" class="btn btn-sm btn-outline-primary me-1" title="Sửa" onclick="editCompliance('${encodeComplianceId(item.id)}')">
                <i class="bi bi-pencil-square"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-danger" title="Xóa" onclick="deleteCompliance('${encodeComplianceId(item.id)}')">
                <i class="bi bi-trash3"></i>
            </button>` : '';

        return `<tr class="fade-in" style="animation-delay:${i * 30}ms">
            <td class="fw-bold text-center" style="color:var(--text-light)">${i + 1}</td>
            <td><span class="date-badge">${escapeHtml(date)}</span></td>
            <td class="fw-semibold">${escapeHtml(item.name)}</td>
            <td><span class="badge ${badgeClass} rounded-pill px-3">${isReward ? '🏆' : '⚠️'} ${escapeHtml(item.type)}</span></td>
            <td>${escapeHtml(item.content)}</td>
            <td class="text-muted small">${escapeHtml(item.note || '')}</td>
            <td class="text-end">${actions}</td>
        </tr>`;
    }).join('');
}

function getComplianceStats(rows) {
    return (rows || []).reduce((stats, row) => {
        const item = normalizeComplianceRow(row);
        if (String(item.type || '').includes('Khen')) stats.rewards++;
        else stats.violations++;
        return stats;
    }, { violations: 0, rewards: 0 });
}

function updateComplianceSummary(rows) {
    const stats = getComplianceStats(rows);
    animateCounter(document.getElementById('complianceViolationCount'), stats.violations);
    animateCounter(document.getElementById('complianceRewardCount'), stats.rewards);
}

function setComplianceModalMode(mode) {
    const label = document.getElementById('complianceModalLabel');
    const btn = document.getElementById('btnCompliance');
    if (label) label.textContent = mode === 'edit' ? 'Sửa ghi nhận Nội quy' : 'Ghi nhận Nội quy';
    if (btn) btn.innerHTML = mode === 'edit'
        ? '<i class="bi bi-check2-circle me-2"></i>Cập nhật'
        : '<i class="bi bi-save me-2"></i>Lưu ghi nhận';
}

function ensureCompliancePersonOption(name) {
    const select = document.getElementById('compliancePerson');
    if (!select || !name) return;
    const exists = Array.from(select.options).some(option => option.value === name);
    if (!exists) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    }
}

function showComplianceModal(record = null) {
    if (!currentUser || !isAdminUser(currentUser)) {
        return showToast('⛔ Chỉ Admin mới có quyền ghi nhận!', 'warning');
    }
    const form = document.getElementById('complianceForm');
    form?.reset();
    setComplianceModalMode(record ? 'edit' : 'create');
    if (form) {
        if (record) {
            const item = normalizeComplianceRow(record);
            ensureCompliancePersonOption(item.name);
            form.elements['id'].value = item.id;
            form.elements['date'].value = toDateInputValue(item.date);
            form.elements['person'].value = item.name;
            form.elements['type'].value = item.type || 'Vi phạm';
            form.elements['content'].value = item.content;
            form.elements['note'].value = item.note;
        } else {
            form.elements['id'].value = '';
            form.elements['date'].value = toDateInputValue(new Date());
        }
    }
    new bootstrap.Modal(document.getElementById('complianceModal')).show();
}

function editCompliance(encodedId) {
    const id = decodeURIComponent(encodedId || '');
    const record = globalCompliance.find(row => String(row[0] || '') === id);
    if (!record) return showToast('Không tìm thấy ghi nhận cần sửa.', 'warning');
    showComplianceModal(record);
}

async function submitCompliance(btn) {
    const form = document.getElementById('complianceForm');
    const id = form.elements['id'].value;
    const date = form.elements['date'].value;
    const name = form.elements['person'].value;
    const type = form.elements['type'].value;
    const content = form.elements['content'].value;
    const note = form.elements['note'].value;

    if (!date || !name || !content) return showToast("Vui lòng điền đầy đủ!", 'warning');

    setBtnLoading(btn, true);
    try {
        const action = id ? 'update_compliance' : 'add_compliance';
        const res = await apiFetch(action, { ...getAuthPayload(), id, date, person: name, type, fault: content, note });
        if (id && res?.message === 'Action not found') {
            throw new Error('Backend Apps Script chưa deploy chức năng sửa ghi nhận. Cần cập nhật GAS_Code.gs và Deploy lại Web App.');
        }
        if (res.status === 'error') throw new Error(res.message || 'Không thể lưu ghi nhận');
        showToast(res.message || (id ? "Đã cập nhật!" : "Đã ghi nhận!"), 'success');
        bootstrap.Modal.getInstance(document.getElementById('complianceModal'))?.hide();
        loadCompliance();
    } catch (err) {
        showToast("Lỗi: " + err.message, 'danger');
    } finally {
        const isEdit = Boolean(form.elements['id'].value);
        setBtnLoading(btn, false, isEdit ? '<i class="bi bi-check2-circle me-2"></i>Cập nhật' : '<i class="bi bi-save me-2"></i>Lưu ghi nhận');
    }
}

async function deleteCompliance(encodedId) {
    if (!currentUser || !isAdminUser(currentUser)) {
        return showToast('⛔ Chỉ Admin mới có quyền xóa!', 'warning');
    }
    const id = decodeURIComponent(encodedId || '');
    if (!id) return showToast('Thiếu mã ghi nhận cần xóa.', 'warning');
    const record = globalCompliance.find(row => String(row[0] || '') === id);
    const item = record ? normalizeComplianceRow(record) : null;
    const message = item
        ? `Xóa ghi nhận "${item.type}" của ${item.name}?`
        : 'Xóa ghi nhận này?';
    if (!confirm(message)) return;

    try {
        const res = await apiFetch('delete_compliance', { ...getAuthPayload(), id });
        if (res?.message === 'Action not found') {
            throw new Error('Backend Apps Script chưa deploy chức năng xóa ghi nhận. Cần cập nhật GAS_Code.gs và Deploy lại Web App.');
        }
        if (res.status === 'error') throw new Error(res.message || 'Không thể xóa ghi nhận');
        showToast(res.message || 'Đã xóa ghi nhận!', 'success');
        loadCompliance();
    } catch (err) {
        showToast("Lỗi: " + err.message, 'danger');
    }
}

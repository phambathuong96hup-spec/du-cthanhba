/* ═══════════════════════════════════════════
   Compliance — Nội quy / Vi phạm / Khen
   ═══════════════════════════════════════════ */

let globalCompliance = [];

async function loadCompliance(isPolling = false) {
    if (!isPolling) {
        const tb = document.getElementById('complianceBody');
        tb.innerHTML = '<tr><td colspan="5"><div class="skeleton"></div><div class="skeleton mt-2"></div></td></tr>';
    }

    try {
        const res = await apiFetch('read_compliance');
        globalCompliance = res.data || [];
        checkComplianceNotifications(globalCompliance);
        renderComplianceTable(globalCompliance);
    } catch (err) {
        console.error("Load compliance failed:", err);
        if (!isPolling) {
            document.getElementById('complianceBody').innerHTML =
                '<tr><td colspan="5" class="text-center text-danger py-4">Lỗi tải dữ liệu nội quy.</td></tr>';
        }
    }
}

function renderComplianceTable(data) {
    const tb = document.getElementById('complianceBody');
    tb.innerHTML = "";

    if (!data || !data.length) {
        tb.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Chưa có dữ liệu</td></tr>';
        return;
    }

    // Sort newest first
    const sorted = data.slice().sort((a, b) => new Date(b[1]) - new Date(a[1]));

    const html = [];
    let lastMonth = "";

    sorted.forEach(r => {
        const d = new Date(r[1]);
        if (isNaN(d.getTime())) return;

        // Month header
        const currentMonth = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
        if (currentMonth !== lastMonth) {
            lastMonth = currentMonth;
            html.push(`<tr class="table-group-header"><td colspan="5">📅 ${escapeHtml(currentMonth)}</td></tr>`);
        }

        // Parse: handle both 5-col and 6-col schemas
        const hasExtraCol = r.length >= 6;
        const type = hasExtraCol ? r[3] : (String(r[3]).includes("Khen") ? "Khen thưởng" : "Vi phạm");
        const content = hasExtraCol ? r[4] : r[3];
        const note = hasExtraCol ? r[5] : r[4];

        const isReward = type.includes("Khen");
        const badge = isReward
            ? '<span class="badge bg-warning bg-opacity-10 text-warning border border-warning">🏆 Khen thưởng</span>'
            : '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger">⚠️ Vi phạm</span>';

        html.push(`<tr>
            <td>${escapeHtml(d.toLocaleDateString('vi-VN'))}</td>
            <td class="fw-bold" style="color:var(--text-main)">${escapeHtml(r[2])}</td>
            <td>${badge}</td>
            <td class="text-muted">${escapeHtml(content)}</td>
            <td>${escapeHtml(note || '')}</td>
        </tr>`);
    });

    tb.innerHTML = html.join('');
}

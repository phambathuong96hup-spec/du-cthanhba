/* ═══════════════════════════════════════════
   Utils — Shared Helpers
   ═══════════════════════════════════════════ */

/**
 * Fetch wrapper with timeout + error handling
 */
async function apiFetch(action, data = null, timeout = 20000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const url = action ? `${SCRIPT_URL}?action=${action}` : SCRIPT_URL;
        const opts = data
            ? { method: 'POST', body: JSON.stringify(data), signal: controller.signal }
            : { signal: controller.signal };
        const res = await fetch(url, opts);
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch {
            throw new Error('Phản hồi không hợp lệ từ server');
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('Hết thời gian kết nối. Vui lòng thử lại.');
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'primary') {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    const iconMap = {
        'success': 'bi-check-circle-fill',
        'danger': 'bi-exclamation-octagon-fill',
        'warning': 'bi-exclamation-triangle-fill',
        'primary': 'bi-info-circle-fill'
    };

    const colorMap = {
        'success': { border: '#10b981', bg: '#ecfdf5', text: '#15803d' },
        'danger': { border: '#ef4444', bg: '#fef2f2', text: '#b91c1c' },
        'warning': { border: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
        'primary': { border: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' },
    };

    const icon = iconMap[type] || 'bi-bell-fill';
    const colors = colorMap[type] || colorMap.primary;

    const toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center border-0 shadow-lg mb-2';
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
        <div class="d-flex rounded-3" style="background:${colors.bg}; border-left:4px solid ${colors.border}; color:${colors.text};">
            <div class="toast-body d-flex align-items-center gap-2 fw-medium" style="font-size:0.88rem;">
                <i class="bi ${icon} fs-5"></i>
                <div>${escapeHtml(message)}</div>
            </div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>`;

    container.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (text == null) return "";
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

/**
 * Parse progress value from various formats
 */
function parseProgress(val) {
    if (!val) return 0;
    let s = String(val).replace(/^'/, '').replace('%', '').trim();
    let n = parseFloat(s);
    if (isNaN(n)) return 0;
    if (n <= 1 && n > 0 && s.includes('.')) return Math.round(n * 100);
    return Math.round(Math.min(100, Math.max(0, n)));
}

/**
 * Get initials from name
 */
function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Get deterministic color for name
 */
function getRandomColor(name) {
    const colors = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

/**
 * Get today at midnight for comparison
 */
function getToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Get effective status (Todo that's past creation date → Doing)
 */
function getEffectiveStatus(rawStatus, createdStr) {
    const today = getToday();
    let created = createdStr ? new Date(createdStr) : new Date();
    created.setHours(0, 0, 0, 0);
    if (rawStatus === 'Todo' && created < today) return 'Doing';
    return rawStatus;
}

/**
 * Set button loading state
 */
function setBtnLoading(btn, loading, originalText) {
    if (loading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Đang xử lý...';
        btn.disabled = true;
    } else {
        btn.innerHTML = originalText || btn.dataset.originalText || 'OK';
        btn.disabled = false;
    }
}

/**
 * Animate counter from 0 to target value
 */
function animateCounter(el, target, duration = 600) {
    if (!el) return;
    const start = parseInt(el.innerText) || 0;
    const diff = target - start;
    if (diff === 0) { el.innerText = target; return; }
    const startTime = performance.now();
    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        el.innerText = Math.round(start + diff * eased);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}


/* ═══════════════════════════════════════════
   Notifications — Real-time Updates
   ═══════════════════════════════════════════ */

let notifications = [];
let isFirstTaskLoad = true;
let isFirstComplianceLoad = true;
let lastTaskData = [];
let lastComplianceLength = 0;
let pollTimer = null;

function startPolling(interval = 60000) {
    stopPolling();
    pollTimer = setInterval(() => refreshAll(), interval);
}

function stopPolling() {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
}

function refreshAll() {
    loadTaskList(true);
    loadCompliance(true);
}

function checkTaskNotifications(newData) {
    if (isFirstTaskLoad) {
        lastTaskData = newData;
        isFirstTaskLoad = false;
        return;
    }
    if (!newData) return;

    const oldIds = new Set(lastTaskData.map(r => r[0]));
    newData.forEach(row => {
        if (!oldIds.has(row[0])) {
            addNotification('task', 'Công việc mới', row[1]);
            showToast(`Công việc mới: ${row[1]}`, 'primary');
        }
    });
    lastTaskData = newData;
}

function checkComplianceNotifications(newData) {
    if (isFirstComplianceLoad) {
        lastComplianceLength = newData.length;
        isFirstComplianceLoad = false;
        return;
    }
    if (newData.length > lastComplianceLength) {
        const newItems = newData.slice(lastComplianceLength);
        newItems.forEach(item => {
            const type = String(item[3]).includes("Khen") ? "Khen thưởng" : "Vi phạm";
            const title = type === "Khen thưởng" ? "🏆 Khen thưởng mới" : "⚠️ Vi phạm mới";
            addNotification(
                type === "Khen thưởng" ? 'reward' : 'warn',
                title,
                `${item[2]}: ${item[4] || item[3]}`
            );
        });
    }
    lastComplianceLength = newData.length;
}

function addNotification(type, title, message) {
    const iconMap = {
        'task': '<i class="bi bi-briefcase-fill text-primary"></i>',
        'waiting': '<i class="bi bi-hourglass-split text-warning"></i>',
        'reward': '<i class="bi bi-trophy-fill text-warning"></i>',
        'warn': '<i class="bi bi-exclamation-triangle-fill text-danger"></i>'
    };

    notifications.unshift({
        icon: iconMap[type] || '<i class="bi bi-bell-fill"></i>',
        title, message,
        time: 'Vừa xong',
        read: false
    });

    updateNotificationUI();
}

function updateNotificationUI() {
    const list = document.getElementById('notificationList');
    const badge = document.getElementById('notiBadge');

    const unreadCount = notifications.filter(n => !n.read).length;
    badge.innerText = unreadCount;
    badge.style.display = unreadCount > 0 ? 'block' : 'none';

    if (notifications.length === 0) {
        list.innerHTML = '<li class="p-4 text-center text-muted small">Không có thông báo mới</li>';
        return;
    }

    list.innerHTML = notifications.slice(0, 10).map(n =>
        `<li class="noti-item ${!n.read ? 'unread' : ''}">
            <div class="d-flex gap-3">
                <div class="noti-icon bg-white border shadow-sm">${n.icon}</div>
                <div>
                    <div class="fw-bold small" style="color:var(--text-main)">${escapeHtml(n.title)}</div>
                    <div class="text-muted" style="font-size:0.78rem;line-height:1.3">${escapeHtml(n.message)}</div>
                    <div class="text-secondary" style="font-size:0.68rem;margin-top:3px">${escapeHtml(n.time)}</div>
                </div>
            </div>
        </li>`
    ).join('');
}

function markAllRead() {
    if (notifications.some(n => !n.read)) {
        notifications.forEach(n => n.read = true);
        setTimeout(updateNotificationUI, 800);
    }
}

function refreshNotifications() {
    refreshAll();
}

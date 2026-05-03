/* ═══════════════════════════════════════════
   Dashboard — Charts, Calendar, Export
   ═══════════════════════════════════════════ */

google.charts.load('current', { 'packages': ['corechart', 'bar'] });

async function loadDashboard() {
    document.getElementById('calendar').innerHTML =
        '<div class="text-center p-5"><div class="spinner-border text-primary"></div><p class="text-muted small mt-2">Đang tải dữ liệu...</p></div>';

    try {
        const [taskRes, compRes] = await Promise.all([
            apiFetch(null),
            apiFetch('read_compliance')
        ]);
        globalData = taskRes.data || [];
        globalCompliance = compRes.data || [];
        updateReport();
    } catch (err) {
        document.getElementById('calendar').innerHTML =
            `<div class="text-center p-5 text-danger"><i class="bi bi-wifi-off fs-3"></i><p class="small mt-2">Lỗi tải: ${escapeHtml(err.message)}</p></div>`;
    }
}

function updateReport() {
    const monthStr = document.getElementById('reportMonthSelect').value;
    if (!monthStr) return;

    const [year, month] = monthStr.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    const today = getToday();

    const filteredTasks = globalData.filter(r => {
        const created = new Date(r[6]);
        const deadline = r[9] ? new Date(r[9]) : (r[4] ? new Date(r[4]) : new Date());
        return created <= endOfMonth && deadline >= startOfMonth;
    });

    const filteredCompliance = globalCompliance.filter(r => {
        const date = new Date(r[1]);
        return date >= startOfMonth && date <= endOfMonth;
    });

    // Stats
    const sTotal = filteredTasks.length;
    const sDone = filteredTasks.filter(r => String(r[2]).trim() === 'Done').length;

    const sDoingDeadline = filteredTasks.filter(r => {
        const st = String(r[2]).trim();
        const type = String(r[10] || "Thường quy");
        const dl = r[9] ? new Date(r[9]) : (r[4] ? new Date(r[4]) : null);
        const isOverdue = st !== 'Done' && dl && dl < today;
        return st !== 'Done' && !isOverdue && type !== 'Thường quy';
    }).length;

    const sDoingRoutine = filteredTasks.filter(r => {
        const st = String(r[2]).trim();
        const type = String(r[10] || "Thường quy");
        return (st === 'Doing' || st === 'Todo') && type === 'Thường quy';
    }).length;

    const sOverdue = filteredTasks.filter(r => {
        const st = String(r[2]).trim();
        const dl = r[9] ? new Date(r[9]) : (r[4] ? new Date(r[4]) : null);
        return st !== 'Done' && dl && dl < today;
    }).length;

    animateCounter(document.getElementById('stat-total'), sTotal);
    animateCounter(document.getElementById('stat-done'), sDone);
    animateCounter(document.getElementById('stat-doing-deadline'), sDoingDeadline);
    animateCounter(document.getElementById('stat-doing-routine'), sDoingRoutine);
    animateCounter(document.getElementById('stat-overdue'), sOverdue);

    drawCharts(filteredTasks, filteredCompliance);
    renderCal(filteredTasks, filteredCompliance, today);
}

function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        textColor: isDark ? '#e2e8f0' : '#334155',
        bg: 'transparent'
    };
}

function drawCharts(tasks, compliance) {
    const { textColor, bg } = getChartColors();
    const chartFont = 'Manrope';
    const today = getToday();

    // Task status
    const stats = { Done: 0, Doing: 0, Overdue: 0 };
    const diffStats = { '1': 0, '2': 0, '3': 0, '4': 0 };
    const personnel = {};

    tasks.forEach(r => {
        const status = String(r[2]).trim();
        const dlRaw = r[9] || r[4];
        const dl = dlRaw ? new Date(dlRaw) : null;
        const isOverdue = status !== 'Done' && dl && dl < today;
        const diff = r[12] || '1';

        if (status === 'Done') stats.Done++;
        else if (isOverdue) stats.Overdue++;
        else stats.Doing++;

        if (diffStats[diff] !== undefined) diffStats[diff]++;

        String(r[7]).split(',').forEach(n => {
            n = n.trim();
            if (n) {
                if (!personnel[n]) personnel[n] = { done: 0, overdue: 0, normal: 0 };
                if (status === 'Done') personnel[n].done++;
                else if (isOverdue) personnel[n].overdue++;
                else personnel[n].normal++;
            }
        });
    });

    // Pie chart — Task status
    const pieData = google.visualization.arrayToDataTable([
        ['Trạng thái', 'SL'],
        ['Đã xong', stats.Done],
        ['Đang làm', stats.Doing],
        ['Quá hạn', stats.Overdue]
    ]);
    new google.visualization.PieChart(document.getElementById('piechart_task')).draw(pieData, {
        colors: ['#10b981', '#3b82f6', '#ef4444'],
        pieHole: 0.55, fontName: chartFont,
        legend: { position: 'bottom', textStyle: { color: textColor, fontSize: 11 } },
        chartArea: { width: '90%', height: '75%' },
        backgroundColor: bg
    });

    // Pie chart — Difficulty
    const diffData = google.visualization.arrayToDataTable([
        ['Độ khó', 'SL'],
        ['Dễ', diffStats['1']], ['TB', diffStats['2']],
        ['Khó', diffStats['3']], ['Phức tạp', diffStats['4']]
    ]);
    new google.visualization.PieChart(document.getElementById('piechart_difficulty')).draw(diffData, {
        colors: ['#34d399', '#fbbf24', '#f87171', '#a78bfa'],
        pieHole: 0.55, fontName: chartFont,
        legend: { position: 'bottom', textStyle: { color: textColor, fontSize: 11 } },
        chartArea: { width: '90%', height: '75%' },
        backgroundColor: bg
    });

    // Bar chart — Personnel
    const arr = [['Nhân viên', 'Đã xong', 'Đang làm', 'Quá hạn']];
    Object.keys(personnel).sort().forEach(k => arr.push([k, personnel[k].done, personnel[k].normal, personnel[k].overdue]));

    if (arr.length > 1) {
        new google.visualization.ColumnChart(document.getElementById('barchart_task')).draw(
            google.visualization.arrayToDataTable(arr), {
            isStacked: true, colors: ['#10b981', '#3b82f6', '#ef4444'],
            fontName: chartFont,
            legend: { position: 'bottom', textStyle: { color: textColor, fontSize: 11 } },
            chartArea: { width: '85%', height: '70%' },
            backgroundColor: bg,
            hAxis: { textStyle: { color: textColor, fontSize: 10 } },
            vAxis: { textStyle: { color: textColor } }
        });
    }

    // Compliance charts
    drawComplianceChart(compliance, textColor, chartFont, bg);
}

function drawComplianceChart(data, textColor, font, bg) {
    const violations = {}, rewards = {};

    data.forEach(r => {
        const name = r[2];
        const hasExtraCol = r.length >= 6;
        const type = hasExtraCol ? r[3] : (String(r[3]).includes("Khen") ? "Khen" : "Vi phạm");

        if (type.includes("Khen")) {
            rewards[name] = (rewards[name] || 0) + 1;
        } else {
            violations[name] = (violations[name] || 0) + 1;
        }
    });

    // Violations chart
    const vArr = [['NV', 'Vi phạm', { role: "style" }]];
    Object.keys(violations).sort().forEach(k => {
        if (violations[k] > 0) vArr.push([k, violations[k], '#ef4444']);
    });

    const vEl = document.getElementById('columnchart_violation');
    if (vArr.length > 1) {
        new google.visualization.ColumnChart(vEl).draw(google.visualization.arrayToDataTable(vArr), {
            legend: 'none', fontName: font, chartArea: { width: '85%', height: '70%' },
            backgroundColor: bg, hAxis: { textStyle: { color: textColor } }, vAxis: { textStyle: { color: textColor } }
        });
    } else {
        vEl.innerHTML = `<div class="d-flex align-items-center justify-content-center h-100 text-muted small"><i class="bi bi-check-circle me-1"></i>Chưa có vi phạm</div>`;
    }

    // Rewards chart
    const rArr = [['NV', 'Khen thưởng', { role: "style" }]];
    Object.keys(rewards).sort().forEach(k => {
        if (rewards[k] > 0) rArr.push([k, rewards[k], '#f59e0b']);
    });

    const rEl = document.getElementById('columnchart_reward');
    if (rArr.length > 1) {
        new google.visualization.ColumnChart(rEl).draw(google.visualization.arrayToDataTable(rArr), {
            legend: 'none', fontName: font, chartArea: { width: '85%', height: '70%' },
            backgroundColor: bg, hAxis: { textStyle: { color: textColor } }, vAxis: { textStyle: { color: textColor } }
        });
    } else {
        rEl.innerHTML = `<div class="d-flex align-items-center justify-content-center h-100 text-muted small"><i class="bi bi-trophy me-1"></i>Chưa có khen thưởng</div>`;
    }
}

function renderCal(tasks, compliances, today) {
    const calendarEl = document.getElementById('calendar');
    calendarEl.innerHTML = '';

    const events = [];

    tasks.forEach(t => {
        const dateStr = t[9] || t[4];
        if (dateStr) {
            const isDone = String(t[2]).trim() === 'Done';
            const color = isDone ? '#10b981' : (new Date(dateStr) < today ? '#ef4444' : '#3b82f6');
            events.push({
                title: (isDone ? '✅ ' : '⏰ ') + t[1],
                start: dateStr,
                backgroundColor: color, borderColor: color,
                extendedProps: { description: t[7], type: 'task' }
            });
        }
    });

    compliances.forEach(r => {
        if (r[1]) {
            const hasExtraCol = r.length >= 6;
            const type = hasExtraCol ? r[3] : (String(r[3]).includes("Khen") ? "Khen thưởng" : "Vi phạm");
            const content = hasExtraCol ? r[4] : r[3];
            const isReward = type.includes("Khen");

            events.push({
                title: (isReward ? '🏆 ' : '⚠️ ') + r[2],
                start: r[1],
                backgroundColor: isReward ? '#f59e0b' : '#ef4444',
                borderColor: isReward ? '#f59e0b' : '#ef4444',
                allDay: true,
                extendedProps: { description: `[${type}] ${content}`, type: 'compliance' }
            });
        }
    });

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'vi',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listMonth'
        },
        events,
        height: 600,
        eventClick: function (info) {
            const props = info.event.extendedProps;
            alert(info.event.title + '\n' +
                (props.type === 'compliance' ? 'Nội dung: ' : 'Người làm: ') + props.description);
        }
    });
    calendar.render();
}

function exportExcelReport() {
    const monthStr = document.getElementById('reportMonthSelect').value;
    const [year, month] = monthStr.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const taskData = globalData.filter(r => {
        const created = new Date(r[6]);
        const deadline = r[9] ? new Date(r[9]) : (r[4] ? new Date(r[4]) : new Date());
        return created <= endOfMonth && deadline >= startOfMonth;
    }).map(r => ({
        "Tên công việc": r[1], "Tổ": r[11] || "",
        "Người thực hiện": r[7], "Trạng thái": r[2],
        "Ngày tạo": new Date(r[6]).toLocaleDateString('vi-VN'),
        "Deadline": r[9] ? new Date(r[9]).toLocaleDateString('vi-VN') : (r[4] ? new Date(r[4]).toLocaleDateString('vi-VN') : ""),
        "Tiến độ": r[8] + "%", "Ghi chú": r[5]
    }));

    const compData = globalCompliance.filter(r => {
        const d = new Date(r[1]);
        return d >= startOfMonth && d <= endOfMonth;
    }).map(r => {
        const h = r.length >= 6;
        return {
            "Ngày": new Date(r[1]).toLocaleDateString('vi-VN'),
            "Nhân viên": r[2],
            "Loại": h ? r[3] : (String(r[3]).includes("Khen") ? "Khen thưởng" : "Vi phạm"),
            "Nội dung": h ? r[4] : r[3],
            "Ghi chú": h ? r[5] : r[4]
        };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,
        taskData.length > 0 ? XLSX.utils.json_to_sheet(taskData) : XLSX.utils.json_to_sheet([{ "Note": "Không có dữ liệu" }]),
        "CongViec");
    if (compData.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(compData), "NoiQuy");
    }
    XLSX.writeFile(wb, `BaoCao_KhoaDuoc_${monthStr}.xlsx`);
}

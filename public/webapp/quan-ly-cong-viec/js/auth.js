/* ═══════════════════════════════════════════
   Auth — Login, Session, PIN
   ═══════════════════════════════════════════ */

let currentUser = null;

function checkSession() {
    const saved = sessionStorage.getItem('user');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            applyLoginState();
        } catch { currentUser = null; }
    }
}

function applyLoginState() {
    const isLoggedIn = !!currentUser;
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    const btnChangePin = document.getElementById('btnChangePin');
    const userDisplay = document.getElementById('userDisplay');

    if (btnLogin) btnLogin.style.display = isLoggedIn ? 'none' : 'block';
    if (btnLogout) btnLogout.style.display = isLoggedIn ? 'block' : 'none';
    if (btnChangePin) btnChangePin.style.display = isLoggedIn ? 'block' : 'none';
    if (userDisplay) userDisplay.innerText = isLoggedIn ? currentUser.name : "Khách";

    const isAdmin = currentUser && currentUser.role === 'Admin';
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.setProperty("display", isAdmin ? "block" : "none", "important");
    });
}

function showLoginModal() {
    new bootstrap.Modal(document.getElementById('loginModal')).show();
}

async function performLogin(btn) {
    const username = document.getElementById('loginUsername').value.trim();
    const pin = document.getElementById('loginPin').value.trim();

    if (!username || !pin) return showToast("Vui lòng nhập đầy đủ thông tin!", 'warning');

    setBtnLoading(btn, true);

    try {
        const res = await apiFetch('login', { username, pin });
        if (res.status === 'success') {
            currentUser = { username: res.username, name: res.name, role: res.role };
            sessionStorage.setItem('user', JSON.stringify(currentUser));
            applyLoginState();
            bootstrap.Modal.getInstance(document.getElementById('loginModal'))?.hide();
            loadTaskList();
            showToast(`Chào mừng trở lại, ${res.name}!`, 'success');
        } else {
            showToast(res.message || "Đăng nhập thất bại!", 'danger');
        }
    } catch (err) {
        showToast("Lỗi kết nối khi đăng nhập: " + err.message, 'danger');
    } finally {
        setBtnLoading(btn, false, 'Xác thực & Vào hệ thống');
    }
}

function logout() {
    sessionStorage.removeItem('user');
    currentUser = null;
    applyLoginState();
    location.reload();
}

function showChangePinModal() {
    new bootstrap.Modal(document.getElementById('changePinModal')).show();
}

async function submitChangePin() {
    const oldPin = document.getElementById('oldPin').value;
    const newPin = document.getElementById('newPin').value;
    const confirmPin = document.getElementById('confirmPin').value;

    if (!oldPin || !newPin) return showToast("Thiếu thông tin!", 'warning');
    if (newPin !== confirmPin) return showToast("PIN mới không khớp!", 'warning');

    try {
        const res = await apiFetch('change_pin', {
            username: currentUser.username, oldPin, newPin
        });
        showToast(res.message, res.status === 'success' ? 'success' : 'danger');
        if (res.status === 'success') {
            bootstrap.Modal.getInstance(document.getElementById('changePinModal'))?.hide();
            logout();
        }
    } catch (err) {
        showToast("Lỗi: " + err.message, 'danger');
    }
}

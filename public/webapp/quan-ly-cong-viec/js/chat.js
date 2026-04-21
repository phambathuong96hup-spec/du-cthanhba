/* ═══════════════════════════════════════════
   Chat — Lily AI Assistant
   ═══════════════════════════════════════════ */

let chatContext = [];

function toggleChat() {
    if (!currentUser) {
        showToast("Vui lòng đăng nhập để chat!", 'warning');
        showLoginModal();
        return;
    }
    const box = document.getElementById('chatBox');
    const isOpen = box.style.display === 'flex';
    box.style.display = isOpen ? 'none' : 'flex';
    if (!isOpen) document.getElementById('chatInput').focus();
}

function fillChat(msg) {
    document.getElementById('chatInput').value = msg;
    sendMessage();
}

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const historyDiv = document.getElementById('chatHistory');
    const typing = document.getElementById('typingIndicator');
    const question = input.value.trim();

    if (!question) return;

    // Display user message
    historyDiv.innerHTML += `<div class="msg msg-user">${escapeHtml(question)}</div>`;
    input.value = '';
    historyDiv.scrollTop = historyDiv.scrollHeight;
    typing.style.display = 'block';

    const historyText = chatContext.slice(-6).map(m => `${m.role}: ${m.content}`).join("\n");

    try {
        const res = await apiFetch('ask_ai', { question, history: historyText }, 30000);

        typing.style.display = 'none';

        let answer = '';
        if (res.status === 'success') {
            answer = res.answer;
        } else {
            answer = "Lỗi: " + (res.message || 'Không rõ');
        }

        const displayHtml = escapeHtml(answer).replace(/\n/g, '<br>');
        historyDiv.innerHTML += `<div class="msg msg-ai">${displayHtml}</div>`;

        chatContext.push({ role: "User", content: question });
        chatContext.push({ role: "Lily", content: answer });
    } catch (err) {
        typing.style.display = 'none';
        historyDiv.innerHTML += `<div class="msg msg-ai" style="color:var(--text-light)"><i class="bi bi-wifi-off me-1"></i>${escapeHtml(err.message)}</div>`;
    }

    historyDiv.scrollTop = historyDiv.scrollHeight;
}

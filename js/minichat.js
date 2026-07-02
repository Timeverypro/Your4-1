// 1. CHAT ASSET CONFIGURATION
const minichatConfig = {
    databaseURL: "https://room401-webboard-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Auto check path position depths to resolve relative asset configurations
const isInSubFolder = window.location.pathname.includes('/sub/');
const rootPrefix = isInSubFolder ? '../' : './';

// Only load Firebase framework libraries dynamically if not already declared on the parent container page
if (typeof firebase === 'undefined') {
    const fbApp = document.createElement('script');
    fbApp.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
    document.head.appendChild(fbApp);

    const fbDb = document.createElement('script');
    fbDb.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js";
    document.head.appendChild(fbDb);

    fbDb.onload = () => { initMiniChatWidget(); };
} else {
    initMiniChatWidget();
}

function initMiniChatWidget() {
    if (!firebase.apps.length) {
        firebase.initializeApp(minichatConfig);
    }
    const chatDb = firebase.database();
    const myChatName = localStorage.getItem('studentName') || 'Guest';

    // 2. INJECT WIDGET CSS STYLES DIRECTLY INTO THE DOM HEAD
    const styles = `
        .mini-chat-wrapper {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .chat-launcher-btn {
            width: 50px;
            height: 50px;
            background: #a855f7;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            user-select: none;
            transition: transform 0.2s;
        }
        .chat-launcher-btn:hover { transform: scale(1.08); background: #9333ea; }
        
        .chat-popup-box {
            position: absolute;
            bottom: 65px;
            left: 0;
            width: 300px;
            height: 400px;
            background: #1e2937;
            border: 2px solid #334155;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            display: none;
            flex-direction: column;
            overflow: hidden;
        }
        .chat-popup-box.open { display: flex; }
        
        .chat-pop-header {
            background: #111827;
            padding: 12px 15px;
            font-weight: bold;
            font-size: 14px;
            color: #a855f7;
            border-bottom: 1px solid #334155;
            display: flex;
            justify-content: space-between;
        }
        .chat-pop-body {
            flex-grow: 1;
            background: #0f172a;
            display: flex;
            flex-direction: column;
            height: calc(100% - 43px);
        }
        .chat-pop-logs {
            flex-grow: 1;
            padding: 12px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .pop-msg-row { display: flex; flex-direction: column; font-size: 13px; }
        .pop-msg-meta { font-size: 11px; color: #64748b; margin-bottom: 2px; font-weight: 500; }
        .pop-msg-text { background: #1e2937; border: 1px solid #334155; padding: 6px 12px; border-radius: 8px; width: fit-content; max-width: 90%; word-break: break-all; color: white; }
        
        .pop-input-form { padding: 8px; background: #111827; border-top: 1px solid #334155; display: flex; gap: 6px; margin: 0; }
        .pop-input-form input { background: #0f172a; border: 1px solid #334155; color: white; padding: 8px 12px; margin: 0; font-size: 13px; border-radius: 6px; flex-grow: 1; outline: none; }
        .pop-input-form button { padding: 0 14px; border-radius: 6px; background: #a855f7; color: white; border: none; font-weight: bold; cursor: pointer; font-size: 13px; }
        .pop-input-form button:hover { background: #9333ea; }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // 3. GENERATE DOM STRUCTURAL WIDGET TREE OVERLAYS
    const wrapper = document.createElement('div');
    wrapper.className = 'mini-chat-wrapper';
    wrapper.innerHTML = `
        <div class="chat-launcher-btn" id="mini-launcher-btn">💬</div>
        <div class="chat-popup-box" id="mini-popup-box">
            <div class="chat-pop-header">
                <span>⚡ Live Chat</span>
                <span style="cursor:pointer;color:#64748b;" id="mini-close-x">✕</span>
            </div>
            <div class="chat-pop-body">
                <div class="chat-pop-logs" id="mini-logs-box"></div>
                <form class="pop-input-form" id="mini-chat-form">
                    <input type="text" id="mini-msg-input" placeholder="Say something..." autocomplete="off" required>
                    <button type="submit">Send</button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(wrapper);

    // Element binding references
    const launcherBtn = document.getElementById('mini-launcher-btn');
    const popupBox = document.getElementById('mini-popup-box');
    const closeX = document.getElementById('mini-close-x');
    const logsBox = document.getElementById('mini-logs-box');
    const chatForm = document.getElementById('mini-chat-form');
    const msgInput = document.getElementById('mini-msg-input');

    // 4. ACTION INTERACTORS
    launcherBtn.addEventListener('click', () => {
        popupBox.classList.toggle('open');
        if (popupBox.classList.contains('open')) {
            logsBox.scrollTop = logsBox.scrollHeight;
        }
    });
    closeX.addEventListener('click', () => popupBox.classList.remove('open'));

    // Synchronize Realtime Data Feed Streams
    chatDb.ref('mini_chat').limitToLast(40).on('value', (snapshot) => {
        logsBox.innerHTML = '';
        const data = snapshot.val();
        if (!data) return;

        for (let key in data) {
            const chat = data[key];
            const timeStr = new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const row = document.createElement('div');
            row.className = 'pop-msg-row';
            row.innerHTML = `
                <span class="pop-msg-meta">${chat.senderName} • ${timeStr}</span>
                <span class="pop-msg-text">${escapeChatHTML(chat.message)}</span>
            `;
            logsBox.appendChild(row);
        }
        logsBox.scrollTop = logsBox.scrollHeight;
    });

    // Write chat text payload out to data pipeline branches
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = msgInput.value.trim();
        if (!text) return;

        chatDb.ref('mini_chat').push({
            senderName: myChatName,
            message: text,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        msgInput.value = '';
    });

    function escapeChatHTML(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
}
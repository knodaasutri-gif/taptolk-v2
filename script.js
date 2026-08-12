ファイル名
役割・分類
ソースコード
 
index.html
HTML（構造定義）
アプリの画面レイアウト、UI要素（ボタン、モーダル、入力エリア等）の構造を定義。
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TapTalk Mobile</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div class="app-container">
        <!-- 発話・認識テキスト表示エリア -->
        <div class="speech-display" id="speechDisplay">
            <span class="placeholder-text" id="speechPlaceholder">カードをタップするとここに文字が表示されます</span>
            <span class="speech-text" id="speechText" style="display: none;"></span>
            <button class="stop-btn" id="stopBtn" onclick="stopSpeech()">🛑 停止</button>
        </div>

        <!-- 自由入力用インプット -->
        <div class="text-input-container" id="textInputContainer">
            <input type="text" id="customTextInput" placeholder="伝えたい言葉を入力..." onkeypress="handleKeyPress(event)">
            <button class="submit-btn" onclick="speakCustomInput()">発話</button>
        </div>

        <!-- メイン操作バー -->
        <div class="action-bar">
            <button class="action-btn mic-btn" id="micBtn" onclick="toggleSpeechRecognition()">🎤 音声入力</button>
            <button class="action-btn text-btn" onclick="toggleTextInput()">✏️ 自由入力</button>
            <button class="action-btn add-btn" onclick="openAddModal()">➕ カード作成</button>
            <button class="action-btn manage-btn" id="manageBtn" onclick="toggleManageMode()">⚙️ 編集</button>
        </div>

        <!-- カテゴリータブ -->
        <div class="category-tabs" id="categoryTabs"></div>

        <!-- 日時指定エリア（お休み・遅刻用） -->
        <div class="calendar-section" id="calendarSection" style="display: none;">
            <h3>📅 日時を選んでワンタッチ連絡</h3>
            <div class="cal-controls">
                <input type="date" id="leaveDateInput">
                <div class="quick-date-btns">
                    <button onclick="setQuickDate(0)">今日</button>
                    <button onclick="setQuickDate(1)">明日</button>
                    <button onclick="setQuickDate(2)">明後日</button>
                </div>
            </div>
            <div class="time-select-row">
                <label>⏰ 時間指定（必要な場合）</label>
                <select id="leaveTimeInput">
                    <option value="">指定なし</option>
                    <option value="08:00">08:00</option>
                    <option value="08:30">08:30</option>
                    <option value="09:00">09:00</option>
                    <option value="09:30">09:30</option>
                    <option value="10:00">10:00</option>
                    <option value="10:30">10:30</option>
                    <option value="11:00">11:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                </select>
            </div>
            <p style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">タップしてカード作成＆送信:</p>
            <div class="quick-leave-grid">
                <button class="leave-quick-btn" onclick="generateLeaveCard('終日お休みします', '📅', false)">📅 終日お休み</button>
                <button class="leave-quick-btn" onclick="generateLeaveCard('遅れて出勤します', '⏱️', true)">⏱️ 時間指定遅刻</button>
                <button class="leave-quick-btn" onclick="generateLeaveCard('早退します', '🏃', true)">🏃 時間指定早退</button>
                <button class="leave-quick-btn" onclick="generateLeaveCard('午前休をいただきます', '🌅', false)">🌅 午前休</button>
                <button class="leave-quick-btn" onclick="generateLeaveCard('午後休をいただきます', '🌄', false)">🌄 午後休</button>
                <button class="leave-quick-btn" onclick="generateLeaveCard('通院のため遅れます', '🏥', true)">🏥 通院（時間指定）</button>
            </div>
        </div>

        <!-- カードグリッド表示エリア -->
        <div class="cards-grid" id="cardsGrid"></div>
    </div>

    <!-- モーダル（カード追加画面） -->
    <div class="modal-overlay" id="addModal">
        <div class="modal">
            <div class="modal-header">新規カード作成</div>
            <div class="form-group">
                <label>カテゴリー</label>
                <select id="modalCategory"></select>
            </div>
            <div class="form-group">
                <label>アイコン (絵文字)</label>
                <input type="text" id="modalIcon" placeholder="例: 💬" value="💬">
            </div>
            <div class="form-group">
                <label>伝える言葉</label>
                <input type="text" id="modalText" placeholder="例: お願いします">
            </div>
            <div class="modal-btns">
                <button class="modal-btn cancel" onclick="closeAddModal()">キャンセル</button>
                <button class="modal-btn save" onclick="saveNewCard()">追加</button>
            </div>
        </div>
    </div>

    <!-- トースト通知 -->
    <div class="toast-msg" id="toastMsg"></div>

    <script src="script.js"></script>
</body>
</html>
style.css
CSS（スタイル定義）
デザイン、カラーパレット、カードのグリッドレイアウト、レスポンシブ表示ルールを定義。
:root {
    --bg-color: #f1f5f9;
    --card-bg: #ffffff;
    --text: #1e293b;
    --text-muted: #64748b;
    --primary: #4f46e5;
    --primary-light: #e0e7ff;
    --danger: #ef4444;
    --success: #10b981;
    --radius: 16px;
    --shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    -webkit-tap-highlight-color: transparent;
}

body {
    background-color: var(--bg-color);
    color: var(--text);
    padding: 12px;
    display: flex;
    justify-content: center;
}

.app-container {
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.speech-display {
    background: var(--card-bg);
    padding: 16px;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    min-height: 70px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.2rem;
    font-weight: bold;
    word-break: break-all;
    position: relative;
}

.placeholder-text {
    color: var(--text-muted);
    font-size: 0.95rem;
    font-weight: normal;
}

.stop-btn {
    background: var(--danger);
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    white-space: nowrap;
    margin-left: 8px;
}

.text-input-container {
    display: none;
    gap: 8px;
}

.text-input-container input {
    flex: 1;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    font-size: 1rem;
    outline: none;
}

.submit-btn {
    background: var(--primary);
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 10px;
    font-weight: bold;
    cursor: pointer;
}

.action-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
}

.action-btn {
    padding: 10px 4px;
    border: none;
    border-radius: 10px;
    font-weight: bold;
    font-size: 0.85rem;
    cursor: pointer;
    box-shadow: var(--shadow);
}

.mic-btn { background: #3b82f6; color: white; }
.mic-btn.listening {
    background: var(--danger);
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
}

.text-btn { background: #a855f7; color: white; }
.add-btn { background: #10b981; color: white; }
.manage-btn { background: #e2e8f0; color: var(--text); }

.category-tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
}

.category-tabs::-webkit-scrollbar { display: none; }

.tab-btn {
    padding: 8px 14px;
    border-radius: 20px;
    border: 1px solid #cbd5e1;
    background: white;
    font-size: 0.9rem;
    white-space: nowrap;
    cursor: pointer;
}

.tab-btn.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
    font-weight: bold;
}

.calendar-section {
    background: white;
    padding: 12px;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
}

.calendar-section h3 {
    font-size: 0.95rem;
    margin-bottom: 8px;
}

.cal-controls {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}

.cal-controls input[type="date"] {
    padding: 6px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
}

.quick-date-btns {
    display: flex;
    gap: 4px;
}

.quick-date-btns button {
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    border-radius: 6px;
    font-size: 0.8rem;
}

.time-select-row {
    margin-bottom: 10px;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

.time-select-row select {
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
}

.quick-leave-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
}

.leave-quick-btn {
    padding: 8px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: bold;
    text-align: left;
    color: var(--primary);
}

.cards-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.card {
    background: var(--card-bg);
    padding: 16px;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 100px;
    cursor: pointer;
    position: relative;
}

.card-icon { font-size: 2rem; margin-bottom: 6px; }
.card-text { font-size: 0.95rem; font-weight: bold; line-height: 1.3; }

.delete-card-btn {
    display: none;
    position: absolute;
    top: 6px;
    right: 6px;
    background: var(--danger);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    font-weight: bold;
    cursor: pointer;
}

body.manage-mode .delete-card-btn { display: block; }

.modal-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.modal {
    background: white;
    padding: 20px;
    border-radius: var(--radius);
    width: 90%;
    max-width: 360px;
}

.modal-header { font-weight: bold; margin-bottom: 12px; font-size: 1.1rem; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px; }
.form-group input, .form-group select {
    width: 100%;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
}

.modal-btns { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.modal-btn { padding: 8px 16px; border-radius: 8px; border: none; font-weight: bold; }
.modal-btn.cancel { background: #e2e8f0; }
.modal-btn.save { background: var(--primary); color: white; }

.toast-msg {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: #334155;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.85rem;
    transition: transform 0.3s ease;
    z-index: 200;
}

.toast-msg.show { transform: translateX(-50%) translateY(0); }
script.js
JavaScript（機能制御）
Web Speech APIによる音声合成（読み上げ）と連続音声認識、ローカルストレージ連携、カード動的生成・削除ロジックを実装。
const defaultCategories = [
    {
        id: "work",
        name: "作業・指示",
        cards: [
            { id: "w1", icon: "✅", text: "確認をお願いします。" },
            { id: "w2", icon: "⏱️", text: "あと何分作業したほうがいいですか？" },
            { id: "w3", icon: "🧹", text: "掃除場所はどこですか？" },
            { id: "w4", icon: "🪑", text: "椅子に座って作業していいですか？" },
            { id: "w5", icon: "❓", text: "わからないことがあるので来ていただけますか？" },
            { id: "w6", icon: "🔄", text: "もう一度説明をお願いできますか？" },
            { id: "w7", icon: "📄", text: "次のスケジュールは何ですか？" }
        ]
    },
    {
        id: "morning",
        name: "朝礼・挨拶",
        cards: [
            { id: "m1", icon: "🌅", text: "みなさんおはようございます！" },
            { id: "m2", icon: "🤝", text: "よろしくお願いいたします。" },
            { id: "m3", icon: "🙋‍♂️", text: "はい、出席しています。" },
            { id: "m4", icon: "🚪", text: "お先に失礼します。お疲れ様でした！" },
            { id: "m5", icon: "👋", text: "御用は何でしょうか？" }
        ]
    },
    {
        id: "health",
        name: "体調・移動",
        cards: [
            { id: "h1", icon: "🚻", text: "トイレに行っていいですか？" },
            { id: "h2", icon: "☕", text: "5分休憩してもいいですか？" },
            { id: "h3", icon: "🤒", text: "少し体調がすぐれません。" },
            { id: "h4", icon: "🙆‍♂️", text: "大丈夫です！問題ありません。" }
        ]
    },
    {
        id: "chat",
        name: "雑談・返答",
        cards: [
            { id: "c1", icon: "😊", text: "ありがとうございます！" },
            { id: "c2", icon: "👉", text: "今、お時間いいですか？" },
            { id: "c3", icon: "👏", text: "そうなんですね！" },
            { id: "c4", icon: "🎮", text: "趣味やお話しをしませんか？" },
            { id: "c5", icon: "🍱", text: "一緒にお昼どうですか？" }
        ]
    },
    {
        id: "leave",
        name: "📅 お休み・遅刻",
        cards: []
    }
];

let appData = [];
let currentCategoryId = "work";
let isManageMode = false;
let isListening = false;
let recognition = null;
const synth = window.speechSynthesis;
let audioCtx = null;

function triggerHaptic() {
    if (navigator.vibrate) navigator.vibrate(30);
}

function playTapChime() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.11);
    } catch (e) {}
}

function showToast(msg) {
    const toast = document.getElementById("toastMsg");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}

function initApp() {
    loadData();
    const leaveDateInput = document.getElementById("leaveDateInput");
    if (leaveDateInput) {
        const today = new Date().toISOString().split('T')[0];
        leaveDateInput.value = today;
    }
    renderCategoryTabs();
    renderCards();
    populateModalCategories();
    initSpeechRecognition();
}

function loadData() {
    const savedData = localStorage.getItem("taptalk_pixel_v1");
    if (savedData) {
        try { appData = JSON.parse(savedData); } catch (e) { appData = defaultCategories; }
    } else {
        appData = defaultCategories;
    }
}

function saveData() {
    localStorage.setItem("taptalk_pixel_v1", JSON.stringify(appData));
}

function renderCategoryTabs() {
    const tabsContainer = document.getElementById("categoryTabs");
    if (!tabsContainer) return;
    tabsContainer.innerHTML = "";
    appData.forEach(cat => {
        const btn = document.createElement("button");
        btn.className = `tab-btn ${cat.id === currentCategoryId ? 'active' : ''}`;
        btn.textContent = cat.name;
        btn.onclick = () => {
            triggerHaptic();
            currentCategoryId = cat.id;
            renderCategoryTabs();
            renderCards();
        };
        tabsContainer.appendChild(btn);
    });
}

function renderCards() {
    const grid = document.getElementById("cardsGrid");
    const calSection = document.getElementById("calendarSection");
    if (!grid) return;
    grid.innerHTML = "";
    if (calSection) {
        calSection.style.display = (currentCategoryId === "leave") ? "block" : "none";
    }
    const currentCat = appData.find(c => c.id === currentCategoryId);
    if (!currentCat || currentCat.cards.length === 0) {
        if (currentCategoryId !== "leave") {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 30px 0;">カードがありません</div>`;
        }
        return;
    }
    currentCat.cards.forEach(card => {
        const cardEl = document.createElement("div");
        cardEl.className = "card";
        cardEl.innerHTML = `
            <button class="delete-card-btn" onclick="deleteCard(event, '${card.id}')">✕</button>
            <div class="card-icon">${card.icon}</div>
            <div class="card-text">${card.text}</div>
        `;
        cardEl.onclick = () => {
            if (isManageMode) return;
            triggerHaptic();
            speakText(card.text);
        };
        grid.appendChild(cardEl);
    });
}

function speakText(text) {
    if (isListening && recognition) {
        isListening = false;
        try { recognition.stop(); } catch (e) {}
        const micBtn = document.getElementById("micBtn");
        if (micBtn) {
            micBtn.classList.remove("listening");
            micBtn.textContent = "🎤 音声入力";
        }
    }

    const placeholder = document.getElementById("speechPlaceholder");
    const speechText = document.getElementById("speechText");
    if (placeholder) placeholder.style.display = "none";
    if (speechText) {
        speechText.style.display = "block";
        speechText.textContent = text;
    }
    playTapChime();
    if (synth) {
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ja-JP";
        synth.speak(utterance);
    }
}

function stopSpeech() {
    triggerHaptic();
    if (synth) {
        synth.cancel();
    }
    showToast("音声を停止しました");
}

function toggleTextInput() {
    triggerHaptic();
    const container = document.getElementById("textInputContainer");
    const input = document.getElementById("customTextInput");
    if (container.style.display === "flex") {
        container.style.display = "none";
    } else {
        container.style.display = "flex";
        input.focus();
    }
}

function speakCustomInput() {
    const input = document.getElementById("customTextInput");
    const text = input.value.trim();
    if (!text) {
        showToast("文字を入力してください");
        return;
    }
    speakText(text);
    input.value = "";
}

function handleKeyPress(e) {
    if (e.key === 'Enter') {
        speakCustomInput();
    }
}

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        const micBtn = document.getElementById("micBtn");
        if (micBtn) micBtn.style.display = "none";
        return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        const placeholder = document.getElementById("speechPlaceholder");
        const speechText = document.getElementById("speechText");
        if (placeholder) placeholder.style.display = "none";
        if (speechText) {
            speechText.style.display = "block";
            speechText.textContent = transcript;
        }
    };

    recognition.onend = () => {
        if (isListening) {
            try {
                recognition.start();
            } catch (e) {}
        } else {
            const micBtn = document.getElementById("micBtn");
            if (micBtn) {
                micBtn.classList.remove("listening");
                micBtn.textContent = "🎤 音声入力";
            }
        }
    };
}

function toggleSpeechRecognition() {
    if (!recognition) {
        showToast("お使いのブラウザは音声入力非対応です");
        return;
    }
    triggerHaptic();
    const micBtn = document.getElementById("micBtn");
    if (isListening) {
        isListening = false;
        recognition.stop();
        if (micBtn) {
            micBtn.classList.remove("listening");
            micBtn.textContent = "🎤 音声入力";
        }
        showToast("音声入力をオフにしました");
    } else {
        try {
            isListening = true;
            recognition.start();
            if (micBtn) {
                micBtn.classList.add("listening");
                micBtn.textContent = "🛑 聞き取り中…";
            }
            showToast("音声入力をオンにしました（連続認識）");
        } catch (e) {}
    }
}

function toggleManageMode() {
    triggerHaptic();
    isManageMode = !isManageMode;
    document.body.classList.toggle("manage-mode", isManageMode);
    const manageBtn = document.getElementById("manageBtn");
    if (manageBtn) {
        manageBtn.textContent = isManageMode ? "✅ 完了" : "⚙️ 編集";
        manageBtn.style.background = isManageMode ? "#10b981" : "#e2e8f0";
        manageBtn.style.color = isManageMode ? "white" : "var(--text)";
    }
}

function deleteCard(event, cardId) {
    event.stopPropagation();
    triggerHaptic();
    const currentCat = appData.find(c => c.id === currentCategoryId);
    if (currentCat) {
        currentCat.cards = currentCat.cards.filter(c => c.id !== cardId);
        saveData();
        renderCards();
        showToast("カードを削除しました");
    }
}

function openAddModal() {
    triggerHaptic();
    populateModalCategories();
    document.getElementById("addModal").style.display = "flex";
}

function closeAddModal() {
    document.getElementById("addModal").style.display = "none";
}

function populateModalCategories() {
    const select = document.getElementById("modalCategory");
    if (!select) return;
    select.innerHTML = "";
    appData.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.textContent = cat.name;
        select.appendChild(opt);
    });
    select.value = currentCategoryId;
}

function saveNewCard() {
    const catId = document.getElementById("modalCategory").value;
    const icon = document.getElementById("modalIcon").value.trim() || "💬";
    const text = document.getElementById("modalText").value.trim();
    if (!text) {
        showToast("言葉を入力してください");
        return;
    }
    const cat = appData.find(c => c.id === catId);
    if (cat) {
        cat.cards.push({
            id: "custom_" + Date.now(),
            icon: icon,
            text: text
        });
        saveData();
        closeAddModal();
        document.getElementById("modalText").value = "";
        currentCategoryId = catId;
        renderCategoryTabs();
        renderCards();
        showToast("カードを追加しました");
    }
}

function setQuickDate(addDays) {
    triggerHaptic();
    const d = new Date();
    d.setDate(d.getDate() + addDays);
    const leaveDateInput = document.getElementById("leaveDateInput");
    if (leaveDateInput) {
        leaveDateInput.value = d.toISOString().split('T')[0];
    }
}

function formatTimeText(timeVal) {
    if (!timeVal) return "";
    const parts = timeVal.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return minutes === 0 ? `${hours}時` : `${hours}時${minutes}分`;
}

function generateLeaveCard(typeText, icon, includeTime) {
    triggerHaptic();
    const dateInput = document.getElementById("leaveDateInput");
    const timeInput = document.getElementById("leaveTimeInput");
    if (!dateInput || !dateInput.value) return;
    const dateObj = new Date(dateInput.value);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const dateStr = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日（${days[dateObj.getDay()]}）`;
    
    let timeStr = "";
    if (includeTime && timeInput && timeInput.value) {
        timeStr = formatTimeText(timeInput.value) + " ";
    }
    const fullText = `${dateStr} ${timeStr}${typeText}`;
    const leaveCat = appData.find(c => c.id === "leave");
    if (leaveCat) {
        leaveCat.cards.push({
            id: "leave_" + Date.now(),
            icon: icon || "📅",
            text: fullText
        });
        saveData();
        renderCards();
    }
    speakText(fullText);
}

window.onload = initApp;



// --- 単語置換辞書（ここによくある誤字や変換したい単語を登録） ---
const wordDictionary = {
    "ジェミニ": "Gemini",
    "ジェミニー": "Gemini",
    // 必要に応じてここに追加していきます
};

// 単語を置換する関数
function applyCustomDictionary(text) {
    let resultText = text;
    for (const [key, value] of Object.entries(wordDictionary)) {
        resultText = resultText.replaceAll(key, value);
    }
    return resultText;
}
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

 // --- お気に入りデータの取得と保存（安全取得版） ---
function getFavorites() {
    try {
        const favs = localStorage.getItem("favoriteCards");
        const parsed = favs ? JSON.parse(favs) : [];
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (e) {
        return [];
    }
}

function toggleFavorite(cardId, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    if (typeof triggerHaptic === 'function') triggerHaptic();

    // 最新のデータを毎回ローカルストレージから直に取得
    let favorites = getFavorites();
    const targetId = String(cardId).trim();

    if (!targetId) return;

    if (favorites.includes(targetId)) {
        // 解除：該当IDをすべて確実に除外
        favorites = favorites.filter(id => id !== targetId);
    } else {
        // 追加：重複しないように追加
        if (!favorites.includes(targetId)) {
            favorites.push(targetId);
        }
    }

    localStorage.setItem("favoriteCards", JSON.stringify(favorites));
    renderCards(); // 即座に再描画
}

// --- カテゴリータブの描画 ---
function renderCategoryTabs() {
    const tabsContainer = document.getElementById("categoryTabs");
    if (!tabsContainer) return;
    tabsContainer.innerHTML = "";

    // 通常のカテゴリータブを生成
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

    // 「⭐ お気に入り」タブを生成
    const favBtn = document.createElement("button");
    favBtn.className = `tab-btn ${currentCategoryId === 'favorite' ? 'active' : ''}`;
    favBtn.textContent = "⭐ お気に入り";
    favBtn.onclick = () => {
        triggerHaptic();
        currentCategoryId = 'favorite';
        renderCategoryTabs();
        renderCards();
    };
    tabsContainer.appendChild(favBtn);
}

// --- カードの描画 ---
function renderCards() {
    const grid = document.getElementById("cardsGrid");
    const calSection = document.getElementById("calendarSection");
    if (!grid) return;
    grid.innerHTML = "";

    if (calSection) {
        calSection.style.display = (currentCategoryId === "leave") ? "block" : "none";
    }

    const favorites = getFavorites();
    let cardsToRender = [];

    // 表示するカードの選定
    if (currentCategoryId === 'favorite') {
        // 全カテゴリーからお気に入りカードを収集（重複排除）
        const addedIds = new Set();
        appData.forEach(cat => {
            if (cat.cards) {
                cat.cards.forEach(card => {
                    const cId = String(card.id || card.text).trim();
                    if (favorites.includes(cId) && !addedIds.has(cId)) {
                        cardsToRender.push(card);
                        addedIds.add(cId);
                    }
                });
            }
        });
    } else {
        const currentCat = appData.find(c => c.id === currentCategoryId);
        if (currentCat && currentCat.cards) {
            cardsToRender = currentCat.cards;
        }
    }

    // カードが存在しない場合
    if (cardsToRender.length === 0) {
        if (currentCategoryId !== "leave") {
            const emptyMsg = currentCategoryId === 'favorite' ? 'お気に入り登録されたカードがありません' : 'カードがありません';
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">${emptyMsg}</div>`;
        }
        return;
    }

    // カードを生成
    cardsToRender.forEach(card => {
        const cardEl = document.createElement("div");
        const cardId = String(card.id || card.text).trim();
        const isFav = favorites.includes(cardId);
        
        cardEl.className = `card ${isFav ? 'is-favorite' : ''}`;

        cardEl.innerHTML = `
            <button class="star-btn" type="button">${isFav ? '★' : '☆'}</button>
            <button class="delete-card-btn" onclick="deleteCard(event, '${card.id}')">✕</button>
            <div class="card-icon">${card.icon}</div>
            <div class="card-text">${card.text}</div>
        `;

        // 星ボタンクリック
        const starBtn = cardEl.querySelector(".star-btn");
        if (starBtn) {
            starBtn.onclick = (e) => toggleFavorite(cardId, e);
        }

        // カード本体クリック
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

    // ★ タイムラインに自分の発言（右側吹き出し）を追加
    addChatMessage(text, 'right');

    const placeholder = document.getElementById("speechPlaceholder");
    const speechText = document.getElementById("speechText");
    if (placeholder) placeholder.style.display = "none";
    if (speechText) {
        speechText.style.display = "block";
        speechText.textContent = text;
    }
    playTapChime();
    // ...略...

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
        // 最新の確定結果だけを取得する
        const lastResultIndex = event.results.length - 1;
        const lastResult = event.results[lastResultIndex];
         let  transcript = lastResult[0].transcript.trim();
         transcript = applyDictionaryReplacement(transcript);   

        transcript = applyCustomDictionary(transcript);

        const placeholder = document.getElementById("speechPlaceholder");
        const speechText = document.getElementById("speechText");

        if (placeholder) placeholder.style.display = "none";
        if (speechText) {
            speechText.style.display = "block";
            speechText.textContent = transcript;
        }

        // 確定した結果（isFinal）かつ、直前と同じ文字でなければ追加
        if (lastResult.isFinal && transcript !== "") {
            // タイムラインの最後の吹き出しと同じテキストなら追加しない（重複防止）
            const timeline = document.getElementById("chatTimeline");
            const lastBubble = timeline ? timeline.lastElementChild : null;

            if (!lastBubble || lastBubble.textContent !== transcript) {
                addChatMessage(transcript, 'left');
            }
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
            // 自由入力欄をクリアする
const customInput = document.getElementById("customTextInput");
if (customInput) customInput.value = "";

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
    if (event) {
        event.stopPropagation(); // 星ボタンやカードタップへの連鎖をブロック
        event.preventDefault();
    }
    if (typeof triggerHaptic === 'function') triggerHaptic();

    if (!confirm("このカードを削除しますか？")) return;

    // 全カテゴリーから対象カードを削除
    appData.forEach(cat => {
        if (cat.cards) {
            cat.cards = cat.cards.filter(c => String(c.id) !== String(cardId));
        }
    });

    // お気に入りリストからも該当IDを確実に削除
    let favorites = getFavorites();
    favorites = favorites.filter(id => String(id) !== String(cardId));
    localStorage.setItem("favoriteCards", JSON.stringify(favorites));

    saveData();
    renderCards();
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
    // クイック日付ボタンの選択スタイル（青色）を切り替える処理
    const btns = document.querySelectorAll(".quick-date-btns button");
    btns.forEach((btn, index) => {
        if (index === addDays) {
            btn.classList.add("active-date");
        } else {
            btn.classList.remove("active-date");
        }
    });
}


function formatTimeText(timeVal) {
    if (!timeVal) return "";
    const parts = timeVal.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (isNaN(hours)) return "";

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
// 日付ボタンの処理
function setQuickDate(addDays) {
    if (typeof triggerHaptic === 'function') {
        triggerHaptic();
    }
    const d = new Date();
    d.setDate(d.getDate() + addDays);
    const leaveDateInput = document.getElementById("leaveDateInput");
    if (leaveDateInput) {
        leaveDateInput.value = d.toISOString().split('T')[0];
    }

    const btns = document.querySelectorAll(".quick-date-btns button");
    btns.forEach((btn, index) => {
        if (index === addDays) {
            btn.classList.add("active-date");
        } else {
            btn.classList.remove("active-date");
        }
    });
}

// 表示エリアの文字をクリアする処理
function clearDisplay() {
    const speechText = document.getElementById("speechText");
    const speechPlaceholder = document.getElementById("speechPlaceholder");
    
    // 読み上げ中の音声があれば停止
    if (typeof stopSpeech === 'function') {
        stopSpeech();
    }
    
    // 表示テキストを消去
    if (speechText) {
        speechText.innerText = "";
        speechText.style.display = "none";
    }
    
    // プレースホルダー（案内文）を再表示
    if (speechPlaceholder) {
        speechPlaceholder.style.display = "inline";
    }
}
// 自由入力欄のクリア処理（触感追加）
function clearCustomInput() {
    if (typeof triggerHaptic === 'function') triggerHaptic();
    const input = document.getElementById("customTextInput");
    if (input) {
        input.value = "";
    }
}

// 表示エリアのクリア処理（触感追加）
function clearDisplay() {
    if (typeof triggerHaptic === 'function') triggerHaptic();
    const speechText = document.getElementById("speechText");
    const speechPlaceholder = document.getElementById("speechPlaceholder");
    
    if (typeof stopSpeech === 'function') {
        stopSpeech();
    }
    
    if (speechText) {
        speechText.innerText = "";
        speechText.style.display = "none";
    }
    
    if (speechPlaceholder) {
        speechPlaceholder.style.display = "inline";
    }
}
    const favorites = getFavorites();
    const cards = document.querySelectorAll(".card, .phrase-card, .card-item");

    if (category === 'favorite') {
        cards.forEach(card => {
            const cardId = card.getAttribute("data-id") || card.innerText.replace("★", "").replace("☆", "").trim();
            if (favorites.includes(cardId)) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }
        });
    }

// --- タイムライン制御用関数 ---

// メッセージを吹き出しとして追加
function addChatMessage(text, sender = 'right') {
    const timeline = document.getElementById("chatTimeline");
    if (!timeline || !text) return;

    // 初期の案内メッセージがあればクリア
    if (timeline.children.length === 1 && timeline.children[0].innerText.includes("表示されます")) {
        timeline.innerHTML = "";
    }

    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${sender}`;
    bubble.textContent = text;

    timeline.appendChild(bubble);

    // 常に最新メッセージ（一番下）へ自動スクロール
    timeline.scrollTop = timeline.scrollHeight;
}

// タイムラインの消去（クリアボタン用）
function clearTimeline() {
    const timeline = document.getElementById("chatTimeline");
    if (timeline) {
        timeline.innerHTML = '<div class="chat-bubble left">ここに音声やカードの文字が表示されます</div>';
    }
}

/* ===================================================
   単語置き換え辞書機能
   =================================================== */

// 1. 辞書データの保持と読み込み
let wordDictionary = JSON.parse(localStorage.getItem('wordDictionary')) || {};

// 辞書モーダルを開く
function openDictModal() {
    renderDictList();
    document.getElementById('dictModal').style.display = 'flex';
}

// 辞書モーダルを閉じる
function closeDictModal() {
    document.getElementById('dictModal').style.display = 'none';
    document.getElementById('dictKey').value = '';
    document.getElementById('dictValue').value = '';
}

// 単語を登録する
function saveDictWord() {
    const key = document.getElementById('dictKey').value.trim();
    const value = document.getElementById('dictValue').value.trim();

    if (!key || !value) {
        showToast("変換前と変換後の両方を入力してください");
        return;
    }

    // 辞書データに追加して保存
    wordDictionary[key] = value;
    localStorage.setItem('wordDictionary', JSON.stringify(wordDictionary));

    // 入力欄をクリアして再描画
    document.getElementById('dictKey').value = '';
    document.getElementById('dictValue').value = '';
    renderDictList();
    showToast(`「${key}」→「${value}」を登録しました`);
}

// 登録されている単語を削除する
function deleteDictWord(key) {
    delete wordDictionary[key];
    localStorage.setItem('wordDictionary', JSON.stringify(wordDictionary));
    renderDictList();
    showToast(`「${key}」を削除しました`);
}

// 辞書一覧の表示を更新する
function renderDictList() {
    const listContainer = document.getElementById('dictList');
    if (!listContainer) return;

    const keys = Object.keys(wordDictionary);
    if (keys.length === 0) {
        listContainer.innerHTML = '<div style="color: #64748b; font-size: 0.85rem; text-align: center; padding: 10px;">登録された単語はありません</div>';
        return;
    }

    let html = '';
    keys.forEach(key => {
        html += `
            <div class="dict-item">
                <span><strong>${escapeHTML(key)}</strong> ➔ ${escapeHTML(wordDictionary[key])}</span>
                <button class="dict-delete-btn" onclick="deleteDictWord('${escapeHTML(key)}')">削除</button>
            </div>
        `;
    });
    listContainer.innerHTML = html;
}

// 2. 音声認識で取得したテキストを辞書に基づいて置き換える関数
function applyDictionaryReplacement(text) {
    if (!text) return text;
    let replacedText = text;
    
    // 辞書に登録された全てのキー（変換前）で置換を実行
    Object.keys(wordDictionary).forEach(key => {
        if (key) {
            // エスケープ処理を行って安全に正規表現化し、一括置換
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedKey, 'g');
            replacedText = replacedText.replace(regex, wordDictionary[key]);
        }
    });
    
    return replacedText;
}

// HTMLエスケープ関数（安全対策）
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

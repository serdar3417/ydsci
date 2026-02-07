
const Chat = {
    characters: [
        { id: 'char1', name: 'Canan', gender: 'female', avatar: '👩‍🏫', color: '#fff0f5', voice: null },
        { id: 'char2', name: 'Mert', gender: 'male', avatar: '👨‍💻', color: '#e3f2fd', voice: null },
        { id: 'char3', name: 'Elif', gender: 'female', avatar: '👩‍🎨', color: '#f3e5f5', voice: null },
        { id: 'char4', name: 'Burak', gender: 'male', avatar: '👨‍💼', color: '#fff3e0', voice: null },
        { id: 'char5', name: 'Selin', gender: 'female', avatar: '👩‍🔬', color: '#e8f5e9', voice: null },
        { id: 'char6', name: 'Emre', gender: 'male', avatar: '👨‍🚀', color: '#fbe9e7', voice: null }
    ],

    activeChat: null,
    isPaused: true,
    settings: {
        speed: 1.0,
        enabled: true
    },

    speechSynth: window.speechSynthesis,

    init() {
        document.addEventListener('word-added', (e) => {
            if (this.activeChat) {
                const newWord = Store.state.words.find(w => w.word === e.detail.word);
                if (newWord) {
                    this.activeChat.topic = newWord;
                    this.activeChat.topicTurns = 0;
                    this.addSystemMessage(`Yeni eklenen "${newWord.word}" hakkında konuşmaya başladılar! 🆕`);
                    if (this.isPaused) this.startChat();
                    else this.scheduleNextMessage();
                }
            }
        });

        if (this.speechSynth.onvoiceschanged !== undefined) {
            this.speechSynth.onvoiceschanged = () => this.assignVoices();
        }
        this.assignVoices();
    },

    assignVoices() {
        const voices = this.speechSynth.getVoices();
        // Not used directly, calculated in speak() via pitch
    },

    startChatMode() {
        UI.switchView('chat');
        if (!this.activeChat || this.activeChat.users.length === 0) {
            this.activeChat = {
                users: this.getRandomCharacters(2),
                topic: null,
                history: [],
                timer: null,
                topicTurns: 0
            };
        }
        this.renderChatInterface(document.getElementById('view-chat'));
        this.startChat();
    },

    renderChatInterface(container) {
        if (!container) return;
        const isRunning = !this.isPaused;

        container.innerHTML = `
            <!-- Header -->
            <div class="d-flex flex-column mb-3 sticky-top bg-light shadow-sm" style="z-index: 10;">
                <div class="d-flex justify-content-between align-items-center p-2">
                    <button class="btn btn-sm btn-icon" onclick="Chat.exitChat()"><i class="bi bi-arrow-left"></i></button>
                    <div class="text-center">
                        <h5 class="m-0 fw-bold text-danger">Dedikodu Kazanı ☕</h5>
                    </div>
                    <div class="d-flex gap-2">
                         <button class="btn btn-sm btn-icon" onclick="Chat.showCharacterModal()"><i class="bi bi-people-fill"></i></button>
                         <button class="btn btn-sm btn-icon" onclick="Chat.toggleAudio()"><i class="bi bi-volume-up-fill" id="audio-icon"></i></button>
                    </div>
                </div>
                <!-- Speed Slider -->
                <div class="px-3 pb-2 bg-light border-bottom">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-speedometer2 text-muted small"></i>
                        <input type="range" class="form-range" min="0.5" max="2" step="0.1" value="${this.settings.speed}" 
                            id="speed-slider" oninput="Chat.updateSpeed(this.value)">
                        <span class="small text-muted" id="speed-val">${this.settings.speed}x</span>
                    </div>
                </div>
            </div>

            <!-- Chat Area -->
            <div id="chat-history" class="d-flex flex-column gap-3 pb-5 mb-5 overflow-auto" style="height: calc(100vh - 280px); overscroll-behavior: contain;">
                <div class="text-center text-muted my-4">
                    <p>YDS Uzmanları hazırlanıyor... 🎤</p>
                </div>
            </div>

            <!-- Controls -->
            <div class="fixed-bottom bg-white border-top p-2 safe-area-bottom shadow-lg" style="z-index: 1060;">
                <div class="row g-2 align-items-center">
                     <div class="col-4">
                         <button class="btn btn-warning w-100 rounded-4 py-2 fw-bold text-dark shadow-sm" onclick="Chat.showInterventionModal()">
                            <i class="bi bi-search d-block fs-5"></i>
                            <span style="font-size:0.75rem;">ARA KELİME GİR</span>
                         </button>
                     </div>
                     <div class="col-4">
                        <button id="btn-toggle" class="btn ${isRunning ? 'btn-danger' : 'btn-success'} w-100 rounded-circle p-0 shadow border-2 border-white" 
                            style="width: 60px; height: 60px; margin: 0 auto; display: flex; align-items: center; justify-content: center;"
                            onclick="Chat.togglePause()">
                             ${isRunning ? '<i class="bi bi-pause-fill display-6"></i>' : '<i class="bi bi-play-fill display-6 ms-1"></i>'}
                        </button>
                     </div>
                     <div class="col-4">
                        <button class="btn btn-primary w-100 rounded-4 py-2 fw-bold shadow-sm" onclick="UI.showAddModal()">
                            <i class="bi bi-plus-lg d-block fs-5"></i>
                            <span style="font-size:0.75rem;">YENİ EKLE</span>
                        </button>
                     </div>
                </div>
            </div>
            
            ${this.getModalsHTML()}
        `;

        this.scrollToBottom();
    },

    getModalsHTML() {
        return `
            <div class="modal fade" id="charModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content rounded-4 border-0">
                         <div class="modal-header border-0 pb-0">
                            <h5 class="fw-bold">Kişiler</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="char-list-body"></div>
                        <div class="modal-footer border-0">
                             <button class="btn btn-primary w-100 rounded-pill" onclick="Chat.addNewCharacter()">+ Yeni Kişi</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal fade bottom" id="wordSelectModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-scrollable modal-bottom">
                     <div class="modal-content rounded-top-4 border-0" style="max-height: 70vh;">
                         <div class="modal-header border-0">
                             <h5 class="fw-bold">Ara Kelime Seç</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                         </div>
                         <div class="modal-body pt-0" id="word-select-body"></div>
                     </div>
                </div>
            </div>
        `;
    },

    startChat() {
        this.isPaused = false;
        this.updateBtnState();
        if (!this.activeChat.topic) this.changeTopic();
        else this.scheduleNextMessage();
    },

    stopChat() {
        this.isPaused = true;
        this.updateBtnState();
        if (this.activeChat.timer) clearTimeout(this.activeChat.timer);
        this.speechSynth.cancel();
    },

    togglePause() {
        if (this.isPaused) this.startChat();
        else this.stopChat();
    },

    updateBtnState() {
        const btn = document.getElementById('btn-toggle');
        if (btn) {
            btn.className = `btn ${this.isPaused ? 'btn-success' : 'btn-danger'} w-100 rounded-circle p-0 shadow border-2 border-white`;
            btn.innerHTML = this.isPaused
                ? '<i class="bi bi-play-fill display-6 ms-1"></i>'
                : '<i class="bi bi-pause-fill display-6"></i>';
        }
    },

    updateSpeed(val) {
        this.settings.speed = parseFloat(val);
        document.getElementById('speed-val').textContent = val + 'x';
    },

    getRandomCharacters(count) {
        return [...this.characters].sort(() => 0.5 - Math.random()).slice(0, count);
    },

    changeTopic() {
        const newWord = this.selectRandomWord();
        this.activeChat.topic = newWord;
        this.activeChat.topicTurns = 0;
        this.addSystemMessage(`Konu: "${newWord.word}" 🎯`);
        this.scheduleNextMessage();
    },

    selectRandomWord() {
        const words = Store.state.words;
        if (words.length === 0) return { word: 'YDS', meaning: 'Yabancı Dil Sınavı' };

        const favorites = words.filter(w => w.isFavorite);
        // User requested priority: "önce onlar yapılsın" -> Very High probability or queue?
        // Let's use 85% chance if favorites exist.
        if (favorites.length > 0 && Math.random() < 0.85) {
            return favorites[Math.floor(Math.random() * favorites.length)];
        }
        return words[Math.floor(Math.random() * words.length)];
    },

    scheduleNextMessage() {
        if (this.isPaused) return;
        if (this.activeChat.timer) clearTimeout(this.activeChat.timer);

        const baseDelay = 4000;
        const delay = (baseDelay / this.settings.speed) + (Math.random() * 2000);

        let sender = this.activeChat.users[Math.floor(Math.random() * this.activeChat.users.length)];
        if (this.activeChat.lastSpeaker && this.activeChat.lastSpeaker.id === sender.id && this.activeChat.users.length > 1) {
            sender = this.activeChat.users.find(u => u.id !== sender.id);
        }

        this.activeChat.timer = setTimeout(() => {
            this.generateAndSendMessage(sender);
        }, delay);
    },

    generateAndSendMessage(sender) {
        if (this.isPaused) return;

        let messageText = "";
        const word = this.activeChat.topic;
        this.activeChat.topicTurns++;
        this.activeChat.lastSpeaker = sender;

        if (this.activeChat.topicTurns > 4 && Math.random() > 0.6) {
            const newWord = this.selectRandomWord();
            messageText = `Bu konuyu geçelim. "${newWord.word}" kelimesine ne dersin? 🤔`;
            this.activeChat.topic = newWord;
            this.activeChat.topicTurns = 0;
            this.addMessage(sender, messageText);
            this.addSystemMessage(`Konu Değişti: "${newWord.word}"`);
            this.scheduleNextMessage();
            return;
        }

        // Logic selection based on random category
        const roll = Math.random();

        if (this.activeChat.topicTurns === 1 || roll < 0.15) {
            // Basic Definition
            const definitions = [
                `"${word.word}"... Anlamı: ${word.meaning}. Çok önemli! 📝`,
                `Sınavda "${word.word}" çıkarsa affetmem, anlamı ${word.meaning}. 💪`,
                `"${word.word}" = ${word.meaning}. Not edin arkadaşlar. 📚`
            ];
            messageText = definitions[Math.floor(Math.random() * definitions.length)];

        } else if (roll < 0.3) {
            // Poetry / Literature
            const lit = [
                `Bir şiir yazsam içinde kesin "${word.word}" geçerdi... 🌹`,
                `Ünlü bir yazar "${word.word}" kelimesini betimlemek için sayfalarca yazmış.`,
                `Romanlarda "${word.word}" kelimesine rastlayınca altını çiziyorum. 📖`,
                `Şair burada "${word.word}" diyerek aslında hüznü anlatmış...`
            ];
            messageText = lit[Math.floor(Math.random() * lit.length)];

        } else if (roll < 0.45) {
            // Cinema / Art
            const art = [
                `Geçen izlediğim filmde karakter "${word.word}" kelimesini kullandı, şok oldum! 🎬`,
                `Bu kelime tam bir dönem filmi repliği: "${word.word}"...`,
                `Sanat eleştirmenleri "${word.word}" kavramını çok tartışıyor. 🎨`,
                `Bir senaryo yazsam adını "${word.word}" koyardım.`
            ];
            messageText = art[Math.floor(Math.random() * art.length)];

        } else if (roll < 0.6) {
            // Science / Tech
            const sci = [
                `Bilim dünyasında "${word.word}" kavramı yeni bir boyut kazandı. 🧬`,
                `Teknolojik gelişmeler "${word.word}" algımızı değiştiriyor.`,
                `Makalelerde "${word.word}" terimi sıkça geçmeye başladı. 🔬`,
                `Matematiksel olarak "${word.word}"... Şaka şaka, sözelciyiz biz! 😂`
            ];
            messageText = sci[Math.floor(Math.random() * sci.length)];

        } else if (roll < 0.75) {
            // Politics / Sports
            const daily = [
                `Spiker maçta "${word.word}" diye bağırdı sandım! ⚽`,
                `Siyasetçilerin dili çok ağır, sürekli "${word.word}" gibi kelimeler... 👔`,
                `Gündemde yine "${word.word}" tartışmaları var. 📰`,
                `Bu "${word.word}" meselesi meclise taşınmalı!`
            ];
            messageText = daily[Math.floor(Math.random() * daily.length)];

        } else {
            // General comments / semantics
            const comments = [
                `"${word.word}" kelimesinin eş anlamlısı neydi?`,
                `Bunun zıt anlamlısı sınavda çok çıkıyor.`,
                `Resmine bakınca akılda daha iyi kalıyor.`,
                `Bu kelime favorim. ⭐`
            ];
            messageText = comments[Math.floor(Math.random() * comments.length)];

            if (Math.random() > 0.6) {
                const img = word.image || null;
                setTimeout(() => img ? this.addImage(sender, img) : this.addPlaceholderImage(sender, word), 1500);
            }
        }

        const regex = new RegExp(`(${word.word})`, 'gi');
        const formattedText = messageText.replace(regex, '<span class="fw-bolder fs-5 text-decoration-underline text-danger">$1</span>');

        this.addMessage(sender, formattedText, messageText);

        this.scheduleNextMessage();
    },

    addMessage(sender, htmlText, rawText) {
        const historyEl = document.getElementById('chat-history');
        if (!historyEl) return;

        const alignClass = sender.id === this.activeChat.users[0].id ? 'align-self-start' : 'align-self-end';
        const bubbleStyle = `background-color: ${sender.color}; color: black; min-width: 120px; border: 1px solid rgba(0,0,0,0.1);`;

        const msgHTML = `
            <div class="d-flex ${alignClass} mb-3" style="max-width: 85%;">
                <div class="me-2 ${sender.id === this.activeChat.users[0].id ? '' : 'order-2 ms-2'}">
                   <div class="rounded-circle d-flex align-items-center justify-content-center border shadow-sm" style="width: 45px; height: 45px; background: white; overflow: hidden;">
                        ${sender.photo ? `<img src="${sender.photo}" style="width:100%; height:100%; object-fit:cover;">` : `<span style="font-size: 1.5rem;">${sender.avatar}</span>`}
                   </div>
                </div>
                <div class="d-flex flex-column ${sender.id === this.activeChat.users[0].id ? 'align-items-start' : 'align-items-end'}">
                    <small class="text-muted mb-1 fw-bold" style="font-size: 0.75rem;">${sender.name}</small>
                    <div class="p-3 rounded-4 shadow-sm position-relative text-break" style="${bubbleStyle}">
                        ${htmlText}
                        ${this.settings.enabled ?
                `<i class="bi bi-volume-up-fill position-absolute top-100 ${sender.id === this.activeChat.users[0].id ? 'start-100 translate-middle-x' : 'start-0 translate-middle-x'} mt-1 badge rounded-pill bg-dark bg-opacity-75" style="cursor:pointer; z-index:1;" onclick="Chat.speak(\'' + (rawText || htmlText).replace(/'/g, "\\'") + '\', \'${sender.gender}\')"></i>` : ''}
                    </div>
                </div>
            </div>
        `;

        const temp = document.createElement('div');
        temp.innerHTML = msgHTML;
        historyEl.appendChild(temp.firstElementChild);
        this.scrollToBottom();

        if (this.settings.enabled) {
            this.speak(rawText || htmlText, sender.gender);
        }
    },

    addImage(sender, src) {
        const historyEl = document.getElementById('chat-history');
        if (!historyEl) return;
        const alignClass = sender.id === this.activeChat.users[0].id ? 'align-self-start' : 'align-self-end';
        const msgHTML = `
            <div class="d-flex ${alignClass} mb-2" style="max-width: 85%;">
                 <div class="me-2 ${sender.id === this.activeChat.users[0].id ? '' : 'order-2 ms-2'}"></div>
                 <div class="card border-0 shadow-sm p-1 rounded-4">
                    <img src="${src}" class="rounded-4 img-fluid" style="max-height: 200px; min-width: 150px; object-fit: cover;">
                 </div>
            </div>
         `;
        const temp = document.createElement('div');
        temp.innerHTML = msgHTML;
        historyEl.appendChild(temp.firstElementChild);
        this.scrollToBottom();
    },

    addPlaceholderImage(sender, word) {
        // Fallback or skip
    },

    addSystemMessage(text) {
        const historyEl = document.getElementById('chat-history');
        if (historyEl) {
            const html = `<div class="text-center small text-muted my-2"><span class="bg-light px-2 py-1 rounded-pill border shadow-sm fw-bold">${text}</span></div>`;
            const temp = document.createElement('div');
            temp.innerHTML = html;
            historyEl.appendChild(temp.firstElementChild);
            this.scrollToBottom();
        }
    },

    scrollToBottom() {
        const historyEl = document.getElementById('chat-history');
        if (historyEl) historyEl.scrollTop = historyEl.scrollHeight;
    },

    speak(text, gender) {
        if (!this.settings.enabled) return;
        this.speechSynth.cancel();

        const cleanText = text
            .replace(/<[^>]*>/g, '')
            .replace(/https?:\/\/\S+/g, '')
            .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
            .replace(/[^\w\s\u00C0-\u017F,.?!]/g, '')
            .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'tr-TR';
        utterance.pitch = gender === 'female' ? 1.2 : 0.9;
        utterance.rate = this.settings.speed;

        this.speechSynth.speak(utterance);
    },

    toggleAudio() {
        this.settings.enabled = !this.settings.enabled;
        document.getElementById('audio-icon').className = this.settings.enabled ? 'bi bi-volume-up-fill' : 'bi bi-volume-mute-fill';
    },

    exitChat() {
        this.stopChat();
        UI.switchView('home');
    },

    showCharacterModal() {
        const listBody = document.getElementById('char-list-body');
        if (!listBody) return;

        listBody.innerHTML = `
            <ul class="list-group list-group-flush">
                ${this.characters.map((char, index) => `
                    <li class="list-group-item d-flex align-items-center justify-content-between p-2">
                        <div class="d-flex align-items-center gap-3 flex-grow-1">
                            <label class="position-relative cursor-pointer">
                                <div class="rounded-circle d-flex align-items-center justify-content-center border" style="width: 50px; height: 50px; background: ${char.color}; overflow: hidden;">
                                    ${char.photo ? `<img src="${char.photo}" style="width:100%; height:100%; object-fit:cover;">` : `<span class="fs-4">${char.avatar}</span>`}
                                </div>
                                <input type="file" class="d-none" onchange="Chat.updateCharPhoto('${char.id}', this)" accept="image/*">
                                <div class="position-absolute bottom-0 end-0 bg-dark text-white rounded-circle p-1" style="transform: scale(0.6);">
                                    <i class="bi bi-camera-fill"></i>
                                </div>
                            </label>
                            <div class="flex-grow-1">
                                <input type="text" class="form-control form-control-sm fw-bold border-0 p-0 mb-1" value="${char.name}" onchange="Chat.updateCharName('${char.id}', this.value)">
                                <div class="d-flex align-items-center gap-2">
                                     <select class="form-select form-select-sm py-0 px-1" style="width:auto;" onchange="Chat.updateCharGender('${char.id}', this.value)">
                                        <option value="female" ${char.gender === 'female' ? 'selected' : ''}>Kadın</option>
                                        <option value="male" ${char.gender === 'male' ? 'selected' : ''}>Erkek</option>
                                     </select>
                                    <input type="color" class="form-control form-control-color form-control-sm" value="${char.color}" onchange="Chat.updateCharColor('${char.id}', this.value)">
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="Chat.removeCharacter('${char.id}')"><i class="bi bi-trash"></i></button>
                    </li>
                `).join('')}
            </ul>
        `;

        const modal = new bootstrap.Modal(document.getElementById('charModal'));
        modal.show();
    },

    updateCharName(id, val) { this.characters.find(c => c.id === id).name = val; },
    updateCharColor(id, val) { this.characters.find(c => c.id === id).color = val; },
    updateCharGender(id, val) { this.characters.find(c => c.id === id).gender = val; },

    updateCharPhoto(id, input) {
        if (input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const char = this.characters.find(c => c.id === id);
                char.photo = e.target.result;
                char.avatar = '';
                this.showCharacterModal();
            };
            reader.readAsDataURL(input.files[0]);
        }
    },

    addNewCharacter() {
        this.characters.push({ id: 'char_' + Date.now(), name: 'Yeni', gender: 'female', avatar: '👤', color: '#fff', voice: null });
        this.showCharacterModal();
    },

    removeCharacter(id) {
        if (this.characters.length > 2) {
            this.characters = this.characters.filter(c => c.id !== id);
            this.showCharacterModal();
        } else {
            alert("En az 2 kişi lazım!");
        }
    },

    showInterventionModal() {
        this.isPaused = true;
        this.updateBtnState();
        const listBody = document.getElementById('word-select-body');
        const words = Store.state.words;
        const sorted = [...words].sort((a, b) => (b.isFavorite === true) - (a.isFavorite === true));

        listBody.innerHTML = `
            <div class="list-group list-group-flush">
                 ${sorted.map(w => `
                    <button class="list-group-item list-group-item-action d-flex justify-content-between p-3" onclick="Chat.selectTopic('${w.id}')">
                         <div class="${w.isFavorite ? 'fw-bold text-primary' : ''}">
                            ${w.word}
                            <small class="d-block fw-normal text-muted">${w.meaning}</small>
                         </div>
                         ${w.isFavorite ? '<i class="bi bi-star-fill text-warning"></i>' : ''}
                    </button>
                 `).join('')}
            </div>
        `;
        const modal = new bootstrap.Modal(document.getElementById('wordSelectModal'));
        modal.show();
    },

    // --- SCENARIO MODE ---
    startScenarioMode() {
        UI.switchView('chat');
        this.renderChatInterface(document.getElementById('view-chat'));
        this.activeChat = {
            users: [this.characters[0]], // One teacher
            topic: null,
            history: [],
            isScenario: true,
            step: 0
        };
        this.addSystemMessage("Senaryo Modu: Mülakat 🎭");

        setTimeout(() => {
            const firstMsg = "Merhaba! YDS sınavına hazırlık nasıl gidiyor? En çok zorlandığın kelime türü nedir?";
            this.addMessage(this.characters[0], firstMsg);
            this.showUserOptions([
                { text: "Akademik fiillerde zorlanıyorum.", score: 10 },
                { text: "Bağlaçlar kafamı karıştırıyor.", score: 10 },
                { text: "Kelime haznem genel olarak zayıf.", score: 5 }
            ]);
        }, 1000);
    },

    showUserOptions(options) {
        const historyEl = document.getElementById('chat-history');
        const optDiv = document.createElement('div');
        optDiv.className = "d-grid gap-2 my-3 px-4";
        optDiv.innerHTML = options.map(opt => `
            <button class="btn btn-outline-primary rounded-pill text-start" onclick="Chat.handleUserReply('${opt.text}', ${opt.score})">
                <i class="bi bi-chat-left-dots me-2"></i> ${opt.text}
            </button>
        `).join('');
        historyEl.appendChild(optDiv);
        this.scrollToBottom();
    },

    handleUserReply(text, score) {
        // Remove options
        const historyEl = document.getElementById('chat-history');
        const btnGroup = historyEl.lastElementChild;
        if (btnGroup) btnGroup.remove();

        // Add user message
        const userHtml = `
            <div class="d-flex align-self-end mb-3 justify-content-end" style="max-width: 85%;">
                <div class="p-3 rounded-4 bg-primary text-white shadow-sm">
                    ${text}
                </div>
            </div>
        `;
        const temp = document.createElement('div');
        temp.innerHTML = userHtml;
        historyEl.appendChild(temp.firstElementChild);

        Store.updateUserPoints(score || 5);

        // Reply logic (Mock)
        setTimeout(() => {
            const replies = [
                "Anlıyorum. O zaman 'Advocate' gibi kelimelere odaklanalım.",
                "Bağlaçlar kilit noktadır. 'However' ve 'Therefore' arasındaki farkı bilmek gerekir.",
                "Bol bol okuma yaparak bunu aşabilirsin."
            ];
            const reply = replies[Math.floor(Math.random() * replies.length)];
            this.addMessage(this.characters[0], reply);

            // Continue loop or end
            setTimeout(() => {
                this.addSystemMessage("Senaryo Tamamlandı! +10 Puan");
                Store.updateUserPoints(10);
            }, 2000);

        }, 1000);
    },

    selectTopic(id) {
        const word = Store.state.words.find(w => w.id === id);
        if (word) {
            this.activeChat.topic = word;
            this.activeChat.topicTurns = 0;
            const el = document.getElementById('wordSelectModal');
            bootstrap.Modal.getInstance(el).hide();
            this.addSystemMessage(`Konu Seçildi: ${word.word}`);
            this.startChat();
        }
    }
};

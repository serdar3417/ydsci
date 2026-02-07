/**
 * YDS Vocabulary App
 * Consolidated Main Script for file:// compatibility
 */

// --- STORE MODULE ---
// --- READING DATA ---

// --- READING DATA ---
// READING_CONTENT is now loaded from reading_data.js


const Store = {
    state: {
        words: [],
        packs: [], // Installed packs
        user: {
            name: 'Öğrenci',
            avatar: null,
            points: 0,
            rank: 'Çaylak', // Gamification
            achievements: [], // Gamification
            theme: 'night',
            completedTasks: [],
            settings: { mute: false },
            stats: { totalLearned: 0, streak: 0, lastLogin: null },
            dailyGoal: { target: 20, current: 0, lastDate: null }
        },
        league: []
    },

    // --- PACKS LOGIC ---
    getPacks() {
        return typeof PacksData !== 'undefined' ? PacksData : [];
    },

    importPack(packId) {
        const pack = this.getPacks().find(p => p.id === packId);
        if (!pack) return false;

        let added = 0;
        pack.words.forEach(pw => {
            if (!this.state.words.find(w => w.word.toLowerCase() === pw.word.toLowerCase())) {
                this.addWord({ ...pw, srs: { interval: 0, nextReview: Date.now(), difficulty: 'new' } });
                added++;
            }
        });

        if (!this.state.packs.includes(packId)) {
            this.state.packs.push(packId);
        }
        this.save();
        return added;
    },

    // --- SRS LOGIC ---
    updateSRS(wordId, quality) { // quality: 0 (hard) - 5 (easy)
        const word = this.state.words.find(w => w.id === wordId);
        if (!word) return;

        if (!word.srs) word.srs = { interval: 0, nextReview: Date.now(), difficulty: 'new' };

        // Simple SM-2 ish algo
        if (quality >= 3) {
            if (word.srs.interval === 0) word.srs.interval = 1;
            else if (word.srs.interval === 1) word.srs.interval = 3;
            else word.srs.interval = Math.round(word.srs.interval * 2.5);

            // Mark as learned if interval > 21 days
            if (word.srs.interval > 21 && !word.learned) {
                word.learned = true;
                this.state.user.stats.totalLearned++;
            }
        } else {
            word.srs.interval = 0; // Reset if forgotten
        }

        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + word.srs.interval);
        word.srs.nextReview = nextDate.getTime();

        this.save();
    },

    // --- GAMIFICATION LOGIC ---
    checkAchievements() {
        const user = this.state.user;
        const newBadges = [];

        const rules = [
            { id: 'first_blood', title: 'İlk Adım', desc: 'İlk kelimeni ekledin', check: () => this.state.words.length > 0 },
            { id: 'scholar', title: 'Kelime Avcısı', desc: '100 Kelimeye ulaştın', check: () => this.state.words.length >= 100 },
            { id: 'social', title: 'Dedikoducu', desc: 'Sohbet modunu kullandın', check: () => true } // Triggered manually
        ];

        rules.forEach(rule => {
            if (!user.achievements.find(a => a.id === rule.id) && rule.check()) {
                user.achievements.push({ id: rule.id, title: rule.title, date: Date.now() });
                newBadges.push(rule);
            }
        });

        // Update Rank
        const oldRank = user.rank;
        if (user.points > 5000) user.rank = 'Profesör';
        else if (user.points > 2500) user.rank = 'Doçent';
        else if (user.points > 1000) user.rank = 'Asistan';
        else if (user.points > 500) user.rank = 'Öğrenci';

        if (user.rank !== oldRank) {
            // Rank up event could be dispatched here
            // document.dispatchEvent(new CustomEvent('rank-up', { detail: user.rank }));
        }

        this.save();
        return newBadges;
    },

    init() {
        const savedData = localStorage.getItem('yds_data');
        if (savedData) {
            this.state = JSON.parse(savedData);
            // Migration
            if (!this.state.user.rank) this.state.user.rank = 'Çaylak';
            if (!this.state.user.achievements) this.state.user.achievements = [];
            if (!this.state.packs) this.state.packs = [];
            // Ensure words have SRS structure
            this.state.words.forEach(w => {
                if (!w.srs) w.srs = { interval: 0, nextReview: Date.now(), difficulty: 'new' };
            });
        } else {
            this.seedData();
        }


        if (this.state.league.length === 0) {
            this.seedLeague();
        }

        // AUTO-SYNC: Check if we have new words in YDS_DATA that are not in State
        this.syncWithStaticData();

        this.applyTheme();
    },

    syncWithStaticData() {
        if (typeof YDS_DATA === 'undefined' || !Array.isArray(YDS_DATA)) return;

        let addedCount = 0;
        // Create a Set of existing words for O(1) lookup
        const existingWords = new Set(this.state.words.map(w => w.word.toLowerCase()));

        YDS_DATA.forEach(staticWord => {
            if (!existingWords.has(staticWord.word.toLowerCase())) {
                this.state.words.push({
                    id: this.generateId(),
                    word: staticWord.word,
                    meaning: staticWord.meaning,
                    example: staticWord.example || '',
                    tags: staticWord.tag || ['YDS'],
                    stats: { correct: 0, incorrect: 0 } // Initialize stats
                });
                existingWords.add(staticWord.word.toLowerCase());
                addedCount++;
            }
        });

        if (addedCount > 0) {
            console.log(`Auto-Sync: Added ${addedCount} new words from YDS_DATA.`);
            this.save();
        }
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    seedLeague() {
        const names = ['Ali', 'Ayşe', 'Mehmet', 'Zeynep', 'Can', 'Elif'];
        this.state.league = names.map(name => ({
            id: this.generateId(),
            name: name,
            points: Math.floor(Math.random() * 500) + 100, // Random initial points
            isBot: true
        }));
        this.save();
    },

    updateLeague() {
        // Randomly update bot points to simulate activity
        this.state.league.forEach(bot => {
            if (Math.random() > 0.5) {
                bot.points += Math.floor(Math.random() * 15);
            }
        });
        this.save();
    },

    updateProfile(name, avatar) {
        if (name) this.state.user.name = name;
        if (avatar) this.state.user.avatar = avatar;
        this.save();
    },

    setTheme(themeName) {
        this.state.user.theme = themeName;
        this.save();
        this.applyTheme();
    },


    seedData() {
        this.state.words = [
            {
                id: this.generateId(),
                word: 'Ambiguous',
                meaning: 'Muğlak, belirsiz',
                example: 'The instructions were ambiguous.',
                tags: ['Adjective', 'Academic'],
                stats: { correct: 0, incorrect: 0 }
            },
            {
                id: this.generateId(),
                word: 'Deter',
                meaning: 'Caydırmak',
                example: 'High prices deterred many customers.',
                tags: ['Verb', 'Common'],
                stats: { correct: 0, incorrect: 0 }
            }
        ];
        this.save();
    },

    save() {
        localStorage.setItem('yds_data', JSON.stringify(this.state));
        this.notifyListeners();
    },

    addWord(wordObj) {
        this.state.words.push({
            id: this.generateId(),
            stats: { correct: 0, incorrect: 0 },
            ...wordObj
        });
        this.save();
    },

    updateWord(id, newData) {
        const index = this.state.words.findIndex(w => w.id === id);
        if (index !== -1) {
            this.state.words[index] = { ...this.state.words[index], ...newData };
            this.save();
        }
    },

    deleteWord(id) {
        this.state.words = this.state.words.filter(w => w.id !== id);
        this.save();
    },

    toggleFavorite(id) {
        const word = this.state.words.find(w => w.id === id);
        if (word) {
            word.isFavorite = !word.isFavorite;
            this.save();
        }
    },

    updateUserPoints(amount) {
        this.state.user.points += amount;
        this.save();
        return this.state.user.points;
    },

    updateWordStats(id, isCorrect) {
        const word = this.state.words.find(w => w.id === id);
        if (word) {
            // Stats Update
            if (isCorrect) {
                word.stats.correct++;
                this.updateUserPoints(10);
            } else {
                word.stats.incorrect++;
            }

            // SRS Update (Simplified Sm2)
            // Quality: 5 (perfect), 3 (correct but slow), 0 (wrong)
            const quality = isCorrect ? 5 : 0;
            this.updateSRS(word, quality);

            // Update User Stats
            this.state.user.stats.totalLearned = this.state.words.filter(w => w.srs && w.srs.interval > 21).length;

            // Check Daily Goal
            const today = new Date().toISOString().slice(0, 10);
            if (this.state.user.dailyGoal.lastDate === today) {
                this.state.user.dailyGoal.current++;
            }

            this.save();
        }
    },

    updateSRS(word, quality) {
        if (!word.srs) {
            word.srs = { repetitions: 0, interval: 0, easeFactor: 2.5, nextReview: Date.now() };
        }

        if (quality >= 3) {
            if (word.srs.repetitions === 0) {
                word.srs.interval = 1;
            } else if (word.srs.repetitions === 1) {
                word.srs.interval = 6;
            } else {
                word.srs.interval = Math.round(word.srs.interval * word.srs.easeFactor);
            }
            word.srs.repetitions++;
            word.srs.easeFactor = word.srs.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        } else {
            word.srs.repetitions = 0;
            word.srs.interval = 1;
        }

        if (word.srs.easeFactor < 1.3) word.srs.easeFactor = 1.3;

        // Calculate next review date (Days to ms)
        const ONE_DAY = 24 * 60 * 60 * 1000;
        word.srs.nextReview = Date.now() + (word.srs.interval * ONE_DAY);
    },

    getWordsDueForReview() {
        const now = Date.now();
        return this.state.words.filter(w => {
            if (!w.srs) return true; // New words are due
            return w.srs.nextReview <= now;
        });
    },

    loadYDSPack() {
        if (typeof YDS_DATA === 'undefined') {
            alert("YDS Veri Paketi (js/yds_data.js) yüklenemedi! Sayfayı yenileyin.");
            return { success: false, error: "Data not found" };
        }

        const totalPack = YDS_DATA.length;
        const currentCount = this.state.words.length;

        // Debug info for user
        console.log(`YDS Pack Loading: Found ${totalPack} words in pack.`);

        const result = this.importData(JSON.stringify(YDS_DATA));

        if (result.success) {
            const added = this.state.words.length - currentCount;
            let msg = `Paket Tarandı: ${totalPack} kelime.\n`;
            msg += `Mevcut: ${currentCount}\n`;
            msg += `Yeni Eklenen: ${added}\n`;
            msg += `Toplam: ${this.state.words.length}`;
            alert(msg);

            return { success: true, count: added };
        }
        return { success: false, error: result.error };
    },

    toggleTheme(themeName) {
        if (themeName) {
            this.state.user.theme = themeName;
        } else {
            // Fallback toggle
            this.state.user.theme = this.state.user.theme === 'light' ? 'night' : 'light';
        }
        this.save();
        this.applyTheme();
    },

    toggleMute() {
        this.state.user.settings.mute = !this.state.user.settings.mute;
        this.save();
        return this.state.user.settings.mute;
    },

    // --- Data Management ---
    exportData() {
        const dataStr = JSON.stringify(this.state.words, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yds_vocabulary_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    importData(jsonString) {
        try {
            const newWords = JSON.parse(jsonString);
            if (!Array.isArray(newWords)) throw new Error("Geçersiz format: Liste olmalı.");

            let addedCount = 0;
            newWords.forEach(w => {
                // Simple duplicate check by word spelling
                const exists = this.state.words.some(existing => existing.word.toLowerCase() === w.word.toLowerCase());
                if (!exists && w.word && w.meaning) {
                    this.state.words.push({
                        id: this.generateId(),
                        stats: { correct: 0, incorrect: 0 },
                        word: w.word,
                        meaning: w.meaning,
                        example: w.example || '',
                        tags: w.tags || ['Genel']
                    });
                    addedCount++;
                }
            });
            this.save();
            return { success: true, count: addedCount };
        } catch (e) {
            console.error(e);
            return { success: false, error: e.message };
        }
    },

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.user.theme);
    },

    notifyListeners() {
        const event = new CustomEvent('store-updated');
        document.dispatchEvent(event);
    }
};

// --- AUDIO MANAGER ---
const AudioMgr = {
    synth: null,

    init() {
        document.body.addEventListener('click', async () => {
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }
        }, { once: true });

        this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
        this.synth.volume.value = -10;
    },

    play(type) {
        if (Store.state.user.settings.mute) return;
        if (!this.synth) this.init();

        try {
            switch (type) {
                case 'correct':
                    this.synth.triggerAttackRelease(["C5", "E5", "G5"], "8n");
                    break;
                case 'incorrect':
                    this.synth.triggerAttackRelease(["C3", "Bb2"], "4n");
                    break;
                case 'click':
                    this.synth.triggerAttackRelease(["G4"], "32n");
                    break;
                case 'win':
                    this.synth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "4n");
                    break;
                case 'fail':
                    this.synth.triggerAttackRelease(["E3", "C3"], "2n");
                    break;
            }
        } catch (e) { console.log('Audio Error', e); }
    },

    playListening(text) {
        if (Store.state.user.settings.mute) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            window.speechSynthesis.speak(utterance);
        }
    }
};

// --- UI MODULE ---
const UI = {
    init() {
        this.bindEvents();
        this.updateHeader();
    },

    bindEvents() {
        // Global Click Sound
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.classList.contains('clickable')) {
                AudioMgr.play('click');
            }
        });

        // Theme Toggle (Old button hidden, new UI used)
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) themeBtn.addEventListener('click', () => {
            // Cycle through basic themes or open modal
            Store.toggleTheme();
        });

        // Add Word Form Submit
        const addForm = document.getElementById('add-word-form');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddWord(e.target);
            });
        }

        // Listen for store updates
        document.addEventListener('store-updated', () => {
            this.updateHeader();
            if (document.getElementById('view-home')?.offsetParent) this.renderHome();
            if (document.getElementById('view-vocab')?.offsetParent) this.renderVocabList();
            if (document.getElementById('view-profile')?.offsetParent) this.renderProfile(document.getElementById('view-profile'));
            if (document.getElementById('view-league')?.offsetParent) this.renderLeague(document.getElementById('view-league'));
        });
    },

    switchView(viewName) {
        // Hide all views and clear active states
        document.querySelectorAll('.view-section').forEach(el => {
            el.classList.remove('active');
            el.innerHTML = '';
        });

        const mainContainer = document.getElementById('app-container');
        mainContainer.innerHTML = '';

        // Map 'learn' nav to 'vocab' view for now
        const actualView = viewName === 'learn' ? 'vocab' : viewName;

        const viewDiv = document.createElement('div');
        viewDiv.className = 'view-section active';
        viewDiv.id = `view-${actualView}`;
        mainContainer.appendChild(viewDiv);

        switch (actualView) {
            case 'home':
                this.renderHome(viewDiv);
                break;
            case 'vocab':
                this.renderVocabList(viewDiv);
                break;
            case 'flashcards':
                this.renderFlashcards(viewDiv);
                break;
            case 'test':
                this.renderTest(viewDiv);
                break;
            case 'league':
                this.renderLeague(viewDiv);
                break;
            case 'games':
                this.renderGames(viewDiv);
                break;
            case 'chat':
                // Handled by Chat.renderChatInterface
                break;
            case 'stats':
                this.renderStats(viewDiv);
                break;
            case 'profile':
                this.renderProfile(viewDiv);
                break;
            case 'reading':
                this.renderParagraphMode(viewDiv);
                break;
            case 'wordcloud':
                this.renderWordCloud(viewDiv);
                break;
        }
    },

    updateHeader() {
        if (document.getElementById('header-points')) {
            document.getElementById('header-points').textContent = Store.state.user.points;
        }
    },

    // renderVocabList removed (duplicate)

    renderHome(container = document.getElementById('view-home')) {
        if (!container) return;
        const wordCount = Store.state.words.length;
        const todaysWord = Store.state.words.length > 0 ? Store.state.words[0] : null;

        container.innerHTML = `
            <div class="row g-3">

                <div class="col-12">
                     <div class="custom-card p-4 text-center">
                        <h2 class="fw-bold mb-1">Merhaba! 👋</h2>
                        <p class="text-muted mb-4">Bugün hedeflerine ulaşmak için harika bir gün.</p>
                        <div class="d-flex justify-content-center gap-3">
                            <div class="text-center">
                                <h3 class="fw-bold text-primary mb-0">${wordCount}</h3>
                                <small class="text-muted">Kelime</small>
                            </div>
                            <div class="vr"></div>
                            <div class="text-center">
                                <h3 class="fw-bold text-success mb-0">0</h3>
                                <small class="text-muted">Öğrenilen</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="custom-card p-3 h-100 d-flex flex-column align-items-center justify-content-center text-center clickable" onclick="UI.switchView('flashcards')">
                        <div class="bg-primary bg-opacity-10 p-3 rounded-circle mb-2">
                             <i class="bi bi-stack text-primary fs-3"></i>
                        </div>
                        <h6 class="fw-bold m-0">Kartlar</h6>
                    </div>
                </div>
                <div class="col-6">
                    <div class="custom-card p-3 h-100 d-flex flex-column align-items-center justify-content-center text-center clickable" onclick="UI.switchView('test')">
                        <div class="bg-danger bg-opacity-10 p-3 rounded-circle mb-2">
                            <i class="bi bi-ui-checks text-danger fs-3"></i>
                        </div>
                        <h6 class="fw-bold m-0">Test Çöz</h6>
                    </div>
                </div>

                <div class="col-12">
                    <div class="custom-card p-3 border-start border-4 border-warning">
                        <div class="d-flex justify-content-between align-items-start">
                             <div>
                                <small class="text-warning fw-bold text-uppercase">Günün Kelimesi</small>
                                <h4 class="fw-bold mt-1 mb-0">${todaysWord ? todaysWord.word : 'Kelime Ekle'}</h4>
                                <p class="text-muted mb-0">${todaysWord ? todaysWord.meaning : 'Listen boş.'}</p>
                            </div>
                            <button class="btn btn-icon text-muted"><i class="bi bi-volume-up"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // renderVocabList removed (duplicate)

    showAddModal() {
        const modalEl = document.getElementById('addWordModal');
        if (modalEl && window.bootstrap) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    },

    handleAddWord(form) {
        const word = {
            word: form.querySelector('#inputWord').value,
            meaning: form.querySelector('#inputMeaning').value,
            example: form.querySelector('#inputExample').value,
            tags: [form.querySelector('#inputTag').value]
        };
        Store.addWord(word);

        // Dispatch event for other modules (like Chat) to know a word was added
        const event = new CustomEvent('word-added', { detail: word });
        document.dispatchEvent(event);

        const modalEl = document.getElementById('addWordModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
        form.reset();
    },

    deleteWord(id) {
        if (confirm('Bu kelimeyi silmek istediğine emin misin?')) {
            Store.deleteWord(id);
        }
    },

    startModule(type) {
        this.switchView(type);
    },

    // --- Flashcard System ---
    currentFlashcardIndex: 0,
    flashcardSession: [],

    renderFlashcards(container) {
        if (this.currentFlashcardIndex === 0 || !this.flashcardSession.length) {
            this.currentFlashcardIndex = 0;
            this.flashcardSession = [...Store.state.words].sort(() => 0.5 - Math.random());
        }
        const words = this.flashcardSession;
        if (words.length === 0) {
            container.innerHTML = this.getEmptyStateHtml();
            return;
        }
        if (this.currentFlashcardIndex >= words.length) {
            container.innerHTML = this.getCompletionStateHtml('flashcards');
            return;
        }
        const currentWord = words[this.currentFlashcardIndex];
        const progress = ((this.currentFlashcardIndex + 1) / words.length) * 100;
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-sm btn-icon" onclick="UI.switchView('home')"><i class="bi bi-arrow-left"></i> Çıkış</button>
                <div class="progress flex-grow-1 mx-3" style="height: 6px;">
                    <div class="progress-bar bg-primary rounded-pill" role="progressbar" style="width: ${progress}%"></div>
                </div>
                <small class="text-muted fw-bold">${this.currentFlashcardIndex + 1}/${words.length}</small>
            </div>
            <div class="flashcard-container mb-4">
                <div class="flashcard" onclick="this.classList.toggle('flipped')">
                    <div class="flashcard-inner">
                        <div class="flashcard-front">
                            <h2 class="display-4 fw-bold mb-3">${currentWord.word}</h2>
                            <span class="badge bg-light text-dark border">${currentWord.tags?.[0] || 'Genel'}</span>
                            <small class="text-muted mt-4"><i class="bi bi-arrow-repeat"></i> Çevirmek için dokun</small>
                        </div>
                        <div class="flashcard-back">
                            <h3 class="fw-bold mb-3">${currentWord.meaning}</h3>
                            <p class="px-3 fst-italic opacity-75">"${currentWord.example || ''}"</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="flashcard-controls">
                <button class="btn-danger text-white" onclick="UI.handleFlashcardResult('${currentWord.id}', false)"><i class="bi bi-x-lg fs-4"></i></button>
                <button class="btn-success text-white" onclick="UI.handleFlashcardResult('${currentWord.id}', true)"><i class="bi bi-check-lg fs-4"></i></button>
            </div>
        `;
    },

    handleFlashcardResult(id, isCorrect) {
        Store.updateWordStats(id, isCorrect);
        this.currentFlashcardIndex++;
        const container = document.getElementById('view-flashcards');
        if (container) this.renderFlashcards(container);
        else this.renderFlashcards(document.querySelector('.view-section.active'));
    },

    resetFlashcards() {
        this.currentFlashcardIndex = 0;
        this.renderFlashcards(document.querySelector('.view-section.active'));
    },

    // --- Test Module ---
    testSession: [],
    currentTestIndex: 0,
    testScore: 0,

    renderTest(container) {
        if (this.currentTestIndex === 0 || !this.testSession.length) {
            this.currentTestIndex = 0;
            this.testScore = 0;
            this.testSession = [...Store.state.words].sort(() => 0.5 - Math.random()).slice(0, 10);
        }
        const words = this.testSession;
        if (words.length === 0) {
            container.innerHTML = this.getEmptyStateHtml();
            return;
        }
        if (this.currentTestIndex >= words.length) {
            container.innerHTML = this.getCompletionStateHtml('test', this.testScore, words.length);
            return;
        }
        const currentWord = words[this.currentTestIndex];
        const progress = ((this.currentTestIndex + 1) / words.length) * 100;
        const options = this.generateTestOptions(currentWord);
        container.innerHTML = `
             <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-sm btn-icon" onclick="UI.switchView('home')"><i class="bi bi-arrow-left"></i> Çıkış</button>
                <div class="progress flex-grow-1 mx-3" style="height: 6px;">
                    <div class="progress-bar bg-danger rounded-pill" role="progressbar" style="width: ${progress}%"></div>
                </div>
                <small class="text-muted fw-bold">${this.currentTestIndex + 1}/${words.length}</small>
            </div>
            <div class="text-center py-4">
                <span class="badge bg-danger bg-opacity-10 text-danger mb-2">Test Modu</span>
                <h1 class="fw-bold mb-4">${currentWord.word}</h1>
                <p class="text-muted">Aşağıdakilerden hangisi bu kelimenin anlamıdır?</p>
            </div>
            <div class="d-grid gap-3">
                ${options.map(opt => `
                    <button class="btn btn-lg btn-light border shadow-sm text-start p-3" onclick="UI.handleTestAnswer('${currentWord.id}', '${opt}', this)">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        `;
    },

    generateTestOptions(correctWord) {
        const allMeanings = Store.state.words.map(w => w.meaning).filter(m => m !== correctWord.meaning);
        const distractors = allMeanings.sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [...distractors, correctWord.meaning].sort(() => 0.5 - Math.random());
        return options;
    },

    handleTestAnswer(id, selectedAnswer, btnElement) {
        const currentWord = this.testSession[this.currentTestIndex];
        const isCorrect = currentWord.meaning === selectedAnswer;
        if (isCorrect) {
            btnElement.classList.replace('btn-light', 'btn-success');
            btnElement.classList.add('text-white');
            this.testScore++;
            Store.updateWordStats(id, true);
        } else {
            btnElement.classList.replace('btn-light', 'btn-danger');
            btnElement.classList.add('text-white');
            Store.updateWordStats(id, false);
            btnElement.parentElement.querySelectorAll('button').forEach(b => {
                if (b.textContent.trim() === currentWord.meaning) {
                    b.classList.replace('btn-light', 'btn-success');
                    b.classList.add('text-white');
                }
            });
        }
        setTimeout(() => {
            this.currentTestIndex++;
            this.renderTest(document.querySelector('.view-section.active'));
        }, 1500);
    },

    resetTest() {
        this.currentTestIndex = 0;
        this.renderTest(document.querySelector('.view-section.active'));
    },

    getEmptyStateHtml() {
        return `
            <div class="text-center py-5">
                <i class="bi bi-emoji-frown fs-1 text-muted"></i>
                <h4 class="mt-3">Kelime Bulunamadı</h4>
                <p class="text-muted">Lütfen önce kelime ekleyin.</p>
                <button class="btn btn-primary rounded-pill" onclick="UI.switchView('add')">Kelime Ekle</button>
            </div>
        `;
    },

    getCompletionStateHtml(type, score, total) {
        let msg = 'Tüm kartları tamamladın.';
        let title = 'Tebrikler!';
        if (type === 'test') {
            const percentage = (score / total) * 100;
            title = percentage > 70 ? 'Harika İş!' : 'Tekrar Yapmalısın';
            msg = `Test Sonucu: ${score} / ${total}`;
        }
        return `
            <div class="text-center py-5">
                <i class="bi bi-trophy-fill fs-1 text-warning"></i>
                <h2 class="mt-3 fw-bold">${title}</h2>
                <p class="text-muted">${msg}</p>
                <div class="d-flex justify-content-center gap-2 mt-4">
                    <button class="btn btn-outline-primary rounded-pill" onclick="UI.${type === 'test' ? 'resetTest' : 'resetFlashcards'}()">Tekrar Et</button>
                    <button class="btn btn-primary rounded-pill" onclick="UI.switchView('home')">Ana Sayfa</button>
                </div>
            </div>
        `;
    },

    renderStats(container) {
        const user = Store.state.user;
        const words = Store.state.words;

        // Calculate Metrics
        const totalWords = words.length;
        const learned = words.filter(w => w.srs && w.srs.interval > 21).length;
        const learning = words.filter(w => w.srs && w.srs.interval > 0 && w.srs.interval <= 21).length;
        const newWords = totalWords - learned - learning;

        const accuracy = words.reduce((acc, w) => acc + (w.stats.correct / (w.stats.correct + w.stats.incorrect || 1)), 0) / (totalWords || 1) * 100;

        container.innerHTML = `
            <div class="text-center mb-4 slide-in">
                <i class="bi bi-graph-up-arrow display-1 text-primary"></i>
                <h2 class="fw-bold mt-2">Gelişim Raporu</h2>
                <p class="text-muted">Performans detayların burada.</p>
            </div>

            <div class="row g-3 px-2">
                <!-- Main Stats -->
                <div class="col-6">
                    <div class="card border-0 shadow-sm rounded-4 p-3 text-center h-100 bg-success bg-opacity-10 text-success">
                        <h2 class="fw-bold mb-0">${learned}</h2>
                        <small class="fw-bold">Ezberlenen</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card border-0 shadow-sm rounded-4 p-3 text-center h-100 bg-warning bg-opacity-10 text-warning">
                        <h2 class="fw-bold mb-0">${learning}</h2>
                        <small class="fw-bold">Öğreniliyor</small>
                    </div>
                </div>

                <!-- Accuracy Bar -->
                <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-4 p-4">
                        <h6 class="fw-bold mb-3">Genel Doğruluk</h6>
                        <div class="progress" style="height: 25px;">
                            <div class="progress-bar bg-primary" role="progressbar" style="width: ${accuracy.toFixed(1)}%">
                                ${accuracy.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SRS Distribution (Visual only) -->
                <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-4 p-4">
                        <h6 class="fw-bold mb-3">Hafıza Dağılımı</h6>
                        <div class="d-flex align-items-end justify-content-between" style="height: 100px;">
                            <div class="w-100 bg-secondary mx-1 rounded-top" style="height: ${(newWords / totalWords) * 100 || 5}%; opacity: 0.3;" title="Yeni"></div>
                            <div class="w-100 bg-warning mx-1 rounded-top" style="height: ${(learning / totalWords) * 100 || 5}%" title="Çalışılıyor"></div>
                            <div class="w-100 bg-success mx-1 rounded-top" style="height: ${(learned / totalWords) * 100 || 5}%" title="Ezberlendi"></div>
                        </div>
                        <div class="d-flex justify-content-between mt-2 small text-muted">
                            <span>Yeni</span>
                            <span>Çalışılıyor</span>
                            <span>Tamam</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderLeague(container) {
        // Trigger some random updates to make it feel alive
        Store.updateLeague();

        const userEntry = {
            name: Store.state.user.name,
            points: Store.state.user.points,
            isUser: true,
            avatar: Store.state.user.avatar,
            id: 'user'
        };

        const allParticipants = [...Store.state.league, userEntry];
        // Sort by points descending
        allParticipants.sort((a, b) => b.points - a.points);

        let listHtml = `
            <div class="text-center mb-4">
                <i class="bi bi-trophy-fill text-warning display-1"></i>
                <h2 class="fw-bold mt-2">Başarı Ligi</h2>
                <p class="text-muted">Rakiplerinle yarış, zirveye çık!</p>
                <button class="btn btn-outline-primary btn-sm rounded-pill" onclick="UI.addLeagueUserPrompt()">
                    <i class="bi bi-person-plus-fill me-1"></i> Yeni Yarışmacı
                </button>
            </div>
            <div class="list-group rounded-4 shadow-sm overflow-hidden mb-5">
        `;

        allParticipants.forEach((p, index) => {
            const rank = index + 1;
            const isUser = p.isUser;
            const rankBadge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            const bgClass = isUser ? 'bg-primary bg-opacity-10 border-primary' : 'bg-white';
            const avatarHtml = p.avatar
                ? `<img src="${p.avatar}" class="rounded-circle border" width="40" height="40" style="object-fit: cover;">`
                : `<div class="rounded-circle bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;"><i class="bi bi-person-fill text-muted"></i></div>`;

            // Delete button for non-user participants
            const deleteBtn = !isUser
                ? `<button class="btn btn-sm btn-light text-danger ms-2" onclick="UI.removeLeagueUser('${p.id}')"><i class="bi bi-trash"></i></button>`
                : '';

            listHtml += `
                <div class="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom ${bgClass}">
                    <div class="d-flex align-items-center gap-3">
                        <span class="fs-4 fw-bold min-w-30 text-center" style="min-width: 30px;">${rankBadge}</span>
                        ${avatarHtml}
                        <div>
                            <h6 class="fw-bold m-0 ${isUser ? 'text-primary' : ''}">${p.name} ${isUser ? '(Sen)' : ''}</h6>
                            <small class="text-muted">${Math.floor(p.points / 10)} Seviye</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center">
                        <span class="badge bg-warning text-dark rounded-pill shadow-sm px-3 py-2">
                            <i class="bi bi-star-fill me-1"></i>${p.points}
                        </span>
                        ${deleteBtn}
                    </div>
                </div>
            `;
        });

        listHtml += '</div>';
        container.innerHTML = listHtml;
    },

    addLeagueUserPrompt() {
        const name = prompt('Yeni yarışmacının adı ne olsun?');
        if (name) {
            const points = Math.floor(Math.random() * 500) + 100;
            const newUser = {
                id: Date.now().toString(),
                name: name,
                points: points,
                avatar: null
            };
            Store.state.league.push(newUser);
            Store.save();
            this.renderLeague(document.querySelector('.view-section.active'));
        }
    },

    removeLeagueUser(id) {
        if (confirm('Bu yarışmacıyı silmek istediğine emin misin?')) {
            Store.state.league = Store.state.league.filter(u => u.id !== id);
            Store.save();
            this.renderLeague(document.querySelector('.view-section.active'));
        }
    },

    renderProfile(container) {
        const user = Store.state.user;
        const avatarSrc = user.avatar || null;

        container.innerHTML = `
            <div class="text-center pt-4 pb-5">
                <div class="position-relative d-inline-block mb-3">
                    <div class="rounded-circle border border-4 border-white shadow overflow-hidden" style="width: 120px; height: 120px; background: #eee;">
                        ${avatarSrc
                ? `<img src="${avatarSrc}" id="profile-avatar-preview" class="w-100 h-100" style="object-fit: cover;">`
                : `<div class="w-100 h-100 d-flex align-items-center justify-content-center"><i class="bi bi-person-fill display-1 text-secondary opacity-25"></i></div>`
            }
                    </div>
                    <label for="avatar-input" class="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 shadow cursor-pointer btn btn-sm">
                        <i class="bi bi-camera-fill"></i>
                    </label>
                    <input type="file" id="avatar-input" class="d-none" accept="image/*" onchange="UI.handleAvatarUpload(this)">
                </div>
                
                <h3 class="fw-bold mb-1" id="profile-name-display">${user.name}</h3>
                <p class="text-muted mb-4">Toplam Puan: <span class="text-warning fw-bold"><i class="bi bi-star-fill"></i> ${user.points}</span></p>

                </div>

                <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 mx-3 text-start">
                     <div class="d-flex justify-content-between align-items-center mb-3">
                         <h6 class="fw-bold m-0"><i class="bi bi-palette text-primary me-2"></i>Tema Seçimi</h6>
                     </div>
                     <div class="d-flex gap-2 overflow-auto pb-2" style="scrollbar-width: none;">
                        ${this.renderThemeOptions()}
                     </div>
                </div>

                <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 mx-3 text-start">
                    <div class="d-flex justify-content-between align-items-center">
                         <h6 class="fw-bold m-0"><i class="bi bi-volume-up text-primary me-2"></i>Ses Efektleri</h6>
                         <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="mute-switch" 
                                ${!Store.state.user.settings.mute ? 'checked' : ''} 
                                onchange="Store.toggleMute();">
                         </div>
                    </div>
                </div>

                 <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 mx-3 text-start bg-primary bg-opacity-10 border-primary">
                    <div class="d-flex justify-content-between align-items-center">
                         <div>
                            <h6 class="fw-bold m-0 text-primary">YDS 2000 Kelime Paketi</h6>
                            <small class="text-muted">Popüler kelimeleri yükle</small>
                         </div>
                         <button class="btn btn-primary btn-sm rounded-pill px-3" onclick="UI.loadYDSPack()">
                            <i class="bi bi-cloud-arrow-down-fill me-1"></i> Yükle
                         </button>
                    </div>
                </div>

                <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 mx-3 text-start">
                    <label class="form-label small text-muted fw-bold">KULLANICI ADI</label>
                    <div class="input-group">
                        <input type="text" class="form-control border-0 bg-light fw-bold" id="profile-name-input" value="${user.name}">
                        <button class="btn btn-primary rounded-end" onclick="UI.saveProfileName()">Kaydet</button>
                    </div>
                </div>

                <div class="d-grid gap-2 px-3">
                    <div class="row g-2">
                        <div class="col-6">
                            <button class="btn btn-outline-primary border-2 w-100 rounded-4 py-3" onclick="Store.exportData()">
                                <i class="bi bi-download d-block fs-3 mb-1"></i>
                                Yedekle
                            </button>
                        </div>
                        <div class="col-6">
                            <button class="btn btn-outline-success border-2 w-100 rounded-4 py-3" onclick="document.getElementById('import-file').click()">
                                <i class="bi bi-upload d-block fs-3 mb-1"></i>
                                Yükle
                            </button>
                            <input type="file" id="import-file" class="d-none" accept=".json" onchange="UI.handleImport(this)">
                        </div>
                    </div>

                    <button class="btn btn-outline-danger border-0 text-start p-3 rounded-4 mt-3" onclick="if(confirm('Tüm verilerin silinecek emin misin?')) { localStorage.clear(); location.reload(); }">
                        <i class="bi bi-trash me-2"></i> Tüm Verileri Sıfırla
                    </button>
                </div>
            </div>
        `;
    },

    handleImport(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const result = Store.importData(e.target.result);
                if (result.success) {
                    alert(`${result.count} yeni kelime eklendi!`);
                    UI.switchView('vocab');
                } else {
                    alert('Hata: ' + result.error);
                }
            };
            reader.readAsText(input.files[0]);
        }
    },

    // Text to Speech
    speak(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop previous
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    },

    // Handle Image Upload
    handleAvatarUpload(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const base64 = e.target.result;
                Store.updateProfile(null, base64);
                // Update UI immediately
                const preview = document.getElementById('profile-avatar-preview');
                if (preview) preview.src = base64;
                else UI.renderProfile(document.getElementById('view-profile'));
            };
            reader.readAsDataURL(input.files[0]);
        }
    },

    saveProfileName() {
        const input = document.getElementById('profile-name-input');
        if (input && input.value.trim()) {
            const newName = input.value.trim();
            Store.updateProfile(newName, null);
            alert('Kullanıcı adı güncellendi: ' + newName);
            // Re-render manually to ensure UI reflects state immediately if listener is laggy
            // But listener usually handles it if we add it. 
        }
    },

    loadYDSPack() {
        if (confirm('YDS 2000 Kelime Paketi yüklensin mi? (Mevcut kelimeler silinmez)')) {
            const res = Store.loadYDSPack();
            if (res.success) {
                alert(`İşlem Başarılı! ${res.count} yeni kelime eklendi.`);
                this.switchView('vocab');
                AudioMgr.play('win');
            } else {
                alert('Hata: ' + res.error);
            }
        }
    },

    renderThemeOptions() {
        const themes = [
            { id: 'night', color: '#111827', name: 'Gece' },
            { id: 'ocean', color: '#0ea5e9', name: 'Okyanus' },
            { id: 'sunset', color: '#f43f5e', name: 'Gün Batımı' },
            { id: 'forest', color: '#22c55e', name: 'Orman' },
            { id: 'coffee', color: '#78350f', name: 'Kahve' },
            { id: 'rose', color: '#e11d48', name: 'Gül' },
            { id: 'cyber', color: '#8b5cf6', name: 'Siber' },
            { id: 'luxury', color: '#fbbf24', name: 'Lüks' },
            { id: 'terminal', color: '#000000', name: 'Terminal' },
            { id: 'light', color: '#ffffff', name: 'Gündüz' }
        ];

        return themes.map(t => `
            <div class="text-center cursor-pointer p-1" onclick="Store.toggleTheme('${t.id}')">
                <div class="rounded-circle border border-2 shadow-sm d-flex align-items-center justify-content-center mb-1 ${Store.state.user.theme === t.id ? 'border-primary' : 'border-light'}" 
                     style="width: 45px; height: 45px; background: ${t.color};">
                     ${Store.state.user.theme === t.id ? '<i class="bi bi-check text-white mix-blend-difference"></i>' : ''}
                </div>
                <small style="font-size: 0.7rem;" class="text-muted fw-bold">${t.name}</small>
            </div>
        `).join('');
    },

    renderGames(container) {
        container.innerHTML = `
            <div class="row g-3">
                <div class="col-12 text-center py-3">
                    <h2 class="fw-bold">Oyun Alanı</h2>
                    <p class="text-muted">Eğlenerek öğren!</p>
                </div>
                
                <div class="col-12">
                    <div class="custom-card p-4 clickable" onclick="UI.startBattleMode()">
                        <div class="d-flex align-items-center gap-3">
                            <div class="bg-danger bg-opacity-10 p-3 rounded-circle text-danger">
                                <i class="bi bi-lightning-fill fs-2"></i>
                            </div>
                            <div class="text-start">
                                <h5 class="fw-bold m-0">Kelime Savaşı</h5>
                                <small class="text-muted">Bot'a karşı 1v1 düello!</small>
                            </div>
                            <i class="bi bi-chevron-right ms-auto text-muted"></i>
                        </div>
                    </div>
                </div>

                <div class="col-6">
                    <div class="custom-card p-3 h-100 text-center clickable" onclick="UI.startScrambleGame()">
                        <i class="bi bi-grid-3x3 fs-1 text-primary mb-2"></i>
                        <h6 class="fw-bold">Kelime Avı</h6>
                        <small class="text-muted">Harfleri Düzenle</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="custom-card p-3 h-100 text-center clickable" onclick="Games.startSynonymGame()">
                        <i class="bi bi-arrow-left-right fs-1 text-success mb-2"></i>
                        <h6 class="fw-bold">Eş Anlam</h6>
                        <small class="text-muted">Synonyms</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="custom-card p-3 h-100 text-center clickable" onclick="Games.startPrepositionGame()">
                        <i class="bi bi-link-45deg fs-1 text-info mb-2"></i>
                        <h6 class="fw-bold">Edat Avı</h6>
                        <small class="text-muted">Prepositions</small>
                    </div>
                </div>
               <div class="col-12">
                     <div class="custom-card p-3 h-100 text-center clickable" onclick="UI.startHangmanGame()">
                        <i class="bi bi-emoji-dizzy fs-1 text-warning mb-2"></i>
                        <h6 class="fw-bold">Adam Asmaca</h6>
                        <small class="text-muted">Harfleri Tahmin Et</small>
                    </div>
                </div>
                 <div class="col-12">
                     <div class="custom-card p-3 h-100 text-center clickable" onclick="UI.startListeningGame()">
                        <i class="bi bi-headphones fs-1 text-info mb-2"></i>
                        <h6 class="fw-bold">Dinleme Challenge</h6>
                        <small class="text-muted">Duyduğunu Bul</small>
                    </div>
                </div>
                <div class="col-12">
                     <div class="custom-card p-3 h-100 text-center clickable" onclick="UI.startPronunciationGame()">
                        <div class="bg-primary bg-opacity-10 p-2 rounded-circle d-inline-block mb-2 text-primary">
                            <i class="bi bi-mic-fill fs-1"></i>
                        </div>
                        <h6 class="fw-bold">Telaffuz Koçu</h6>
                        <small class="text-muted">Konuşarak Puan Topla</small>
                    </div>
                </div>
            </div>
         `;
    },

    toggleFavorite(id) {
        const word = Store.state.words.find(w => w.id === id);
        if (word) {
            word.isFavorite = !word.isFavorite;
            Store.save();
            this.renderVocabList(document.getElementById('view-vocab'));
            // Optional: Provide feedback
        }
    },

    // --- MATCHING GAME ---
    targetMatch: 5,
    matchedPairs: 0,
    matchingTimer: null,
    matchingTimeLeft: 60,
    selectedCard: null,

    // --- PRONUNCIATION GAME ---
    pronunciationState: {
        word: null,
        listening: false,
        recognition: null
    },

    startPronunciationGame() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Tarayıcınız ses tanıma özelliğini desteklemiyor (Chrome önerilir).');
            return;
        }
        this.switchView('games');
        this.renderPronunciationGame(document.querySelector('.view-section.active'));
    },

    renderPronunciationGame(container) {
        // Select random word (Favorites prioritized)
        const favorites = Store.state.words.filter(w => w.isFavorite);
        let word;
        if (favorites.length > 0 && Math.random() < 0.8) {
            word = favorites[Math.floor(Math.random() * favorites.length)];
        } else {
            word = Store.state.words[Math.floor(Math.random() * Store.state.words.length)];
        }
        this.pronunciationState.word = word;
        this.pronunciationState.listening = false;

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <button class="btn btn-sm btn-icon" onclick="UI.switchView('games')"><i class="bi bi-chevron-left"></i></button>
                <h5 class="fw-bold m-0 text-purple">Telaffuz Koçu</h5>
                <div style="width: 32px;"></div>
            </div>

            <div class="text-center slide-in">
                <div class="card border-0 shadow-sm rounded-4 p-5 mb-4 position-relative overflow-hidden">
                    <div class="position-absolute start-50 top-50 translate-middle opacity-25">
                         <i class="bi bi-mic-fill" style="font-size: 10rem; color: var(--primary-color);"></i>
                    </div>
                    
                    <div class="position-relative z-1">
                        <small class="text-muted text-uppercase fw-bold">Bunu Oku</small>
                        <h1 class="display-3 fw-bold mb-2 text-primary">${word.word}</h1>
                        <p class="text-muted fs-5">"${word.meaning}"</p>
                        
                        <button class="btn btn-sm btn-light rounded-pill px-3 shadow-sm mt-2" onclick="AudioMgr.playListening('${word.word}')">
                            <i class="bi bi-volume-up-fill me-1"></i> Dinle
                        </button>
                    </div>
                </div>

                <div id="mic-status" class="mb-4" style="height: 30px;">
                    <p class="text-muted">Mikrofona bas ve konuş...</p>
                </div>

                <div class="d-flex justify-content-center gap-3">
                    <button id="btn-mic" class="btn btn-primary rounded-circle shadow-lg hover-scale bounce-in" style="width: 80px; height: 80px;" onclick="UI.handleMicClick()">
                        <i class="bi bi-mic-fill fs-1"></i>
                    </button>
                </div>
                 <button class="btn btn-link text-muted mt-3" onclick="UI.renderPronunciationGame(document.querySelector('.view-section.active'))">
                    Pass (Değiştir)
                </button>
            </div>
        `;
    },

    handleMicClick() {
        if (this.pronunciationState.listening) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        const btn = document.getElementById('btn-mic');
        const status = document.getElementById('mic-status');

        btn.classList.add('pulse-anim');
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-danger');
        status.innerHTML = '<p class="text-danger fw-bold blink">Dinliyorum...</p>';

        this.pronunciationState.listening = true;

        recognition.start();

        recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript.toLowerCase();
            const targetWord = this.pronunciationState.word.word.toLowerCase();

            console.log('Heard:', speechResult);

            if (speechResult.includes(targetWord)) {
                UI.showPronunciationResult(true, speechResult);
            } else {
                UI.showPronunciationResult(false, speechResult);
            }
        };

        recognition.onspeechend = () => {
            recognition.stop();
            this.pronunciationState.listening = false;
            btn.classList.remove('pulse-anim', 'btn-danger');
            btn.classList.add('btn-primary');
        };

        recognition.onerror = (event) => {
            status.innerHTML = '<p class="text-danger">Anlaşılamadı. Tekrar dene.</p>';
            this.pronunciationState.listening = false;
            btn.classList.remove('pulse-anim', 'btn-danger');
            btn.classList.add('btn-primary');
        };
    },

    showPronunciationResult(success, heard) {
        const status = document.getElementById('mic-status');
        if (success) {
            AudioMgr.play('correct');
            status.innerHTML = `<p class="text-success fw-bold"><i class="bi bi-check-circle-fill me-1"></i> Harika! "${heard}"</p>`;
            Store.updateUserPoints(15);
            setTimeout(() => {
                const container = document.querySelector('.view-section.active');
                if (container) this.renderPronunciationGame(container);
            }, 2000);
        } else {
            AudioMgr.play('fail');
            status.innerHTML = `<p class="text-danger fw-bold"><i class="bi bi-x-circle-fill me-1"></i> "${heard}" duydum.</p>`;
        }
    },

    startMatchingGame() {
        if (Store.state.words.length < 5) return alert('En az 5 kelime gerekli!');
        this.switchView('games'); // Ensure container logic
        this.matchedPairs = 0;
        this.matchingTimeLeft = 60;
        this.selectedCard = null;
        this.renderMatchingGame(document.querySelector('.view-section.active'));
    },

    renderMatchingGame(container) {
        clearInterval(this.matchingTimer);

        // Select 5 random words (Favorites prioritized)
        const favorites = Store.state.words.filter(w => w.isFavorite).sort(() => 0.5 - Math.random());
        const others = Store.state.words.filter(w => !w.isFavorite).sort(() => 0.5 - Math.random());
        const gameWords = [...favorites, ...others].slice(0, 5);

        // Create Left (English) and Right (Turkish) arrays
        const leftSide = gameWords.map(w => ({ id: w.id, text: w.word, type: 'eng' })).sort(() => 0.5 - Math.random());
        const rightSide = gameWords.map(w => ({ id: w.id, text: w.meaning, type: 'tr' })).sort(() => 0.5 - Math.random());

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-sm btn-icon" onclick="clearInterval(UI.matchingTimer); UI.switchView('games')"><i class="bi bi-x-lg"></i></button>
                <div class="bg-light px-3 py-1 rounded-pill fw-bold text-primary">
                    <i class="bi bi-clock-fill"></i> <span id="match-timer">60</span>s
                </div>
            </div>
            
            <div class="row g-3" id="match-grid">
                <div class="col-6 d-flex flex-column gap-2" id="match-left">
                    ${leftSide.map(item => `
                        <div class="custom-card p-3 text-center match-card fw-bold clickable" 
                             onclick="UI.handleMatchCard(this, '${item.id}', 'eng')" data-id="${item.id}">
                            ${item.text}
                        </div>
                    `).join('')}
                </div>
                <div class="col-6 d-flex flex-column gap-2" id="match-right">
                     ${rightSide.map(item => `
                        <div class="custom-card p-3 text-center match-card fw-bold clickable" 
                             onclick="UI.handleMatchCard(this, '${item.id}', 'tr')" data-id="${item.id}">
                            ${item.text}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.matchingTimer = setInterval(() => {
            this.matchingTimeLeft--;
            const el = document.getElementById('match-timer');
            if (el) el.textContent = this.matchingTimeLeft;
            if (this.matchingTimeLeft <= 0) {
                clearInterval(this.matchingTimer);
                alert("Süre Doldu!");
                UI.switchView('games');
            }
        }, 1000);
    },

    handleMatchCard(el, id, type) {
        if (el.classList.contains('matched')) return;

        if (!this.selectedCard) {
            // Select First
            this.selectedCard = { el, id, type };
            el.classList.add('border-primary', 'bg-primary', 'bg-opacity-10', 'text-primary');
        } else {
            // Check if clicked same card
            if (this.selectedCard.el === el) {
                this.selectedCard = null;
                el.classList.remove('border-primary', 'bg-primary', 'bg-opacity-10', 'text-primary');
                return;
            }

            // Check match
            const isMatch = this.selectedCard.id === id && this.selectedCard.type !== type;

            if (isMatch) {
                // Success
                el.classList.add('bg-success', 'text-white', 'matched', 'invisible-anim');
                this.selectedCard.el.classList.remove('border-primary', 'bg-primary', 'bg-opacity-10', 'text-primary');
                this.selectedCard.el.classList.add('bg-success', 'text-white', 'matched', 'invisible-anim');

                this.matchedPairs++;
                Store.updateUserPoints(5);

                // Cleanup visuals after anim
                setTimeout(() => {
                    el.style.visibility = 'hidden';
                    this.selectedCard.el.style.visibility = 'hidden';
                    this.selectedCard = null;

                    if (this.matchedPairs === 5) {
                        clearInterval(this.matchingTimer);
                        Store.updateUserPoints(20);
                        alert("Tebrikler! +20 Puan");
                        UI.switchView('games');
                    }
                }, 300);
            } else {
                // Fail
                el.classList.add('bg-danger', 'text-white');
                this.selectedCard.el.classList.remove('border-primary', 'bg-primary', 'bg-opacity-10', 'text-primary');
                this.selectedCard.el.classList.add('bg-danger', 'text-white');

                setTimeout(() => {
                    el.classList.remove('bg-danger', 'text-white');
                    if (this.selectedCard) this.selectedCard.el.classList.remove('bg-danger', 'text-white');
                    this.selectedCard = null;
                }, 500);
            }
        }
    },


    // --- SCRAMBLE GAME ---
    scrambleWord: null,

    startScrambleGame() {
        if (Store.state.words.length < 1) return alert('Kelime ekle!');
        this.switchView('games');
        this.renderScramble(document.querySelector('.view-section.active'));
    },

    renderScramble(container) {
        const words = Store.state.words;
        this.scrambleWord = words[Math.floor(Math.random() * words.length)];

        // Scramble logic
        const scrambled = this.scrambleWord.word.split('').sort(() => 0.5 - Math.random()).join('').toUpperCase();

        container.innerHTML = `
             <div class="d-flex justify-content-between align-items-center mb-5">
                <button class="btn btn-sm btn-icon" onclick="UI.switchView('games')"><i class="bi bi-arrow-left"></i></button>
                <div class="badge bg-warning text-dark">Kelime Avı</div>
            </div>

            <div class="text-center">
                <h1 class="display-3 fw-bold letter-spacing-2 mb-4 text-primary">${scrambled}</h1>
                <p class="text-muted mb-4">Bu kelimeyi düzeltebilir misin?</p>
                <p class="small text-muted mb-4">İpucu: ${this.scrambleWord.meaning}</p>
                
                <input type="text" id="scramble-input" class="form-control form-control-lg text-center fw-bold mb-3 rounded-pill" placeholder="Cevabını yaz...">
                
                <button class="btn btn-primary btn-lg rounded-pill px-5 shadow" onclick="UI.checkScramble()">KONTROL ET</button>
            </div>
        `;
    },

    checkScramble() {
        const val = document.getElementById('scramble-input').value.trim();
        if (val.toLowerCase() === this.scrambleWord.word.toLowerCase()) {
            Store.updateUserPoints(15);
            alert("DOĞRU! +15 Puan");
            this.renderScramble(document.querySelector('.view-section.active'));
        } else {
            alert("Yanlış cevap, tekrar dene!");
        }
    },


    // --- HANGMAN GAME ---
    hangmanState: { word: null, guesses: [], lives: 6 },

    startHangmanGame() {
        if (Store.state.words.length < 1) return alert('Kelime ekle!');
        this.switchView('games');
        this.renderHangman(document.querySelector('.view-section.active'));
    },

    renderHangman(container, reset = true) {
        if (reset) {
            const words = Store.state.words;
            const w = words[Math.floor(Math.random() * words.length)];
            this.hangmanState = { word: w, guesses: [], lives: 6 };
        }

        const wordUpper = this.hangmanState.word.word.toUpperCase();
        const displayWord = wordUpper.split('').map(char =>
            this.hangmanState.guesses.includes(char) || char === ' ' ? char : '_'
        ).join(' ');

        const keyboard = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

        const isWin = !displayWord.includes('_');
        const isLose = this.hangmanState.lives <= 0;

        if (isWin) {
            Store.updateUserPoints(25);
            setTimeout(() => { alert("KAZANDIN! +25"); UI.renderHangman(container, true); }, 500);
        } else if (isLose) {
            setTimeout(() => { alert(`KAYBETTİN! Kelime: ${this.hangmanState.word.word}`); UI.renderHangman(container, true); }, 500);
        }

        container.innerHTML = `
             <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-sm btn-icon" onclick="UI.switchView('games')"><i class="bi bi-arrow-left"></i></button>
                <div class="fw-bold text-danger"><i class="bi bi-heart-fill"></i> ${this.hangmanState.lives} Hak</div>
            </div>

            <div class="text-center py-4">
                 <p class="text-muted mb-2">Anlamı: ${this.hangmanState.word.meaning}</p>
                 <h1 class="display-4 fw-bold letter-spacing-2 mb-5 font-monospace">${displayWord}</h1>
                 
                 <div class="d-flex flex-wrap justify-content-center gap-2 mw-100">
                    ${keyboard.map(char => `
                        <button class="btn btn-sm btn-outline-dark fw-bold" 
                            style="width: 40px; height: 40px;"
                            ${this.hangmanState.guesses.includes(char) ? 'disabled' : ''}
                            onclick="UI.handleHangmanGuess('${char}')">
                            ${char}
                        </button>
                    `).join('')}
                 </div>
            </div>
        `;
    },

    handleHangmanGuess(char) {
        if (this.hangmanState.guesses.includes(char)) return;
        this.hangmanState.guesses.push(char);

        if (!this.hangmanState.word.word.toUpperCase().includes(char)) {
            this.hangmanState.lives--;
        }

        this.renderHangman(document.querySelector('.view-section.active'), false);
    },

    // --- LISTENING GAME ---
    listeningState: {
        currentWord: null,
        options: [],
        streak: 0,
        lives: 3,
        canGuess: true
    },

    renderListening(container) {
        // Reset state if starting fresh or if previous game ended
        if (!this.listeningState.currentWord || this.listeningState.lives <= 0) {
            this.listeningState = {
                currentWord: null,
                options: [],
                streak: 0,
                lives: 3,
                canGuess: true
            };
        }

        // Select a word if none selected
        if (!this.listeningState.currentWord) {
            const allWords = Store.state.words;
            if (allWords.length < 4) return alert("En az 4 kelimeniz olmalı!");

            const target = allWords[Math.floor(Math.random() * allWords.length)];
            const distractors = allWords.filter(w => w.id !== target.id)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);

            this.listeningState.currentWord = target;
            this.listeningState.options = [...distractors, target].sort(() => 0.5 - Math.random());
            this.listeningState.canGuess = true;

            // Auto play audio after 500ms
            setTimeout(() => AudioMgr.playListening(target.word), 500);
        }

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <button class="btn btn-sm btn-icon" onclick="UI.switchView('games')"><i class="bi bi-arrow-left"></i></button>
                <div class="d-flex gap-3">
                    <span class="fw-bold text-danger"><i class="bi bi-heart-fill"></i> ${this.listeningState.lives}</span>
                    <span class="fw-bold text-success"><i class="bi bi-fire"></i> ${this.listeningState.streak}</span>
                </div>
            </div>

            <div class="text-center py-4">
                <div class="mb-5">
                    <button class="btn btn-outline-primary btn-lg rounded-circle shadow p-4 pulse-animation" 
                        onclick="UI.replayListening()">
                        <i class="bi bi-volume-up-fill display-1"></i>
                    </button>
                    <p class="mt-3 text-muted small">Tekrar dinlemek için tıklayın</p>
                </div>

                <div class="row g-3">
                    ${this.listeningState.options.map(opt => `
                        <div class="col-6">
                            <button class="btn btn-light w-100 py-4 h-100 shadow-sm border-0 fw-bold fs-5 text-wrap position-relative option-btn"
                                onclick="UI.handleListeningGuess('${opt.id}', this)">
                                ${opt.meaning}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    replayListening() {
        if (this.listeningState.currentWord) {
            AudioMgr.playListening(this.listeningState.currentWord.word);
        }
    },

    handleListeningGuess(id, btn) {
        if (!this.listeningState.canGuess) return;
        this.listeningState.canGuess = false;

        const isCorrect = id === this.listeningState.currentWord.id;
        const container = document.querySelector('.view-section.active');

        if (isCorrect) {
            AudioMgr.play('correct');
            btn.classList.remove('btn-light');
            btn.classList.add('btn-success', 'text-white', 'pulse');
            Store.updateUserPoints(15);
            this.listeningState.streak++;

            setTimeout(() => {
                this.listeningState.currentWord = null; // Next round
                this.renderListening(container);
            }, 1500);
        } else {
            AudioMgr.play('incorrect');
            btn.classList.remove('btn-light');
            btn.classList.add('btn-danger', 'text-white', 'shake');
            this.listeningState.lives--;
            this.listeningState.streak = 0;

            // Highlight correct one
            const buttons = container.querySelectorAll('.option-btn');
            buttons.forEach(b => {
                if (b.innerText.includes(this.listeningState.currentWord.meaning)) {
                    b.classList.add('btn-outline-success');
                }
            });

            if (this.listeningState.lives <= 0) {
                setTimeout(() => {
                    alert(`Oyun Bitti! Skorun: ${Store.state.user.points}`);
                    this.switchView('games');
                }, 2000);
            } else {
                setTimeout(() => {
                    this.listeningState.currentWord = null; // Next round
                    this.renderListening(container);
                }, 2000);
            }
        }
    },
    startBattleMode() {
        if (Store.state.words.length < 5) {
            alert('Savaş modu için en az 5 kelimen olmalı!');
            return;
        }

        const container = document.querySelector('.view-section.active');
        if (!container) return; // Should allow switching too

        this.renderBattle(container);
    },

    // Battle State
    battleState: {
        timer: null,
        timeLeft: 30,
        playerScore: 0,
        botScore: 0,
        currentWord: null,
        botName: 'Terminatör', // Or random form league
        active: false
    },

    renderBattle(container) {
        // Reset State
        this.battleState = {
            timer: null,
            timeLeft: 30,
            playerScore: 0,
            botScore: 0,
            currentWord: null,
            botName: 'Terminatör',
            active: true
        };

        container.innerHTML = `
            <div class="text-center py-4 slide-in">
                <h1 class="display-3">⚔️</h1>
                <h2 class="fw-bold">Hazır mısın?</h2>
                <p class="text-muted">Bot rütbeli rakibine karşı 30 saniye!</p>
                <div class="display-1 fw-bold text-primary" id="battle-countdown">3</div>
            </div>
        `;

        let count = 3;
        const startInterval = setInterval(() => {
            count--;
            const el = document.getElementById('battle-countdown');
            if (el) el.textContent = count;

            if (count === 0) {
                clearInterval(startInterval);
                this.startBattleLoop(container);
            }
        }, 1000);
    },

    startBattleLoop(container) {
        this.nextBattleRound(container);

        // Main Timer
        this.battleState.timer = setInterval(() => {
            this.battleState.timeLeft--;
            const timeEl = document.getElementById('battle-timer-display');
            if (timeEl) timeEl.textContent = this.battleState.timeLeft;

            // Bot randomly scores
            if (Math.random() > 0.8) {
                this.battleState.botScore += 10;
                this.updateBattleScores();
            }

            if (this.battleState.timeLeft <= 0) {
                this.endBattle(container);
            }
        }, 1000);
    },

    nextBattleRound(container) {
        if (this.battleState.timeLeft <= 0) return;

        // Pick Random Word
        const words = Store.state.words;
        const word = words[Math.floor(Math.random() * words.length)];
        this.battleState.currentWord = word;

        // Generate options
        const options = this.generateTestOptions(word);

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4 px-2">
                <div class="text-center">
                    <small class="text-muted d-block">Sen</small>
                    <span class="fs-4 fw-bold text-primary" id="player-score-disp">${this.battleState.playerScore}</span>
                </div>
                <div class="bg-light rounded-pill px-3 py-1 border">
                    <i class="bi bi-clock-fill text-warning me-1"></i>
                    <span class="fw-bold" id="battle-timer-display">${this.battleState.timeLeft}</span>
                </div>
                <div class="text-center">
                    <small class="text-muted d-block">${this.battleState.botName}</small>
                    <span class="fs-4 fw-bold text-danger" id="bot-score-disp">${this.battleState.botScore}</span>
                </div>
            </div>

            <div class="card border-0 shadow-lg rounded-4 p-4 text-center mb-4 battle-card-enter">
                <h1 class="fw-bold mb-0">${word.word}</h1>
            </div>

            <div class="d-grid gap-2">
                ${options.map(opt => `
                    <button class="btn btn-outline-dark border-2 rounded-3 py-3 fw-bold bg-white text-dark" 
                        onmousedown="UI.handleBattleAnswer('${opt}', this)">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        `;
    },

    handleBattleAnswer(answer, btn) {
        if (!this.battleState.active) return;

        const isCorrect = this.battleState.currentWord.meaning === answer;

        if (isCorrect) {
            AudioMgr.play('correct');
            this.battleState.playerScore += 15; // More points for being fast (simulated)
            btn.classList.add('bg-success', 'text-white', 'border-success');
            setTimeout(() => this.nextBattleRound(document.querySelector('.view-section.active')), 300);
        } else {
            AudioMgr.play('incorrect');
            this.battleState.playerScore -= 5;
            btn.classList.add('bg-danger', 'text-white', 'border-danger');
            // Shake effect or slight delay
            setTimeout(() => this.nextBattleRound(document.querySelector('.view-section.active')), 500);
        }
        this.updateBattleScores();
    },

    updateBattleScores() {
        const pScoreRep = document.getElementById('player-score-disp');
        const bScoreRep = document.getElementById('bot-score-disp');
        if (pScoreRep) pScoreRep.textContent = this.battleState.playerScore;
        if (bScoreRep) bScoreRep.textContent = this.battleState.botScore;
    },

    // Handle all audio feedback
    playSound(type) {
        AudioMgr.play(type);
    },

    updateBattleScores() {
        const pScoreRep = document.getElementById('player-score-disp');
        const bScoreRep = document.getElementById('bot-score-disp');
        if (pScoreRep) pScoreRep.textContent = this.battleState.playerScore;
        if (bScoreRep) bScoreRep.textContent = this.battleState.botScore;
    },

    endBattle(container) {
        clearInterval(this.battleState.timer);
        this.battleState.active = false;

        const didWin = this.battleState.playerScore > this.battleState.botScore;

        if (didWin) Store.updateUserPoints(50); // Winner bonus

        container.innerHTML = `
            <div class="text-center py-5 slide-in">
                <i class="bi bi-${didWin ? 'trophy-fill text-warning' : 'emoji-frown-fill text-muted'} display-1"></i>
                <h1 class="fw-bold mt-3">${didWin ? 'KAZANDIN!' : 'KAYBETTİN'}</h1>
                
                <div class="d-flex justify-content-center gap-4 my-4">
                    <div class="text-center">
                        <span class="d-block text-muted">Sen</span>
                        <h2 class="fw-bold text-primary">${this.battleState.playerScore}</h2>
                    </div>
                    <div class="vr"></div>
                    <div class="text-center">
                        <span class="d-block text-muted">${this.battleState.botName}</span>
                        <h2 class="fw-bold text-danger">${this.battleState.botScore}</h2>
                    </div>
                </div>

                <p class="text-muted">${didWin ? '+50 Zafer Puanı Eklendi' : 'Bir dahaki sefere daha hızlı ol!'}</p>
                
                <button class="btn btn-primary btn-lg rounded-pill px-5 mt-3" onclick="UI.switchView('games')">Tamam</button>
            </div>
        `;
    },

    updateHeader() {
        if (document.getElementById('header-points')) {
            document.getElementById('header-points').textContent = Store.state.user.points;
        }
    },

    renderHome(container = document.getElementById('view-home')) {
        if (!container) return;
        const user = Store.state.user;
        const words = Store.state.words;

        // Calculate Stats
        const today = new Date().toISOString().slice(0, 10);
        if (user.dailyGoal.lastDate !== today) {
            user.dailyGoal.current = 0; // Reset daily count
            user.dailyGoal.lastDate = today;
            Store.save();
        }

        const progressPercent = Math.min((user.dailyGoal.current / user.dailyGoal.target) * 100, 100);
        const greeting = new Date().getHours() < 12 ? 'Günaydın' : (new Date().getHours() < 18 ? 'Tünaydın' : 'İyi Akşamlar');

        container.innerHTML = `
            <!-- Header Section -->
            <div class="d-flex justify-content-between align-items-center mb-4 slide-in">
                <div>
                    <h1 class="fw-bold mb-0">${greeting}, ${user.name} 👋</h1>
                    <p class="text-muted small">Bugün öğrenmeye hazır mısın?</p>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-sm btn-light border shadow-sm rounded-circle" style="width: 32px; height: 32px;" onclick="UI.changeFontSize(-1)">
                        <i class="bi bi-dash"></i>
                    </button>
                    <button class="btn btn-sm btn-light border shadow-sm rounded-circle" style="width: 32px; height: 32px;" onclick="UI.changeFontSize(1)">
                        <i class="bi bi-plus"></i>
                    </button>
                    <div class="text-end clickable" onclick="UI.switchView('profile')">
                         <img src="${user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name}" 
                              class="rounded-circle border border-2 border-primary shadow-sm" width="50" height="50">
                    </div>
                </div>
            </div>

            <!-- Dashboard Grid -->
            <div class="row g-3">
                
                <!-- Daily Goal Card -->
                <div class="col-12">
                     <div class="custom-card p-4 clickable text-center bg-danger bg-opacity-10 border border-danger border-opacity-25 mb-3" onclick="Chat.startChatMode()">
                        <div class="d-flex align-items-center justify-content-center gap-3">
                             <div class="bg-white p-3 rounded-circle shadow-sm">
                                <i class="bi bi-chat-quote-fill text-danger fs-3"></i>
                            </div>
                            <div class="text-start">
                                 <h4 class="fw-bold m-0 text-danger text-start">Dedikodu Kazanı</h4>
                                 <small class="text-secondary fw-bold text-start d-block">YDS Uzmanlarını Dinle & Öğren!</small>
                            </div>
                            <i class="bi bi-chevron-right text-danger ms-auto"></i>
                        </div>
                    </div>
                </div>
                
                <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-4 p-3 bg-gradient-primary text-white position-relative overflow-hidden mb-2 bounce-in">
                        <div class="d-flex justify-content-between align-items-center position-relative z-1">
                            <div>
                                <h5 class="fw-bold mb-1">Günlük Hedef</h5>
                                <div class="d-flex align-items-baseline gap-2">
                                    <h2 class="fw-bold m-0">${user.dailyGoal.current}</h2>
                                    <span class="opacity-75">/ ${user.dailyGoal.target} Kelime</span>
                                </div>
                            </div>
                            <div class="position-relative" style="width: 60px; height: 60px;">
                                <svg class="w-100 h-100" viewBox="0 0 36 36">
                                    <path class="text-white opacity-25" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="4" />
                                    <path class="text-white" stroke-dasharray="${progressPercent}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="4" />
                                </svg>
                                <i class="bi bi-fire position-absolute top-50 start-50 translate-middle fs-4"></i>
                            </div>
                        </div>
                        <div class="progress mt-3 bg-white bg-opacity-25" style="height: 6px;">
                            <div class="progress-bar bg-white" role="progressbar" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="col-6">
                    <div class="card border-0 shadow-sm rounded-4 p-3 h-100 text-center clickable hover-scale bg-light" onclick="UI.switchView('learn')">
                        <div class="mb-2">
                            <i class="bi bi-book-half fs-1 text-primary"></i>
                        </div>
                        <h6 class="fw-bold">Çalış</h6>
                        <small class="text-muted">Kelime Kartları</small>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card border-0 shadow-sm rounded-4 p-3 h-100 text-center clickable hover-scale bg-light" onclick="UI.switchView('games')">
                         <div class="mb-2">
                            <i class="bi bi-controller fs-1 text-success"></i>
                        </div>
                        <h6 class="fw-bold">Oyna</h6>
                        <small class="text-muted">Eğlenceli Modlar</small>
                    </div>
                </div>

                <!-- Stats Overview -->
                <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-4 p-3 mt-2 clickable hover-scale" onclick="UI.switchView('stats')">
                        <h6 class="fw-bold mb-3"><i class="bi bi-bar-chart-fill text-warning me-2"></i>İstatistikler &rsaquo;</h6>
                        <div class="d-flex justify-content-around text-center">
                            <div>
                                <h4 class="fw-bold mb-0 text-primary">${words.length}</h4>
                                <small class="text-muted">Kelime</small>
                            </div>
                             <div>
                                <h4 class="fw-bold mb-0 text-warning">${user.stats.totalLearned || 0}</h4>
                                <small class="text-muted">Ezberlenen</small>
                            </div>
                             <div>
                                <h4 class="fw-bold mb-0 text-danger">${user.points}</h4>
                                <small class="text-muted">Puan</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Today's Word -->
                 <div class="col-12">
                    ${words.length > 0 ? (() => {
                const randomWord = words[Math.floor(Math.random() * words.length)];
                return `
                        <div class="card border-0 shadow-sm rounded-4 p-3 bg-dark text-white position-relative overflow-hidden" onclick="UI.renderFlashcards(document.querySelector('.view-section.active'))">
                             <div class="position-absolute end-0 top-0 p-3 opacity-25">
                                <i class="bi bi-quote fs-1"></i>
                            </div>
                            <small class="text-warning fw-bold mb-1">Günün Kelimesi</small>
                            <h3 class="fw-bold mb-1">${randomWord.word}</h3>
                            <p class="m-0 opacity-75">${randomWord.meaning}</p>
                        </div>
                        `;
            })() : ''}
                </div>
            </div>
            
            <div style="height: 80px;"></div> <!-- Spacer for bottom nav if added -->
        `;
    },

    // --- Selection State ---
    selectedWords: new Set(),

    toggleWordSelection(id) {
        if (this.selectedWords.has(id)) {
            this.selectedWords.delete(id);
        } else {
            this.selectedWords.add(id);
        }
        this.updateBulkDeleteButton();
    },

    toggleSelectAll() {
        const allIds = Store.state.words.map(w => w.id);
        if (this.selectedWords.size === allIds.length) {
            this.selectedWords.clear();
        } else {
            allIds.forEach(id => this.selectedWords.add(id));
        }
        // Force re-render to show checkbox changes
        this.renderVocabList(document.getElementById('view-vocab'));
    },

    updateBulkDeleteButton() {
        const btn = document.getElementById('btn-bulk-delete');
        if (btn) {
            if (this.selectedWords.size > 0) {
                btn.classList.remove('d-none');
                btn.innerHTML = `<i class="bi bi-trash me-1"></i> Seçilenleri Sil (${this.selectedWords.size})`;
            } else {
                btn.classList.add('d-none');
            }
        }
    },

    deleteSelectedWords() {
        if (this.selectedWords.size === 0) return;

        if (confirm(`${this.selectedWords.size} adet kelimeyi silmek istediğinize emin misiniz?`)) {
            this.selectedWords.forEach(id => {
                Store.deleteWord(id);
            });
            this.selectedWords.clear();
            // Re-render handled by Store usually but here we manual
            this.renderVocabList(document.getElementById('view-vocab'));
            AudioMgr.play('click');
        }
    },

    filterVocab(query) {
        if (!query) {
            this.renderVocabList(document.getElementById('view-vocab'));
            return;
        }
        query = query.toLowerCase();
        const filtered = Store.state.words.filter(w =>
            w.word.toLowerCase().includes(query) ||
            w.meaning.toLowerCase().includes(query)
        );
        document.getElementById('vocab-list-container').innerHTML = this.generateVocabListHtml(filtered);
    },

    renderVocabList(container) {
        if (!container) return;
        const words = Store.state.words;

        // Sorting: A-Z
        const sortedWords = [...words].sort((a, b) => a.word.localeCompare(b.word));

        let listHtml = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="fw-bold m-0">Kelimelerim</h4>
                <div class="d-flex gap-2 align-items-center">
                    <button id="btn-bulk-delete" class="btn btn-danger rounded-pill btn-sm d-none fade-in" onclick="UI.deleteSelectedWords()">
                        <i class="bi bi-trash me-1"></i> Sil
                    </button>
                    <button class="btn btn-primary rounded-pill btn-sm" onclick="UI.renderFlashcards(document.querySelector('.view-section.active'))">
                        <i class="bi bi-card-text me-1"></i> Kartlar
                    </button>
                     <button class="btn btn-dark rounded-pill btn-sm" onclick="UI.switchView('reading')">
                        <i class="bi bi-justify-left me-1"></i> Okuma
                    </button>
                    <div class="badge bg-primary rounded-pill d-flex align-items-center">${words.length}</div>
                </div>
            </div>
            
            <div class="input-group mb-3">
                <button class="btn btn-outline-secondary bg-white border-end-0" onclick="UI.toggleSelectAll()" title="Tümünü Seç/Kaldır">
                    <i class="bi bi-check-square"></i>
                </button>
                <div class="input-group-text bg-white border-start-0 border-end-0"><i class="bi bi-search"></i></div>
                <input type="text" class="form-control border-start-0" placeholder="Kelime ara..." onkeyup="UI.filterVocab(this.value)">
            </div>

            <div class="vocab-list pb-5" id="vocab-list-container">
                ${this.generateVocabListHtml(sortedWords)}
            </div>
        `;
        container.innerHTML = listHtml;
        this.updateBulkDeleteButton();
    },

    generateVocabListHtml(words) {
        if (words.length === 0) {
            return `<div class="text-center text-muted py-5"><i class="bi bi-inbox fs-1"></i><p>Henüz kelime eklenmemiş veya bulunamadı.</p></div>`;
        }

        return words.map(word => `
            <div class="custom-card p-3 mb-2">
                <div class="d-flex justify-content-between align-items-start gap-3">
                    <div class="pt-1">
                        <input class="form-check-input p-2 border-2" type="checkbox" 
                               ${this.selectedWords.has(word.id) ? 'checked' : ''} 
                               onchange="UI.toggleWordSelection('${word.id}')">
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <h5 class="fw-bold m-0 text-primary">${word.word}</h5>
                            <span class="badge bg-light text-dark border small" style="font-size: 0.7rem">${word.tags?.[0] || 'Genel'}</span>
                        </div>
                        <p class="mb-1 fw-medium text-dark">${word.meaning}</p>
                        ${word.example ? `<small class="text-muted fst-italic d-block">"${word.example}"</small>` : ''}
                    </div>
                    <div class="d-flex align-items-center gap-2">
                         <i class="bi ${word.isFavorite ? 'bi-star-fill text-warning' : 'bi-star text-muted'} fs-5 clickable" 
                            onclick="UI.toggleFavorite('${word.id}')"></i>
                         <button class="btn btn-sm btn-icon text-primary me-2" onclick="UI.speak('${word.word}')"><i class="bi bi-volume-up-fill"></i></button>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-light btn-icon" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-4">
                            <li><a class="dropdown-item" href="#" onclick="UI.editWord('${word.id}')"><i class="bi bi-pencil me-2 text-warning"></i>Düzenle</a></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="UI.deleteWord('${word.id}')"><i class="bi bi-trash me-2"></i>Sil</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        `).join('');
    },

    editWord(id) {
        const word = Store.state.words.find(w => w.id === id);
        if (!word) return;

        // Pre-fill modal
        const form = document.getElementById('add-word-form');
        form.querySelector('#inputWord').value = word.word;
        form.querySelector('#inputMeaning').value = word.meaning;
        form.querySelector('#inputExample').value = word.example || '';
        form.querySelector('#inputTag').value = word.tags[0];
        // Note: Cannot programmatically set file input value for security reasons

        // Change submit handler to update instead of add
        form.setAttribute('data-edit-id', id);

        // Show modal with different title
        document.querySelector('#addWordModal .modal-title').textContent = 'Kelime Düzenle';
        // Note: Button text change might not work if button is not inside form or has no type=submit selector matching perfectly, 
        // but the form onsubmit "UI.handleAddWord(this)" handles the logic via data-edit-id.

        UI.showAddModal();
    },

    showAddModal() {
        const modalEl = document.getElementById('addWordModal');
        if (modalEl && window.bootstrap) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        } else {
            console.error('Modal or Bootstrap not found');
        }
    },

    handleAddWord(form) {
        const imageInput = form.querySelector('#inputImage');

        const saveWord = (base64Image) => {
            const word = {
                word: form.querySelector('#inputWord').value,
                meaning: form.querySelector('#inputMeaning').value,
                example: form.querySelector('#inputExample').value,
                tags: [form.querySelector('#inputTag').value],
                image: base64Image || null
            };

            const editId = form.getAttribute('data-edit-id');
            if (editId) {
                // Update existing word
                Store.updateWord(editId, word);
                form.removeAttribute('data-edit-id');
            } else {
                // Add new word
                Store.addWord(word);
            }

            const modalEl = document.getElementById('addWordModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            form.reset();
            if (imageInput) imageInput.value = ''; // Clear file input

            // Re-render current view to show changes
            const activeView = document.querySelector('.view-section.active');
            if (activeView && activeView.id === 'view-vocab') {
                this.renderVocabList(activeView);
            }
        };

        if (imageInput && imageInput.files && imageInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => saveWord(e.target.result);
            reader.readAsDataURL(imageInput.files[0]);
        } else {
            saveWord(null);
        }
    },

    deleteWord(id) {
        if (confirm('Bu kelimeyi silmek istediğine emin misin?')) {
            Store.deleteWord(id);
        }
    },

    startModule(type) {
        this.switchView(type);
    },

    // --- Flashcard System ---
    currentFlashcardIndex: 0,
    flashcardSession: [],

    renderFlashcards(container) {
        if (this.currentFlashcardIndex === 0 || !this.flashcardSession.length) {
            this.currentFlashcardIndex = 0;
            // Favorites first, then random
            const favorites = Store.state.words.filter(w => w.isFavorite).sort(() => 0.5 - Math.random());
            const others = Store.state.words.filter(w => !w.isFavorite).sort(() => 0.5 - Math.random());
            this.flashcardSession = [...favorites, ...others];
        }

        const words = this.flashcardSession;

        if (words.length === 0) {
            container.innerHTML = this.getEmptyStateHtml();
            return;
        }

        if (this.currentFlashcardIndex >= words.length) {
            container.innerHTML = this.getCompletionStateHtml('flashcards');
            return;
        }

        const currentWord = words[this.currentFlashcardIndex];
        const progress = ((this.currentFlashcardIndex + 1) / words.length) * 100;

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-sm btn-icon" onclick="UI.switchView('home')"><i class="bi bi-arrow-left"></i> Çıkış</button>
                <div class="progress flex-grow-1 mx-3" style="height: 6px;">
                    <div class="progress-bar bg-primary rounded-pill" role="progressbar" style="width: ${progress}%"></div>
                </div>
                <small class="text-muted fw-bold">${this.currentFlashcardIndex + 1}/${words.length}</small>
            </div>

            <div class="flashcard-container mb-4">
                <div class="flashcard" onclick="this.classList.toggle('flipped')">
                    <div class="flashcard-inner">
                        <div class="flashcard-front">
                            ${currentWord.image ? `<img src="${currentWord.image}" class="img-fluid rounded-3 mb-3 shadow-sm" style="max-height: 200px; object-fit: contain;">` : ''}
                            <h2 class="display-4 fw-bold mb-3">${currentWord.word}</h2>
                            <span class="badge bg-light text-dark border">${currentWord.tags?.[0] || 'Genel'}</span>
                            <button class="btn btn-icon btn-lg text-primary mt-3 d-block mx-auto" onclick="event.stopPropagation(); UI.speak('${currentWord.word}')"><i class="bi bi-volume-up-fill display-6"></i></button>
                            <small class="text-muted mt-4 d-block"><i class="bi bi-arrow-repeat"></i> Çevirmek için dokun</small>
                        </div>
                        <div class="flashcard-back">
                            <h3 class="fw-bold mb-3">${currentWord.meaning}</h3>
                            <p class="px-3 fst-italic opacity-75">"${currentWord.example || ''}"</p>
                            ${currentWord.image ? `<img src="${currentWord.image}" class="img-fluid rounded-3 mt-3 shadow-sm opacity-50" style="max-height: 100px;">` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <div class="flashcard-controls row g-2">
                <div class="col-3">
                    <button class="btn btn-danger w-100 py-3" onclick="UI.handleSRSResult('${currentWord.id}', 1)">
                        <i class="bi bi-emoji-dizzy d-block fs-4"></i>
                        <small>Unuttum</small>
                    </button>
                </div>
                <div class="col-3">
                    <button class="btn btn-warning w-100 py-3 text-dark" onclick="UI.handleSRSResult('${currentWord.id}', 2)">
                        <i class="bi bi-emoji-neutral d-block fs-4"></i>
                        <small>Zor</small>
                    </button>
                </div>
                <div class="col-3">
                    <button class="btn btn-success w-100 py-3" onclick="UI.handleSRSResult('${currentWord.id}', 3)">
                         <i class="bi bi-emoji-smile d-block fs-4"></i>
                        <small>İyi</small>
                    </button>
                </div>
                <div class="col-3">
                    <button class="btn btn-primary w-100 py-3" onclick="UI.handleSRSResult('${currentWord.id}', 5)">
                         <i class="bi bi-emoji-sunglasses d-block fs-4"></i>
                        <small>Kolay</small>
                    </button>
                </div>
            </div>
        `;
    },

    handleSRSResult(id, quality) {
        Store.updateSRS(id, quality);
        this.handleFlashcardResult(id, quality >= 3);
    },

    handleFlashcardResult(id, isCorrect) {
        Store.updateWordStats(id, isCorrect);
        this.currentFlashcardIndex++;
        const container = document.getElementById('view-flashcards');
        if (container) this.renderFlashcards(container);
        else if (document.getElementById('view-test')) this.renderTest(document.getElementById('view-test')); // Safety
        else this.renderFlashcards(document.querySelector('.view-section.active'));
    },

    resetFlashcards() {
        this.currentFlashcardIndex = 0;
        this.renderFlashcards(document.querySelector('.view-section.active'));
    },

    // --- Test Module ---
    testSession: [],
    currentTestIndex: 0,
    testScore: 0,

    renderTest(container) {
        if (this.currentTestIndex === 0 || !this.testSession.length) {
            this.currentTestIndex = 0;
            this.testScore = 0;
            this.testSession = [...Store.state.words].sort(() => 0.5 - Math.random()).slice(0, 10); // Take max 10
        }

        const words = this.testSession;

        if (words.length === 0) {
            container.innerHTML = this.getEmptyStateHtml();
            return;
        }

        if (this.currentTestIndex >= words.length) {
            container.innerHTML = this.getCompletionStateHtml('test', this.testScore, words.length);
            return;
        }

        const currentWord = words[this.currentTestIndex];
        const progress = ((this.currentTestIndex + 1) / words.length) * 100;

        // Generate options: 1 correct, 3 random incorrect
        const options = this.generateTestOptions(currentWord);

        container.innerHTML = `
             <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-sm btn-icon" onclick="UI.switchView('home')"><i class="bi bi-arrow-left"></i> Çıkış</button>
                <div class="progress flex-grow-1 mx-3" style="height: 6px;">
                    <div class="progress-bar bg-danger rounded-pill" role="progressbar" style="width: ${progress}%"></div>
                </div>
                <small class="text-muted fw-bold">${this.currentTestIndex + 1}/${words.length}</small>
            </div>
            
            <div class="text-center py-4">
                <span class="badge bg-danger bg-opacity-10 text-danger mb-2">Test Modu</span>
                <h1 class="fw-bold mb-4">${currentWord.word}</h1>
                <p class="text-muted">Aşağıdakilerden hangisi bu kelimenin anlamıdır?</p>
            </div>

            <div class="d-grid gap-3">
                ${options.map(opt => `
                    <button class="btn btn-lg btn-light border shadow-sm text-start p-3" onclick="UI.handleTestAnswer('${currentWord.id}', '${opt}', this)">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        `;
    },

    generateTestOptions(correctWord) {
        const allMeanings = Store.state.words.map(w => w.meaning).filter(m => m !== correctWord.meaning);
        const distractors = allMeanings.sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [...distractors, correctWord.meaning].sort(() => 0.5 - Math.random());
        return options;
    },

    handleTestAnswer(id, selectedAnswer, btnElement) {
        const currentWord = this.testSession[this.currentTestIndex];
        const isCorrect = currentWord.meaning === selectedAnswer;

        // Visual Feedback
        if (isCorrect) {
            btnElement.classList.replace('btn-light', 'btn-success');
            btnElement.classList.add('text-white');
            this.testScore++;
            Store.updateWordStats(id, true);
            AudioMgr.play('correct');
        } else {
            btnElement.classList.replace('btn-light', 'btn-danger'); // Fix: replace class correctly or just add if not present
            btnElement.classList.add('text-white');
            Store.updateWordStats(id, false);
            AudioMgr.play('incorrect');

            // Highlight correct one
            const buttons = btnElement.parentElement.querySelectorAll('button');
            buttons.forEach(b => {
                if (b.textContent.trim() === currentWord.meaning) {
                    b.classList.replace('btn-light', 'btn-success');
                    b.classList.add('text-white');
                }
            });
        }

        // Delay for next question
        setTimeout(() => {
            this.currentTestIndex++;
            this.renderTest(document.querySelector('.view-section.active'));
        }, 1500);
    },

    resetTest() {
        this.currentTestIndex = 0;
        this.renderTest(document.querySelector('.view-section.active'));
    },

    // --- Helpers ---
    getEmptyStateHtml() {
        return `
            <div class="text-center py-5">
                <i class="bi bi-emoji-frown fs-1 text-muted"></i>
                <h4 class="mt-3">Kelime Bulunamadı</h4>
                <p class="text-muted">Lütfen önce kelime ekleyin.</p>
                <button class="btn btn-primary rounded-pill" onclick="UI.switchView('add')">Kelime Ekle</button>
            </div>
        `;
    },

    getCompletionStateHtml(type, score, total) {
        let msg = 'Tüm kartları tamamladın.';
        let title = 'Tebrikler!';
        if (type === 'test') {
            const percentage = (score / total) * 100;
            title = percentage > 70 ? 'Harika İş!' : 'Tekrar Yapmalısın';
            msg = `Test Sonucu: ${score} / ${total}`;
        }

        return `
            <div class="text-center py-5">
                <i class="bi bi-trophy-fill fs-1 text-warning"></i>
                <h2 class="mt-3 fw-bold">${title}</h2>
                <p class="text-muted">${msg}</p>
                <div class="d-flex justify-content-center gap-2 mt-4">
                    <button class="btn btn-outline-primary rounded-pill" onclick="UI.${type === 'test' ? 'resetTest' : 'resetFlashcards'}()">Tekrar Et</button>
                    <button class="btn btn-primary rounded-pill" onclick="UI.switchView('home')">Ana Sayfa</button>
                </div>
            </div>
        `;
    },

    startListeningGame() {
        const container = document.querySelector('.view-section.active');
        if (container) this.renderListening(container);
    },

    // --- Helper Methods ---
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    updateHeaderPoints() {
        const el = document.getElementById('header-points');
        if (el) el.textContent = Store.state.user.points;
    },

    // --- GAMIFICATION & PACKS UI ---
    renderProfile(container) {
        const user = Store.state.user;
        const badges = user.achievements || [];

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <button class="btn btn-sm btn-icon" onclick="UI.switchView('home')"><i class="bi bi-chevron-left"></i></button>
                <h5 class="m-0 fw-bold">Profil</h5>
                <button class="btn btn-sm btn-icon" onclick="UI.switchView('settings')"><i class="bi bi-gear"></i></button>
            </div>

            <div class="text-center mb-4">
                <div class="position-relative d-inline-block mb-3">
                    <img src="${user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name}" 
                         class="rounded-circle border border-4 border-primary shadow" width="100" height="100" id="profile-avatar-preview">
                    <span class="position-absolute bottom-0 end-0 badge rounded-pill bg-warning text-dark border border-2 border-white">
                        ${user.rank || 'Çaylak'}
                    </span>
                    <label class="position-absolute bottom-0 start-0 btn btn-sm btn-light border rounded-circle shadow-sm p-1" style="cursor: pointer;">
                        <i class="bi bi-camera-fill text-primary"></i>
                        <input type="file" class="d-none" accept="image/*" onchange="UI.handleAvatarUpload(this)">
                    </label>
                </div>
                
                <div class="d-flex justify-content-center gap-2 mb-3 overflow-auto py-2" style="white-space: nowrap;">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Avatar${i}" 
                             class="rounded-circle border border-2 ${user.avatar && user.avatar.includes('Avatar' + i) ? 'border-primary' : 'border-transparent'} clickable hover-scale" 
                             width="40" height="40"
                             onclick="Store.updateProfile(null, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avatar${i}'); UI.renderProfile(document.querySelector('.view-section.active'))">
                    `).join('')}
                </div>

                <h3 class="fw-bold">${user.name}</h3>
                <p class="text-muted small">Katılım: ${new Date().toLocaleDateString('tr-TR')}</p>
            </div>

            <div class="card border-0 shadow-sm rounded-4 p-3 mb-3 bg-light">
                <div class="d-flex justify-content-between text-center">
                    <div>
                        <h5 class="fw-bold m-0 text-primary">${user.points}</h5>
                        <small class="text-muted">Puan</small>
                    </div>
                    <div>
                        <h5 class="fw-bold m-0 text-success">${Store.state.words.length}</h5>
                        <small class="text-muted">Kelime</small>
                    </div>
                    <div>
                        <h5 class="fw-bold m-0 text-danger">${user.stats.totalLearned || 0}</h5>
                        <small class="text-muted">Ezber</small>
                    </div>
                </div>
            </div>

            <h6 class="fw-bold mb-3">Başarımlar (${badges.length})</h6>
            <div class="row g-2 mb-4">
                ${badges.length > 0 ? badges.map(b => `
                    <div class="col-6">
                        <div class="p-2 border rounded-3 bg-white shadow-sm d-flex align-items-center gap-2">
                            <i class="bi bi-award-fill text-warning fs-4"></i>
                            <div style="line-height:1.2">
                                <small class="d-block fw-bold">${b.title}</small>
                                <span class="text-muted" style="font-size: 0.7rem">${b.desc}</span>
                            </div>
                        </div>
                    </div>
                `).join('') : '<div class="col-12 text-center text-muted small">Henüz başarım kilidi açılmadı.</div>'}
            </div>

            <button class="btn btn-primary w-100 rounded-pill py-3 mb-4 shadow" onclick="UI.renderPacks(document.querySelector('.view-section.active'))">
                <i class="bi bi-bag-plus-fill me-2"></i> Yeni Paket Ekle
            </button>

            <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">
                <div class="d-flex align-items-center gap-2 mb-3">
                    <i class="bi bi-sliders text-primary"></i>
                    <h6 class="fw-bold m-0">Ayarlar</h6>
                </div>
                
                <div class="mb-3">
                    <label class="form-label small text-muted fw-bold">Görünen İsim</label>
                    <input type="text" class="form-control bg-light border-0" value="${user.name}" 
                        onchange="Store.updateProfile(this.value, null)">
                </div>

                <div class="mb-3">
                    <label class="form-label small text-muted fw-bold mb-2">Tema Seçimi</label>
                    <div class="d-flex flex-wrap gap-2 justify-content-center">
                        ${['light', 'night', 'ocean', 'sunset', 'forest', 'coffee', 'rose', 'cyber', 'luxury', 'terminal'].map(t => `
                            <button class="btn p-0 rounded-circle border border-2 ${user.theme === t ? 'border-primary' : 'border-transparent'} shadow-sm" 
                                style="width: 32px; height: 32px; overflow:hidden;"
                                onclick="Store.setTheme('${t}'); UI.renderProfile(document.querySelector('.view-section.active'))">
                                <span class="d-block w-100 h-100" style="background-color: var(--theme-${t}-bg, #ccc);"></span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-volume-mute-fill text-muted"></i>
                        <span>Ses Efektleri</span>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch"
                            ${!user.settings.mute ? 'checked' : ''} 
                            onchange="Store.state.user.settings.mute = !this.checked; Store.save();">
                    </div>
                </div>
            </div>
        `;
    },

    renderPacks(container) {
        const packs = Store.getPacks();
        const installed = Store.state.packs || [];

        container.innerHTML = `
             <div class="d-flex justify-content-between align-items-center mb-4">
                <button class="btn btn-sm btn-icon" onclick="UI.switchView('profile')"><i class="bi bi-chevron-left"></i></button>
                <h5 class="fw-bold m-0 text-primary">Kelime Market</h5>
                <div style="width: 32px;"></div>
            </div>
            
            <div class="d-grid gap-3">
                ${packs.map(pack => `
                    <div class="card border-0 shadow-sm rounded-4 p-3">
                        <div class="d-flex align-items-center gap-3">
                            <div class="p-3 rounded-circle bg-light text-primary">
                                <i class="bi ${pack.icon || 'bi-box-seam'} fs-4"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="fw-bold mb-1">${pack.title}</h6>
                                <p class="text-muted small m-0">${pack.description}</p>
                                <span class="badge bg-secondary bg-opacity-10 text-secondary mt-1">${pack.level}</span>
                            </div>
                            <button class="btn btn-sm ${installed.includes(pack.id) ? 'btn-success disabled' : 'btn-primary'}" 
                                onclick="UI.handleImportPack('${pack.id}', this)">
                                ${installed.includes(pack.id) ? '<i class="bi bi-check-lg"></i>' : 'İndir'}
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    handleAvatarUpload(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result;
                Store.updateProfile(null, base64);
                // Update preview immediately
                const img = document.getElementById('profile-avatar-preview');
                if (img) img.src = base64;
            };
            reader.readAsDataURL(input.files[0]);
        }
    },

    handleImportPack(packId, btn) {
        if (btn.classList.contains('disabled')) return;

        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        setTimeout(() => {
            const addedCount = Store.importPack(packId);
            btn.className = 'btn btn-sm btn-success disabled';
            btn.innerHTML = '<i class="bi bi-check-lg"></i>';
            alert(`${addedCount} yeni kelime eklendi!`);
        }, 500);
    },

    // --- Dynamic Reading Generator ---
    // --- Dynamic Reading Generator ---
    // --- Dynamic Reading Generator ---
    generateReadingContent(chunk, index) {
        const title = `Bölüm ${index + 1}: ${chunk[0].word} - ${chunk[chunk.length - 1].word}`;

        let enText = "";
        let trText = "";

        // Template Libraries for sentence generation
        const templates = [
            { en: (w) => `The concept of ${w} is often discussed.`, tr: (m) => `${m} kavramı sıklıkla tartışılır.` },
            { en: (w) => `We need to understand ${w} deeply.`, tr: (m) => `${m} konusunu derinlemesine anlamalıyız.` },
            { en: (w) => `Many researchers focus on ${w}.`, tr: (m) => `Pek çok araştırmacı ${m} üzerine odaklanmaktadır.` },
            { en: (w) => `This example demonstrates ${w} clearly.`, tr: (m) => `Bu örnek ${m} kavramını açıkça göstermektedir.` },
            { en: (w) => `Can we define ${w} in this context?`, tr: (m) => `Bu bağlamda ${m} kavramını tanımlayabilir miyiz?` },
            { en: (w) => `The impact of ${w} is significant.`, tr: (m) => `${m} etkisinin önemi büyüktür.` },
            { en: (w) => `Usually, ${w} plays a vital role.`, tr: (m) => `Genellikle ${m} hayati bir rol oynar.` },
            { en: (w) => `It is hard to ignore ${w}.`, tr: (m) => `${m} gerçeğini görmezden gelmek zordur.` },
            { en: (w) => `Experts say that ${w} is changing.`, tr: (m) => `Uzmanlar ${m} durumunun değiştiğini söylüyor.` },
            { en: (w) => `Without ${w}, the system fails.`, tr: (m) => `${m} olmadan sistem başarısız olur.` },
            { en: (w) => `Let's consider the aspects of ${w}.`, tr: (m) => `Hadi ${m} yönlerini ele alalım.` },
            { en: (w) => `The true meaning of ${w} remains debated.`, tr: (m) => `${m} kelimesinin gerçek anlamı tartışılmaya devam ediyor.` },
            { en: (w) => `Historically, ${w} was quite common.`, tr: (m) => `Tarihsel olarak ${m} oldukça yaygındı.` },
            { en: (w) => `We witnessed ${w} in recent studies.`, tr: (m) => `Son çalışmalarda ${m} olgusuna tanık olduk.` },
            { en: (w) => `A lack of ${w} can be problematic.`, tr: (m) => `${m} eksikliği sorunlu olabilir.` }
        ];

        chunk.forEach(w => {
            // Pick a random template
            const t = templates[Math.floor(Math.random() * templates.length)];

            enText += t.en(w.word) + " ";
            trText += t.tr(w.meaning) + " ";
        });

        // Add a clear Vocabulary List at the bottom as requested
        trText += `
            <div class="mt-4 pt-3 border-top">
                <h6 class="fw-bold text-muted mb-2"><i class="bi bi-list-ul me-1"></i> Kelime Listesi</h6>
                <div class="small">
                    ${chunk.map(w => `<span class="d-inline-block me-3 mb-1"><b>${w.word}</b>: ${w.meaning}</span>`).join('')}
                </div>
            </div>
        `;

        // Mock "Related Words" relative to the chunk topic
        const related = chunk.slice(0, 5).map(w => ({ word: w.meaning, meaning: w.word }));

        return {
            id: index,
            title: title,
            level: 'Dynamic',
            en: enText.trim(),
            tr: trText.trim(), // Now a full paragraph
            words: chunk,
            related: related
        };
    },

    renderParagraphMode(container) {
        const words = Store.state.words;
        const chunkSize = 20;
        const chunks = [];
        for (let i = 0; i < words.length; i += chunkSize) {
            chunks.push(words.slice(i, i + chunkSize));
        }

        if (chunks.length === 0) {
            container.innerHTML = this.getEmptyStateHtml();
            return;
        }

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <button class="btn btn-sm btn-icon" onclick="UI.switchView('learn')"><i class="bi bi-chevron-left"></i></button>
                <h5 class="fw-bold m-0 text-dark">Okuma Kütüphanesi</h5>
                <div class="d-flex gap-1">
                     <button class="btn btn-sm btn-outline-secondary" onclick="UI.changeFontSize(-1)"><i class="bi bi-dash"></i></button>
                     <button class="btn btn-sm btn-outline-secondary" onclick="UI.changeFontSize(1)"><i class="bi bi-plus"></i></button>
                </div>
            </div>
            
            <div class="row g-3">
                ${chunks.map((chunk, index) => {
            const preview = chunk.slice(0, 3).map(w => w.word).join(', ') + '...';
            return `
                    <div class="col-12">
                        <div class="card border-0 shadow-sm rounded-4 p-4 clickable hover-scale" onclick="UI.renderParagraphDetail(document.querySelector('.view-section.active'), ${index})">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="fw-bold mb-1">Set #${index + 1}</h5>
                                    <small class="text-muted"><i class="bi bi-layers me-1"></i>${chunk.length} Kelime: ${preview}</small>
                                </div>
                                <div class="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                                    <i class="bi bi-book-half fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;
    },

    // --- Word Network Logic ---
    openNetworkModal(wordText) {
        const wordObj = Store.state.words.find(w => w.word === wordText);
        if (!wordObj) return;

        // Mock Related Words: Get 5-8 random words from the same tag or random
        let related = Store.state.words
            .filter(w => w.word !== wordText) // Exclude self
            .sort(() => Math.random() - 0.5) // Shuffle
            .slice(0, 8); // Take 8

        const container = document.getElementById('network-cloud-container');
        const titleEl = document.getElementById('networkModalTitle');
        // UPDATE: Show meaning in title as requested
        if (titleEl) titleEl.innerText = `${wordObj.word} : ${wordObj.meaning}`;

        if (container) {
            container.innerHTML = related.map(w => {
                const size = Math.floor(Math.random() * 3) + 1; // 1 to 3
                const colors = ['primary', 'success', 'info', 'warning', 'danger'];
                const color = colors[Math.floor(Math.random() * colors.length)];

                return `
                    <div class="position-relative d-inline-block m-2 text-center p-3 rounded-circle border border-${color} bg-${color} bg-opacity-10 clickable hover-scale"
                         style="width: ${80 + size * 10}px; height: ${80 + size * 10}px; display: flex; align-items: center; justify-content: center; flex-direction: column;"
                         onclick="this.querySelector('.translation').classList.toggle('d-none')">
                        <span class="fw-bold text-dark small">${w.word}</span>
                        <span class="translation text-muted small mt-1 fw-bold">${w.meaning}</span>
                    </div>
                `;
            }).join('');
        }

        // Show Modal
        const modalEl = document.getElementById('wordNetworkModal');
        if (modalEl) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        } else {
            console.error('Word Network Modal not found!');
        }
    },

    renderParagraphDetail(container, index) {
        const words = Store.state.words;
        const chunkSize = 20;
        const start = index * chunkSize;
        const chunk = words.slice(start, start + chunkSize);

        // Generate content on the fly
        const content = this.generateReadingContent(chunk, index);

        // Highlight words logic - Make them CLICKABLE for the Network Cloud
        let formattedText = content.en;
        content.words.forEach(w => {
            const regex = new RegExp(`\\b${w.word}\\b`, 'gi');
            formattedText = formattedText.replace(regex, match =>
                `<strong class="text-primary border-bottom border-primary clickable" onclick="UI.openNetworkModal('${w.word}')">${match}</strong>`
            );
        });

        // Add helper to window if not exists
        if (!window.toggleTranslation) {
            window.toggleTranslation = () => {
                const el = document.getElementById('tr-text');
                if (el) el.classList.toggle('d-none');
            };
        }

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-sm btn-icon" onclick="UI.renderParagraphMode(document.querySelector('.view-section.active'))"><i class="bi bi-chevron-left"></i></button>
                <h5 class="fw-bold m-0 text-dark w-100 text-center">${content.title}</h5>
                <button class="btn btn-sm btn-outline-primary rounded-pill ms-2" onclick="UI.renderClozeMode(document.querySelector('.view-section.active'), ${index})">Boşluk Doldurma</button>
            </div>

            <div class="card border-0 shadow-sm rounded-4 p-4 mb-3 bg-white">
                <div class="d-flex justify-content-between mb-3 border-bottom pb-2">
                    <button class="btn btn-sm btn-light rounded-circle" onclick="AudioMgr.play('${content.en.substring(0, 30).replace(/'/g, "")}')">
                         <i class="bi bi-volume-up-fill"></i>
                    </button>
                    <button class="btn btn-sm btn-link text-decoration-none" onclick="window.toggleTranslation()">Türkçesini Gör</button>
                </div>
                
                <p class="fs-5 lh-lg text-justify mb-3" style="font-family: 'Georgia', serif;">
                    ${formattedText}
                </p>
                <div id="tr-text" class="fs-6 lh-base text-muted d-none border-top pt-3 fst-italic">
                    ${content.tr}
                </div>
            </div>

            <div class="alert alert-light border small text-muted mb-4">
                <i class="bi bi-info-circle-fill text-primary me-2"></i>
                Metindeki <b>mavi</b> kelimelere tıklayarak detaylı <b>Kelime Ağı</b>'nı görebilirsiniz.
            </div>

            <h6 class="fw-bold mb-2 ps-2">Bu Bölümdeki Kelimeler</h6>
            <div class="d-flex flex-wrap gap-2 mb-4">
                 ${content.words.map(w => `
                     <span class="badge bg-white border text-dark p-2 fw-normal clickable hover-scale" 
                           onclick="this.innerText === '${w.word}' ? this.innerText = '${w.meaning}' : this.innerText = '${w.word}'"
                           title="Anlamını görmek için tıkla">
                        <i class="bi bi-search me-1 text-primary"></i>${w.word}
                     </span>
                 `).join('')}
            </div>
        `;
    },

    renderClozeMode(container, index) {
        const words = Store.state.words;
        const chunkSize = 20;
        const start = index * chunkSize;
        const chunk = words.slice(start, start + chunkSize);
        const content = this.generateReadingContent(chunk, index);

        let clozeText = content.en;
        let blankId = 0;
        content.words.forEach(w => {
            const regex = new RegExp(`\\b${w.word}\\b`, 'gi');
            // Create a specific clickable blank
            clozeText = clozeText.replace(regex, `<span class="cloze-blank d-inline-block border-bottom border-2 border-primary text-primary fw-bold px-3 mx-1 clickable bg-primary bg-opacity-10" id="blank-${blankId}" onclick="UI.handleBlankClick(${blankId})" data-answer="${w.word.toLowerCase()}">____</span>`);
            blankId++;
        });

        // Setup state for the game
        this.clozeState = {
            selectedBlankId: null,
            score: 0,
            total: blankId
        };

        // Define helpers
        UI.handleBlankClick = (id) => {
            // Reset previous
            document.querySelectorAll('.cloze-blank').forEach(el => el.classList.remove('bg-warning'));

            UI.clozeState.selectedBlankId = id;
            const el = document.getElementById(`blank-${id}`);
            el.classList.add('bg-warning');

            // Provide visual feedback that blank is selected
            AudioMgr.play('click');
        };

        UI.handleWordBankClick = (word) => {
            if (UI.clozeState.selectedBlankId === null) {
                alert('Lütfen önce metin içindeki boşluklardan birini seçin.');
                return;
            }

            const blankEl = document.getElementById(`blank-${UI.clozeState.selectedBlankId}`);
            const correctWord = blankEl.dataset.answer;

            if (word.toLowerCase() === correctWord) {
                blankEl.textContent = word;
                blankEl.classList.remove('bg-warning', 'bg-primary', 'text-primary');
                blankEl.classList.add('bg-success', 'text-white', 'rounded');
                blankEl.onclick = null; // Disable clicking
                UI.clozeState.score++;
                UI.clozeState.selectedBlankId = null;
                AudioMgr.play('win');

                // Remove word from bank visually
                const bankBtn = document.getElementById(`bank-btn-${word}`);
                if (bankBtn) bankBtn.classList.add('opacity-25', 'disabled');

                if (UI.clozeState.score === UI.clozeState.total) {
                    setTimeout(() => alert('Tebrikler! Bölümü tamamladınız.'), 500);
                }
            } else {
                blankEl.classList.add('shake-anim');
                setTimeout(() => blankEl.classList.remove('shake-anim'), 500);
                AudioMgr.play('incorrect');
            }
        };

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-sm btn-icon" onclick="UI.renderParagraphDetail(document.querySelector('.view-section.active'), ${index})"><i class="bi bi-chevron-left"></i></button>
                <h5 class="fw-bold m-0 text-dark">Boşluk Doldurma</h5>
                 <div style="width: 32px;"></div>
            </div>

            <div class="alert alert-info small py-2 mb-3">
                <i class="bi bi-info-circle me-1"></i> Önce metindeki <b>____</b> boşluğa tıklayın, sonra aşağıdaki kelimelerden doğru olanı seçin.
            </div>

            <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <p class="fs-5 lh-lg text-justify mb-0" style="font-family: 'Georgia', serif;">
                    ${clozeText}
                </p>
            </div>
            
            <h6 class="fw-bold mb-2 ps-2">Kelime Bankası</h6>
            <div class="d-flex flex-wrap gap-2 justify-content-center p-3 bg-light rounded-4">
                ${chunk.sort(() => Math.random() - 0.5).map(w => `
                    <button id="bank-btn-${w.word}" class="btn btn-outline-primary rounded-pill fw-bold" onclick="UI.handleWordBankClick('${w.word}')">
                        ${w.word}
                    </button>
                `).join('')}
            </div>
        `;
    },

    changeFontSize(delta) {
        const root = document.documentElement;
        const currentSize = parseFloat(getComputedStyle(root).getPropertyValue('--font-scale') || 1);
        const newSize = Math.max(0.8, Math.min(1.4, currentSize + (delta * 0.1)));

        root.style.setProperty('--font-scale', newSize);
    },
};

// Expose UI to Global Scope
window.Store = Store;
window.UI = UI;

// --- APP INIT ---


// --- APP INITIALIZATION ---
// --- APP INITIALIZATION ---
const initApp = () => {
    try {
        console.log('App Initializing...');

        // Safety check for localStorage corruption
        try {
            const test = localStorage.getItem('yds_data');
            if (test && !test.startsWith('{') && !test.startsWith('[')) {
                console.warn('Corrupted data detected, resetting...');
                localStorage.removeItem('yds_data');
            }
        } catch (e) {
            console.error('Storage check failed:', e);
        }

        Store.init();
        UI.init();

        // Basic Routing/Navigation
        const navButtons = document.querySelectorAll('.nav-btn');

        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.currentTarget;
                const target = button.dataset.target;

                console.log('Nav Click:', target);

                if (target === 'add') {
                    UI.showAddModal();
                    return;
                }

                navButtons.forEach(b => b.classList.remove('active'));
                if (!button.classList.contains('center-fab')) {
                    button.classList.add('active');
                }

                // Switch View
                UI.switchView(target);
            });
        });

        // Render Initial View (Home)
        UI.renderHome();

    } catch (error) {
        console.error('Init Failed:', error);
        // Manually trigger the global error handler we added to HTML
        if (window.onerror) {
            window.onerror(error.message, 'main.js', 0, 0, error);
        }
    }
};

// Start App
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

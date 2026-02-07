import { Store } from './store.js';

export const UI = {
    init() {
        this.bindEvents();
        this.updateHeader();
    },

    bindEvents() {
        // Theme Toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            Store.toggleTheme();
        });

        // Add Word Form Submit
        document.getElementById('add-word-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddWord(e.target);
        });

        // Listen for store updates
        document.addEventListener('store-updated', () => {
            this.updateHeader();
            // Re-render current view if necessary
            if (document.getElementById('view-home')?.offsetParent) this.renderHome();
            if (document.getElementById('view-vocab')?.offsetParent) this.renderVocabList();
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

        // Map 'learn' nav to 'vocab' view for now, or keep separate
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
            case 'games':
                viewDiv.innerHTML = '<div class="text-center py-5"><h1>🎮 Oyunlar</h1><p class="text-muted">Yakında Eklenecek...</p></div>';
                break;
            case 'profile':
                viewDiv.innerHTML = '<div class="text-center py-5"><h1>👤 Profil</h1><p class="text-muted">Yakında Eklenecek...</p></div>';
                break;
        }
    },

    updateHeader() {
        if (document.getElementById('header-points')) {
            document.getElementById('header-points').textContent = Store.state.user.points;
        }
    },

    renderHome(container = document.getElementById('view-home')) {
        if (!container) return;
        const wordCount = Store.state.words.length;
        const todaysWord = Store.state.words.length > 0 ? Store.state.words[0] : null;

        container.innerHTML = `
            <div class="row g-3">
                <!-- Welcome Card -->
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

                <!-- Quick Actions -->
                <div class="col-6">
                    <div class="custom-card p-3 h-100 d-flex flex-column align-items-center justify-content-center text-center clickable" onclick="UI.startModule('flashcards')">
                        <div class="bg-primary bg-opacity-10 p-3 rounded-circle mb-2">
                            <i class="bi bi-stack text-primary fs-3"></i>
                        </div>
                        <h6 class="fw-bold m-0">Kartlar</h6>
                    </div>
                </div>
                <div class="col-6">
                    <div class="custom-card p-3 h-100 d-flex flex-column align-items-center justify-content-center text-center clickable" onclick="UI.startModule('test')">
                        <div class="bg-danger bg-opacity-10 p-3 rounded-circle mb-2">
                            <i class="bi bi-ui-checks text-danger fs-3"></i>
                        </div>
                        <h6 class="fw-bold m-0">Test Çöz</h6>
                    </div>
                </div>

                <!-- Daily Word -->
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

    renderVocabList(container = document.getElementById('view-vocab')) {
        if (!container) return;
        const words = Store.state.words;

        let listHtml = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="fw-bold m-0">Kelimelerim</h4>
                <div class="badge bg-primary rounded-pill">${words.length}</div>
            </div>
            
            <div class="input-group mb-3">
                <span class="input-group-text bg-white border-end-0"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control border-start-0" placeholder="Kelime ara...">
            </div>

            <div class="vocab-list pb-5">
        `;

        if (words.length === 0) {
            listHtml += `<div class="text-center text-muted py-5"><i class="bi bi-inbox fs-1"></i><p>Henüz kelime eklenmemiş.</p></div>`;
        } else {
            words.forEach(word => {
                listHtml += `
                    <div class="custom-card p-3 mb-2 d-flex justify-content-between align-items-center">
                        <div>
                            <div class="d-flex align-items-center gap-2">
                                <h5 class="fw-bold m-0 text-primary">${word.word}</h5>
                                <span class="badge bg-light text-dark border">${word.tags?.[0] || 'Genel'}</span>
                            </div>
                            <small class="text-muted">${word.meaning}</small>
                        </div>
                        <button class="btn btn-icon text-danger" onclick="UI.deleteWord('${word.id}')"><i class="bi bi-trash"></i></button>
                    </div>
                `;
            });
        }

        listHtml += `</div>`;
        container.innerHTML = listHtml;
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
        const word = {
            word: form.querySelector('#inputWord').value,
            meaning: form.querySelector('#inputMeaning').value,
            example: form.querySelector('#inputExample').value,
            tags: [form.querySelector('#inputTag').value]
        };

        Store.addWord(word);

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
                <button class="btn-danger text-white" onclick="UI.handleFlashcardResult('${currentWord.id}', false)">
                    <i class="bi bi-x-lg fs-4"></i>
                </button>
                <button class="btn-success text-white" onclick="UI.handleFlashcardResult('${currentWord.id}', true)">
                    <i class="bi bi-check-lg fs-4"></i>
                </button>
            </div>
        `;
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
        } else {
            btnElement.classList.replace('btn-light', 'btn-danger');
            btnElement.classList.add('text-white');
            Store.updateWordStats(id, false);

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
    }
};

window.UI = UI;

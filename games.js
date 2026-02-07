// Simple Audio Manager for Games
const GamesAudioMgr = {
    play(type) {
        // Placeholder for real audio - just preventing crashes for now
        // In a real app, we would play sounds here
        console.log(`Playing sound: ${type}`);
    }
};

const GameData = {
    synonyms: [
        { word: "Abundant", synonym: "Plentiful", hint: "Starts with P", tr: "Bol, Bereketli" },
        { word: "Accurate", synonym: "Precise", hint: "Exact", tr: "Doğru, Kesin" },
        { word: "Achieve", synonym: "Accomplish", hint: "To finish successfully", tr: "Başarmak" },
        { word: "Active", synonym: "Energetic", hint: "Full of energy", tr: "Aktif, Enerjik" },
        { word: "Adamant", synonym: "Stubborn", hint: "Refusing to change mind", tr: "İnatçı, Kararlı" },
        { word: "Add", synonym: "Increase", hint: "To make bigger", tr: "Eklemek, Artırmak" },
        { word: "Adequate", synonym: "Sufficient", hint: "Enough", tr: "Yeterli" },
        { word: "Administer", synonym: "Manage", hint: "To control", tr: "Yönetmek, İdare etmek" },
        { word: "Admit", synonym: "Confess", hint: "To tell the truth", tr: "Kabul etmek, İtiraf etmek" },
        { word: "Advantage", synonym: "Benefit", hint: "A good thing", tr: "Avantaj, Yarar" },
        { word: "Afraid", synonym: "Scared", hint: "Fearful", tr: "Korkmuş" },
        { word: "Aggressive", synonym: "Assertive", hint: "Forceful", tr: "Agresif, Saldırgan" },
        { word: "Aid", synonym: "Help", hint: "Assist", tr: "Yardım etmek" },
        { word: "Always", synonym: "Forever", hint: "At all times", tr: "Her zaman, Daima" },
        { word: "Amateur", synonym: "Beginner", hint: "Not professional", tr: "Amatör, Acemi" },
        { word: "Ambitions", synonym: "Aspirations", hint: "Goals", tr: "Hırs, Amaç" },
        { word: "Antagonize", synonym: "Provoke", hint: "To make angry", tr: "Düşman etmek, Kışkırtmak" },
        { word: "Apparent", synonym: "Obvious", hint: "Clear to see", tr: "Bariz, Belirgin" },
        { word: "Approve", synonym: "Accept", hint: "To agree", tr: "Onaylamak" },
        { word: "Arrive", synonym: "Reach", hint: "To get to a place", tr: "Varmak, Ulaşmak" },
        { word: "Arrogant", synonym: "Haughty", hint: "Proud", tr: "Kibirli" },
        { word: "Artificial", synonym: "Synthetic", hint: "Not natural", tr: "Yapay, Suni" },
        { word: "Ask", synonym: "Inquire", hint: "To question", tr: "Sormak" },
        { word: "Attain", synonym: "Acquire", hint: "To get", tr: "Elde etmek" },
        { word: "Authentic", synonym: "Genuine", hint: "Real", tr: "Özgün, Hakiki" },
        { word: "Average", synonym: "Mediocre", hint: "Normal", tr: "Ortalama" },
        { word: "Awful", synonym: "Dreadful", hint: "Very bad", tr: "Berbat, Korkunç" },
        { word: "Awkward", synonym: "Clumsy", hint: "Not graceful", tr: "Tuhaf, Sakar" },
        { word: "Ban", synonym: "Prohibit", hint: "To forbid", tr: "Yasaklamak" },
        { word: "Barren", synonym: "Infertile", hint: "Empty", tr: "Çorak, Verimsiz" },
        { word: "Bashful", synonym: "Shy", hint: "Timid", tr: "Utangaç" },
        { word: "Beautiful", synonym: "Pretty", hint: "Lovely", tr: "Güzel" },
        { word: "Begin", synonym: "Start", hint: "Commence", tr: "Başlamak" },
        { word: "Behavior", synonym: "Conduct", hint: "Actions", tr: "Davranış" },
        { word: "Believe", synonym: "Trust", hint: "Have faith", tr: "İnanmak" },
        { word: "Beneficial", synonym: "Helpful", hint: "Good for you", tr: "Faydalı" },
        { word: "Best", synonym: "Finest", hint: "Top quality", tr: "En iyi" },
        { word: "Bewilder", synonym: "Confuse", hint: "Puzzle", tr: "Şaşırtmak, Kafasını karıştırmak" },
        { word: "Big", synonym: "Vast", hint: "Huge", tr: "Büyük" },
        { word: "Bizarre", synonym: "Weird", hint: "Strange", tr: "Tuhaf, Garip" },
        { word: "Blend", synonym: "Mix", hint: "Combine", tr: "Karıştırmak, Harmanlamak" },
        { word: "Bold", synonym: "Brave", hint: "Courageous", tr: "Cesur" },
        { word: "Bossy", synonym: "Controlling", hint: "Domineering", tr: "Otoriter, Patronluk taslayan" },
        { word: "Brief", synonym: "Concise", hint: "Short", tr: "Kısa, Öz" },
        { word: "Broad", synonym: "Wide", hint: "Large", tr: "Geniş" },
        { word: "Bustle", synonym: "Commotion", hint: "Busy activity", tr: "Telaş, Hareketlilik" },
        { word: "Busy", synonym: "Occupied", hint: "Not free", tr: "Meşgul" },
        { word: "Calculate", synonym: "Compute", hint: "Math", tr: "Hesaplamak" },
        { word: "Call", synonym: "Shout", hint: "Yell", tr: "Çağırmak, Bağırmak" },
        { word: "Calm", synonym: "Peaceful", hint: "Quiet", tr: "Sakin" },
        { word: "Care", synonym: "Concern", hint: "Worry", tr: "Önemsemek, Bakım" },
        { word: "Careful", synonym: "Cautious", hint: "Watchful", tr: "Dikkatli" }
    ],
    prepositions: [
        { sentence: "She was accused ___ stealing the money.", answer: "of", options: ["of", "with", "for", "about"], hint: "To charge with a fault" },
        { sentence: "I am not afraid ___ spiders.", answer: "of", options: ["of", "from", "at", "by"], hint: "Feeling fear" },
        { sentence: "He is interested ___ learning new languages.", answer: "in", options: ["in", "on", "at", "for"], hint: "Wanting to know more" },
        { sentence: "Success depends ___ hard work.", answer: "on", options: ["on", "in", "to", "of"], hint: "Relying on" },
        { sentence: "They are aware ___ the potential risks.", answer: "of", options: ["of", "to", "in", "with"], hint: "Knowing about" },
        { sentence: "The book is full ___ useful information.", answer: "of", options: ["of", "with", "by", "for"], hint: "Containing a lot" },
        { sentence: "She is good ___ playing the piano.", answer: "at", options: ["at", "in", "on", "with"], hint: "Skilled" },
        { sentence: "We are proud ___ your achievements.", answer: "of", options: ["of", "for", "with", "about"], hint: "Feeling pleasure" },
        { sentence: "He apologized ___ his mistake.", answer: "for", options: ["for", "to", "at", "on"], hint: "Saying sorry" },
        { sentence: "I am fed up ___ this weather.", answer: "with", options: ["with", "of", "from", "by"], hint: "Bored or annoyed" },
        { sentence: "The city is famous ___ its history.", answer: "for", options: ["for", "with", "about", "of"], hint: "Known for" },
        { sentence: "She is married ___ a doctor.", answer: "to", options: ["to", "with", "for", "by"], hint: "Wedded" },
        { sentence: "He is responsible ___ the project.", answer: "for", options: ["for", "of", "to", "with"], hint: "In charge of" },
        { sentence: "I am similar ___ my brother.", answer: "to", options: ["to", "with", "from", "of"], hint: "Alike" },
        { sentence: "She is tired ___ working late.", answer: "of", options: ["of", "from", "with", "by"], hint: "Exhausted" },
        { sentence: "He is capable ___ doing the job.", answer: "of", options: ["of", "to", "for", "in"], hint: "Able to" },
        { sentence: "I am accustomed ___ hot weather.", answer: "to", options: ["to", "with", "for", "in"], hint: "Used to" },
        { sentence: "The car belongs ___ me.", answer: "to", options: ["to", "with", "for", "of"], hint: "Owned by" },
        { sentence: "She is excited ___ the trip.", answer: "about", options: ["about", "for", "with", "of"], hint: "Looking forward to" },
        { sentence: "He is keen ___ football.", answer: "on", options: ["on", "in", "at", "to"], hint: "Enthusiastic" }
    ]
};

const Games = {
    // --- SYNONYM MATCHING GAME ---
    synonymScore: 0,
    synonymLevel: 1,
    synonymTimeLeft: 60,
    synonymTimer: null,
    synonymPairs: [],
    selectedSynonym: null,

    startSynonymGame(container) {
        if (!container) container = document.querySelector('.view-section.active');
        this.synonymScore = 0;
        this.synonymLevel = 1;
        this.startSynonymLevel(container);
    },

    startSynonymLevel(container) {
        if (!container) container = document.querySelector('.view-section.active');
        this.synonymTimeLeft = 60 - (this.synonymLevel * 5); // Less time each level
        if (this.synonymTimeLeft < 20) this.synonymTimeLeft = 20;

        // Progressive difficulty simulation: Just random for now as we don't have tagged data
        const allPairs = [...GameData.synonyms].sort(() => 0.5 - Math.random());
        // Level 1: 3 pairs, Level 2: 4 pairs, Level 3+: 5 pairs
        const pairCount = this.synonymLevel === 1 ? 3 : (this.synonymLevel === 2 ? 4 : 5);
        this.synonymPairs = allPairs.slice(0, pairCount);

        this.renderSynonymGame(container);
        this.startSynonymTimer(container);
    },

    startSynonymTimer(container) {
        if (this.synonymTimer) clearInterval(this.synonymTimer);
        this.synonymTimer = setInterval(() => {
            this.synonymTimeLeft--;
            const timerEl = document.getElementById('synonym-timer');
            if (timerEl) timerEl.textContent = this.synonymTimeLeft;

            if (this.synonymTimeLeft <= 0) {
                clearInterval(this.synonymTimer);
                this.finishSynonymGame(container, false); // Time out
            }
        }, 1000);
    },

    renderSynonymGame(container) {
        // Create cards
        let cards = [];
        this.synonymPairs.forEach(p => {
            // Pass Turkish meaning to card
            cards.push({ text: p.word, type: 'word', match: p.synonym, hint: p.hint, tr: p.tr });
            cards.push({ text: p.synonym, type: 'synonym', match: p.word, hint: p.hint, tr: p.tr });
        });
        cards = cards.sort(() => 0.5 - Math.random());

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-sm btn-icon" onclick="UI.switchView('games')"><i class="bi bi-arrow-left"></i> Çıkış</button>
                <div class="text-center">
                    <h5 class="m-0 fw-bold text-primary">Seviye ${this.synonymLevel}</h5>
                    <small class="text-muted">Synonym Matching</small>
                </div>
                <div class="badge bg-warning text-dark p-2 rounded-pill">
                    <i class="bi bi-clock-fill me-1"></i> <span id="synonym-timer">${this.synonymTimeLeft}</span>s
                </div>
            </div>

            <div class="alert alert-info py-2 px-3 small mb-3 text-center">
                <i class="bi bi-info-circle me-1"></i> 
                <span id="synonym-hint">Anlamını görmek için kartın üzerine gel!</span>
            </div>

            <div class="row g-2" id="synonym-grid">
                ${cards.map((card, index) => `
                    <div class="col-4 col-md-3">
                        <button class="btn btn-outline-dark w-100 h-100 py-3 fw-bold shadow-sm game-card position-relative" 
                                style="font-size: 0.9rem;"
                                title="${card.tr || ''}" 
                                onclick="Games.handleSynonymClick(this, '${card.text}', '${card.type}', '${card.hint}')">
                            ${card.text}
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    handleSynonymClick(btn, text, type, hint) {
        if (btn.disabled || btn.classList.contains('btn-success')) return;

        // Visual Selection
        if (this.selectedSynonym && this.selectedSynonym.element === btn) {
            this.selectedSynonym = null;
            btn.classList.remove('active', 'btn-primary', 'text-white');
            btn.classList.add('btn-outline-dark');
            return;
        }

        if (!this.selectedSynonym) {
            this.selectedSynonym = { text, element: btn };
            btn.classList.add('active', 'btn-primary', 'text-white');
            btn.classList.remove('btn-outline-dark');
            GamesAudioMgr.play('click');
        } else {
            const first = this.selectedSynonym;
            const second = { text, element: btn };

            const isPair = GameData.synonyms.some(pair =>
                (pair.word === first.text && pair.synonym === second.text) ||
                (pair.synonym === first.text && pair.word === second.text)
            );

            if (isPair) {
                first.element.classList.replace('btn-primary', 'btn-success');
                second.element.classList.replace('btn-outline-dark', 'btn-success');
                second.element.classList.add('text-white', 'btn-success');

                first.element.disabled = true;
                second.element.disabled = true;

                this.synonymScore += 10 * this.synonymLevel; // Multiplier
                GamesAudioMgr.play('correct');

                // Clear hint
                const hintEl = document.getElementById('synonym-hint');
                if (hintEl) hintEl.textContent = 'Harika!';

                const remaining = document.querySelectorAll('#synonym-grid button:not(:disabled)').length;
                if (remaining === 0) {
                    setTimeout(() => {
                        this.synonymLevel++;
                        this.startSynonymLevel(null);
                    }, 800);
                }
            } else {
                second.element.classList.add('btn-danger', 'text-white');
                first.element.classList.replace('btn-primary', 'btn-danger');
                GamesAudioMgr.play('incorrect');

                setTimeout(() => {
                    first.element.classList.remove('btn-danger', 'text-white', 'active');
                    first.element.classList.add('btn-outline-dark');
                    second.element.classList.remove('btn-danger', 'text-white');
                    second.element.classList.add('btn-outline-dark');
                }, 800);
            }
            this.selectedSynonym = null;
        }
    },

    finishSynonymGame(container, success = true) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-${success ? 'trophy' : 'hourglass-bottom'} fs-1 text-${success ? 'warning' : 'danger'}"></i>
                <h2 class="mt-3 fw-bold">${success ? 'Tebrikler!' : 'Süre Doldu!'}</h2>
                <h4 class="mb-2">Seviye: ${this.synonymLevel}</h4>
                <h4 class="mb-4">Puan: <span class="text-primary">${this.synonymScore}</span></h4>
                <div class="d-grid gap-2 col-8 mx-auto">
                    <button class="btn btn-primary rounded-pill" onclick="Games.startSynonymGame()">Tekrar Oyna</button>
                    <button class="btn btn-outline-secondary rounded-pill" onclick="UI.switchView('games')">Çıkış</button>
                </div>
            </div>
        `;
    },

    // --- PREPOSITION GAME ---
    prepScore: 0,
    prepLevel: 1,
    prepIndex: 0,
    prepQuestions: [],

    startPrepositionGame(container) {
        if (!container) container = document.querySelector('.view-section.active');
        this.prepScore = 0;
        this.prepLevel = 1;
        this.startPrepositionLevel(container);
    },

    startPrepositionLevel(container) {
        this.prepIndex = 0;
        // 5 questions per level
        this.prepQuestions = [...GameData.prepositions].sort(() => 0.5 - Math.random()).slice(0, 5);
        this.renderPrepositionGame(container);
    },

    renderPrepositionGame(container) {
        if (this.prepIndex >= this.prepQuestions.length) {
            // Level Complete
            this.finishPrepositionLevel(container);
            return;
        }

        const q = this.prepQuestions[this.prepIndex];

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <button class="btn btn-sm btn-icon" onclick="UI.switchView('games')"><i class="bi bi-arrow-left"></i> Çıkış</button>
                <div class="text-center">
                    <h5 class="m-0 fw-bold text-primary">Seviye ${this.prepLevel}</h5>
                    <small class="text-muted">Soru ${this.prepIndex + 1} / ${this.prepQuestions.length}</small>
                </div>
                <div class="badge bg-primary text-white p-2 rounded-pill">
                    Puan: ${this.prepScore}
                </div>
            </div>

             <div class="text-end mb-2">
                <button class="btn btn-sm btn-light text-muted" onclick="this.nextElementSibling.classList.remove('d-none'); this.remove();">
                    <i class="bi bi-lightbulb-fill text-warning"></i> İpucu Al (-5 Puan)
                </button>
                <div class="alert alert-warning small py-1 px-2 d-none d-inline-block m-0">
                    ${q.hint}
                </div>
            </div>

            <div class="card shadow border-0 rounded-4 p-4 text-center mb-4">
                <h4 class="fw-bold mb-4" style="line-height: 1.8;">
                    ${q.sentence.replace('___', '<span class="border-bottom border-3 border-primary px-3 text-primary">?</span>')}
                </h4>
            </div>

            <div class="row g-3">
                ${q.options.map(opt => `
                    <div class="col-6">
                         <button class="btn btn-lg btn-light border w-100 py-3 fw-bold" onclick="Games.handlePrepAnswer(this, '${opt}', '${q.answer}')">
                            ${opt}
                         </button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    handlePrepAnswer(btn, answer, correct) {
        if (answer === correct) {
            btn.classList.replace('btn-light', 'btn-success');
            btn.classList.add('text-white');
            this.prepScore += 10 * this.prepLevel;
            GamesAudioMgr.play('correct');

            setTimeout(() => {
                this.prepIndex++;
                this.renderPrepositionGame(document.querySelector('.view-section.active'));
            }, 1000);
        } else {
            btn.classList.replace('btn-light', 'btn-danger');
            btn.classList.add('text-white');
            GamesAudioMgr.play('incorrect');

            // Show correct answer then wait longer
            const buttons = btn.parentElement.parentElement.querySelectorAll('button');
            buttons.forEach(b => {
                if (b.innerText.trim() === correct) {
                    b.classList.replace('btn-light', 'btn-success');
                    b.classList.add('text-white');
                }
            });

            setTimeout(() => {
                this.prepIndex++;
                this.renderPrepositionGame(document.querySelector('.view-section.active'));
            }, 2000);
        }
    },

    finishPrepositionLevel(container) {
        container.innerHTML = `
             <div class="text-center py-5">
                <i class="bi bi-check-circle-fill fs-1 text-success"></i>
                <h2 class="mt-3 fw-bold">Seviye ${this.prepLevel} Tamamlandı!</h2>
                <h4 class="mb-4">Toplam Puan: ${this.prepScore}</h4>
                <div class="d-grid gap-2 col-8 mx-auto">
                    <button class="btn btn-primary rounded-pill" onclick="Games.startNextPrepLevel()">Sonraki Seviye</button>
                    <button class="btn btn-outline-secondary rounded-pill" onclick="UI.switchView('games')">Çıkış</button>
                </div>
            </div>
        `;
    },

    startNextPrepLevel() {
        this.prepLevel++;
        this.startPrepositionLevel(document.querySelector('.view-section.active'));
    }
};

export const Store = {
    state: {
        words: [],
        user: {
            points: 0,
            theme: 'light',
            completedTasks: []
        }
    },

    generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    init() {
        const savedData = localStorage.getItem('yds_data');
        if (savedData) {
            this.state = JSON.parse(savedData);
        } else {
            // Seed initial data if empty
            this.seedData();
        }
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
        this.notifyListeners(); // Placeholder for reactivity if needed
    },

    addWord(wordObj) {
        this.state.words.push({
            id: this.generateId(),
            stats: { correct: 0, incorrect: 0 },
            ...wordObj
        });
        this.save();
    },

    deleteWord(id) {
        this.state.words = this.state.words.filter(w => w.id !== id);
        this.save();
    },

    updateUserPoints(amount) {
        this.state.user.points += amount;
        this.save();
        return this.state.user.points;
    },

    updateWordStats(id, isCorrect) {
        const word = this.state.words.find(w => w.id === id);
        if (word) {
            if (isCorrect) {
                word.stats.correct++;
                this.updateUserPoints(10); // 10 points for correct
            } else {
                word.stats.incorrect++;
            }
            this.save();
        }
    },

    toggleTheme() {
        this.state.user.theme = this.state.user.theme === 'light' ? 'dark' : 'light';
        this.save();
        this.applyTheme();
    },

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.user.theme);
    },

    notifyListeners() {
        // Simple event bus could go here
        const event = new CustomEvent('store-updated');
        document.dispatchEvent(event);
    }
};

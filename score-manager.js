class ScoreManager {
    constructor() {
        this.initializeHighScores();
        this.setupEventListeners();
        this.animationTimeouts = [];
    }

    initializeHighScores() {
        if (!localStorage.getItem('highScores')) {
            localStorage.setItem('highScores', JSON.stringify({
                solo: [],
                multi: []
            }));
        }
        this.displayHighScores('solo');
    }

    setupEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.displayHighScores(btn.dataset.mode);
            });
        });
    }

    clearAnimations() {
        // Nettoyer toutes les animations en cours
        this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
        this.animationTimeouts = [];
        
        // Retirer les classes d'animation
        const elements = document.querySelectorAll('.score-change');
        elements.forEach(el => el.classList.remove('score-change'));
    }

    resetScores(mode) {
        this.clearAnimations();
        
        if (mode === 'solo') {
            document.getElementById('score').textContent = '0';
            document.getElementById('level').textContent = '1';
            document.getElementById('lines').textContent = '0';
        } else {
            document.getElementById('playerScore').textContent = '0';
            document.getElementById('playerLevel').textContent = '1';
            document.getElementById('playerLines').textContent = '0';
            document.getElementById('aiScore').textContent = '0';
            document.getElementById('aiLevel').textContent = '1';
            document.getElementById('aiLines').textContent = '0';
        }
    }

    addAnimationTimeout(timeout) {
        this.animationTimeouts.push(timeout);
    }

    animateElement(element, value) {
        if (element.textContent !== value.toString()) {
            element.textContent = value;
            element.classList.add('score-change');
            this.addAnimationTimeout(
                setTimeout(() => element.classList.remove('score-change'), 300)
            );
        }
    }

    updateGameScores(game, aiGame = null) {
        if (!game) return;

        if (!aiGame) {
            this.updateSoloScores(game);
        } else {
            this.updateMultiScores(game, aiGame);
        }
    }

    updateSoloScores(game) {
        if (!game) return;

        const scoreElement = document.getElementById('score');
        const levelElement = document.getElementById('level');
        const linesElement = document.getElementById('lines');
        
        this.animateElement(scoreElement, game.score);
        this.animateElement(levelElement, game.level);
        linesElement.textContent = game.lines;
    }

    updateMultiScores(game, aiGame) {
        if (!game || !aiGame) return;

        // Scores du joueur
        const playerScoreEl = document.getElementById('playerScore');
        const playerLevelEl = document.getElementById('playerLevel');
        const playerLinesEl = document.getElementById('playerLines');
        
        this.animateElement(playerScoreEl, game.score);
        this.animateElement(playerLevelEl, game.level);
        playerLinesEl.textContent = game.lines;
        
        // Scores de l'IA
        const aiScoreEl = document.getElementById('aiScore');
        const aiLevelEl = document.getElementById('aiLevel');
        const aiLinesEl = document.getElementById('aiLines');
        
        this.animateElement(aiScoreEl, aiGame.score);
        this.animateElement(aiLevelEl, aiGame.level);
        aiLinesEl.textContent = aiGame.lines;
    }

    showGameOver(mode, game, aiGame = null) {
        if (!game) return;

        const gameOverScreen = document.getElementById('gameOver');
        gameOverScreen.classList.remove('hidden');
        
        if (mode === 'solo') {
            this.showSoloGameOver(game);
        } else if (aiGame) {
            this.showMultiGameOver(game, aiGame);
        }
        
        this.updateHighScores(mode, game, aiGame);
    }

    showSoloGameOver(game) {
        document.getElementById('soloGameOver').classList.remove('hidden');
        document.getElementById('multiGameOver').classList.add('hidden');
        document.getElementById('finalScore').textContent = game.score;
    }

    showMultiGameOver(game, aiGame) {
        document.getElementById('soloGameOver').classList.add('hidden');
        document.getElementById('multiGameOver').classList.remove('hidden');
        
        // Scores finaux
        document.getElementById('finalPlayerScore').textContent = game.score;
        document.getElementById('finalPlayerLevel').textContent = game.level;
        document.getElementById('finalPlayerLines').textContent = game.lines;
        
        document.getElementById('finalAIScore').textContent = aiGame.score;
        document.getElementById('finalAILevel').textContent = aiGame.level;
        document.getElementById('finalAILines').textContent = aiGame.lines;
        
        // Annonce du gagnant
        const winnerAnnouncement = document.getElementById('winnerAnnouncement');
        if (game.score > aiGame.score) {
            winnerAnnouncement.textContent = 'Félicitations ! Vous avez gagné !';
            winnerAnnouncement.style.color = '#27ae60';
        } else if (game.score < aiGame.score) {
            winnerAnnouncement.textContent = "L'IA a gagné !";
            winnerAnnouncement.style.color = '#c0392b';
        } else {
            winnerAnnouncement.textContent = 'Match nul !';
            winnerAnnouncement.style.color = '#f1c40f';
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    updateHighScores(mode, game, aiGame = null) {
        const score = mode === 'solo' ? game.score : Math.max(game.score, aiGame ? aiGame.score : 0);
        const highScores = JSON.parse(localStorage.getItem('highScores'));
        
        highScores[mode].push({
            score: score,
            date: new Date().toISOString(),
            level: mode === 'solo' ? game.level : Math.max(game.level, aiGame ? aiGame.level : 0),
            lines: mode === 'solo' ? game.lines : Math.max(game.lines, aiGame ? aiGame.lines : 0)
        });
        
        // Trier et garder les 5 meilleurs scores
        highScores[mode].sort((a, b) => b.score - a.score);
        highScores[mode] = highScores[mode].slice(0, 5);
        
        localStorage.setItem('highScores', JSON.stringify(highScores));
        this.displayHighScores(mode);
    }

    displayHighScores(mode = 'solo') {
        const highScores = JSON.parse(localStorage.getItem('highScores'));
        const highScoresList = document.getElementById('highScoresList');
        const scores = highScores[mode] || [];
        
        // Mettre à jour les onglets actifs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Vider la liste existante
        highScoresList.innerHTML = '';
        
        // Ajouter les scores
        scores.forEach((score, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${score.score}</td>
                <td>Niv.${score.level || 1}</td>
                <td>${this.formatDate(score.date)}</td>
            `;
            highScoresList.appendChild(row);
        });
        
        // Ajouter des lignes vides si nécessaire
        while (highScoresList.children.length < 5) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${highScoresList.children.length + 1}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
            `;
            highScoresList.appendChild(row);
        }
    }
} 
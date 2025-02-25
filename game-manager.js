class GameManager {
    constructor() {
        // Initialisation des instances de jeu
        this.playerGame = null;
        this.aiGame = null;
        
        // État du jeu
        this.gameMode = null; // 'solo' ou 'multi'
        
        // Éléments DOM
        this.mainMenu = document.getElementById('mainMenu');
        this.gameContainer = document.getElementById('gameContainer');
        this.aiContainer = document.getElementById('aiContainer');
        this.gameOverScreen = document.getElementById('gameOver');
        this.winnerText = document.getElementById('winnerText');
        this.finalScore = document.getElementById('finalScore');
        this.multiScoreTable = document.getElementById('multiScoreTable');
        this.finalScoreTable = document.getElementById('finalScoreTable');
        
        // Boutons
        this.soloBtn = document.getElementById('soloBtn');
        this.multiBtn = document.getElementById('multiBtn');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.menuBtn = document.getElementById('menuBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.backToMenuBtn = document.getElementById('backToMenuBtn');
        
        // Gestionnaire d'événements global pour les touches
        this.handleGlobalKeyPress = this.handleGlobalKeyPress.bind(this);
        document.addEventListener('keydown', this.handleGlobalKeyPress);
        
        // Initialisation des événements
        this.initEvents();
        
        // Intervalle de mise à jour des scores
        this.scoreUpdateInterval = null;
    }
    
    // Gestionnaire d'événements global pour les touches
    handleGlobalKeyPress(event) {
        // Si nous sommes dans le menu ou en game over, ignorer les touches
        if (!this.playerGame || this.mainMenu.classList.contains('hidden') === false || 
            this.gameOverScreen.classList.contains('hidden') === false) {
            return;
        }
        
        // Gestion de la touche Espace pour la pause
        if (event.keyCode === 32) { // Touche Espace
            event.preventDefault(); // Empêcher le défilement de la page
            if (this.startBtn.disabled) { // Ne mettre en pause que si le jeu a commencé
                this.togglePause();
            }
        }
    }
    
    // Initialisation des gestionnaires d'événements
    initEvents() {
        // Boutons du menu principal
        this.soloBtn.addEventListener('click', () => this.startSoloMode());
        this.multiBtn.addEventListener('click', () => this.startMultiMode());
        
        // Boutons de contrôle du jeu
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.menuBtn.addEventListener('click', () => this.returnToMainMenu());
        
        // Boutons de l'écran de fin de partie
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.backToMenuBtn.addEventListener('click', () => this.returnToMainMenu());
    }
    
    // Démarrer le mode solo
    startSoloMode() {
        this.gameMode = 'solo';
        this.showGameContainer();
        this.aiContainer.classList.add('hidden');
        document.getElementById('playerTitle').textContent = 'Joueur';
        
        // Cacher le tableau de score multijoueur
        this.multiScoreTable.classList.add('hidden');
        
        // Nettoyer l'ancien jeu s'il existe
        if (this.playerGame) {
            this.playerGame.cleanup();
        }
        
        // Initialiser un nouveau jeu
        this.playerGame = new Tetris();
        this.aiGame = null;
        
        // Réinitialiser les boutons
        this.startBtn.disabled = false;
        this.pauseBtn.textContent = 'Pause';
        
        // Réinitialiser l'affichage du score
        document.getElementById('score').textContent = '0';
        document.getElementById('level').textContent = '1';
        document.getElementById('lines').textContent = '0';
        
        // Afficher les meilleurs scores
        this.displayHighScores();
    }
    
    // Démarrer le mode multijoueur
    startMultiMode() {
        this.gameMode = 'multi';
        this.showGameContainer();
        this.aiContainer.classList.remove('hidden');
        document.getElementById('playerTitle').textContent = 'Vous';
        
        // Afficher le tableau de score multijoueur
        this.multiScoreTable.classList.remove('hidden');
        
        // Nettoyer les anciens jeux s'ils existent
        if (this.playerGame) {
            this.playerGame.cleanup();
        }
        if (this.aiGame) {
            this.aiGame.cleanup();
        }
        
        // Initialiser les nouveaux jeux
        this.playerGame = new Tetris();
        this.aiGame = new AIPlayer();
        
        // S'assurer que l'état du son est synchronisé
        const soundEnabled = localStorage.getItem('tetrisSoundEnabled') === 'true';
        this.playerGame.soundEnabled = soundEnabled;
        this.aiGame.soundEnabled = soundEnabled;
        
        // Réinitialiser les boutons
        this.startBtn.disabled = false;
        this.pauseBtn.textContent = 'Pause';
        
        // Réinitialiser l'affichage du score
        this.resetScoreDisplay();
        
        // Afficher les meilleurs scores
        this.displayHighScores();
    }
    
    // Réinitialiser l'affichage des scores
    resetScoreDisplay() {
        // Score solo
        document.getElementById('score').textContent = '0';
        document.getElementById('level').textContent = '1';
        document.getElementById('lines').textContent = '0';
        
        // Scores multijoueur
        document.getElementById('playerScore').textContent = '0';
        document.getElementById('playerLevel').textContent = '1';
        document.getElementById('playerLines').textContent = '0';
        document.getElementById('aiScore').textContent = '0';
        document.getElementById('aiLevel').textContent = '1';
        document.getElementById('aiLines').textContent = '0';
    }
    
    // Afficher le conteneur de jeu et cacher le menu
    showGameContainer() {
        this.mainMenu.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
    }
    
    // Démarrer le jeu
    startGame() {
        if (this.playerGame) {
            this.playerGame.start();
            this.startBtn.disabled = true; // Désactiver le bouton Start une fois le jeu commencé
        }
        
        if (this.aiGame) {
            this.aiGame.start();
        }
        
        // Vérifier périodiquement l'état du jeu
        this.checkGameStateInterval = setInterval(() => this.checkGameState(), 500);
        
        // Mettre à jour les scores en mode multijoueur
        if (this.gameMode === 'multi') {
            this.scoreUpdateInterval = setInterval(() => this.updateMultiScores(), 200);
        }
    }
    
    // Mettre à jour les scores en mode multijoueur
    updateMultiScores() {
        if (this.gameMode !== 'multi' || !this.playerGame || !this.aiGame) return;
        
        // Mettre à jour les scores du joueur
        document.getElementById('playerScore').textContent = this.playerGame.score;
        document.getElementById('playerLevel').textContent = this.playerGame.level;
        document.getElementById('playerLines').textContent = this.playerGame.lines;
        
        // Mettre à jour les scores de l'IA
        document.getElementById('aiScore').textContent = this.aiGame.score;
        document.getElementById('aiLevel').textContent = this.aiGame.level;
        document.getElementById('aiLines').textContent = this.aiGame.lines;
    }
    
    // Vérifier l'état du jeu (game over)
    checkGameState() {
        if (!this.playerGame) return;
        
        // Mode solo
        if (this.gameMode === 'solo' && this.playerGame.gameOver) {
            this.showGameOver(`Score final: ${this.playerGame.score}`);
            clearInterval(this.checkGameStateInterval);
            clearInterval(this.scoreUpdateInterval);
            return;
        }
        
        // Mode multijoueur
        if (this.gameMode === 'multi') {
            if (this.playerGame.gameOver && !this.aiGame.gameOver) {
                this.showGameOver("L'ordinateur a gagné!");
                this.aiGame.isPaused = true; // Arrêter l'IA quand le joueur perd
                clearInterval(this.checkGameStateInterval);
                clearInterval(this.scoreUpdateInterval);
            } else if (!this.playerGame.gameOver && this.aiGame.gameOver) {
                this.showGameOver("Vous avez gagné!");
                clearInterval(this.checkGameStateInterval);
                clearInterval(this.scoreUpdateInterval);
            } else if (this.playerGame.gameOver && this.aiGame.gameOver) {
                this.showGameOver("Match nul!");
                clearInterval(this.checkGameStateInterval);
                clearInterval(this.scoreUpdateInterval);
            }
        }
    }
    
    // Afficher l'écran de fin de partie
    showGameOver(message) {
        this.gameOverScreen.classList.remove('hidden');
        this.winnerText.textContent = message;
        
        if (this.gameMode === 'solo') {
            // Mode solo: afficher simplement le score final
            this.finalScore.textContent = this.playerGame.score;
            this.finalScoreTable.classList.add('hidden');
        } else {
            // Mode multi: afficher le tableau comparatif
            this.finalScoreTable.classList.remove('hidden');
            
            // Mettre à jour les scores finaux
            document.getElementById('finalPlayerScore').textContent = this.playerGame.score;
            document.getElementById('finalPlayerLevel').textContent = this.playerGame.level;
            document.getElementById('finalPlayerLines').textContent = this.playerGame.lines;
            
            document.getElementById('finalAiScore').textContent = this.aiGame.score;
            document.getElementById('finalAiLevel').textContent = this.aiGame.level;
            document.getElementById('finalAiLines').textContent = this.aiGame.lines;
        }
        
        // Sauvegarder le score dans les meilleurs scores
        this.saveHighScore();
    }
    
    // Sauvegarder le score dans les meilleurs scores
    saveHighScore() {
        // Ne pas sauvegarder les scores à 0
        if (this.playerGame.score === 0) {
            return;
        }
        
        // Récupérer les meilleurs scores existants
        let highScores = JSON.parse(localStorage.getItem('tetrisHighScores')) || [];
        
        // Ajouter le nouveau score
        const newScore = {
            score: this.playerGame.score,
            mode: this.gameMode,
            date: new Date().toISOString()
        };
        
        highScores.push(newScore);
        
        // Trier par score décroissant
        highScores.sort((a, b) => b.score - a.score);
        
        // Garder seulement les 10 meilleurs
        highScores = highScores.slice(0, 10);
        
        // Sauvegarder dans le localStorage
        localStorage.setItem('tetrisHighScores', JSON.stringify(highScores));
        
        // Mettre à jour l'affichage
        this.displayHighScores(newScore);
    }
    
    // Afficher les meilleurs scores
    displayHighScores(newScore = null) {
        const highScores = JSON.parse(localStorage.getItem('tetrisHighScores')) || [];
        const highScoresList = document.getElementById('highScoresList');
        
        // Vider la liste
        highScoresList.innerHTML = '';
        
        // Ajouter chaque score
        highScores.forEach((score, index) => {
            const row = document.createElement('tr');
            
            // Ajouter une classe pour les 3 premiers
            if (index < 3) {
                row.classList.add(`rank-${index + 1}`);
            }
            
            // Marquer le nouveau score
            if (newScore && newScore.score === score.score && 
                newScore.date === score.date) {
                row.classList.add('new-score');
            }
            
            // Créer les cellules
            const rankCell = document.createElement('td');
            rankCell.textContent = index + 1;
            
            const scoreCell = document.createElement('td');
            scoreCell.textContent = score.score;
            
            const modeCell = document.createElement('td');
            // Afficher un tiret pour les scores à 0
            if (score.score === 0) {
                modeCell.textContent = '-';
                modeCell.classList.add('default-value');
                scoreCell.classList.add('default-value');
                row.classList.add('default-score');
            } else {
                modeCell.textContent = score.mode === 'solo' ? 'Solo' : 'Multi';
            }
            
            // Ajouter les cellules à la ligne
            row.appendChild(rankCell);
            row.appendChild(scoreCell);
            row.appendChild(modeCell);
            
            // Ajouter la ligne au tableau
            highScoresList.appendChild(row);
        });
        
        // Si aucun score, afficher un message avec des tirets pour le mode
        if (highScores.length === 0) {
            for (let i = 1; i <= 7; i++) {
                const row = document.createElement('tr');
                row.classList.add('default-score');
                
                const rankCell = document.createElement('td');
                rankCell.textContent = i;
                
                const scoreCell = document.createElement('td');
                scoreCell.textContent = '0';
                scoreCell.classList.add('default-value');
                
                const modeCell = document.createElement('td');
                modeCell.textContent = '-';
                modeCell.classList.add('default-value');
                
                row.appendChild(rankCell);
                row.appendChild(scoreCell);
                row.appendChild(modeCell);
                
                highScoresList.appendChild(row);
            }
        }
    }
    
    // Mettre en pause ou reprendre le jeu
    togglePause() {
        if (this.playerGame) {
            this.playerGame.togglePause();
            this.pauseBtn.textContent = this.playerGame.isPaused ? 'Reprendre' : 'Pause';
            
            // Synchroniser la pause avec le jeu de l'IA
            if (this.aiGame) {
                this.aiGame.isPaused = this.playerGame.isPaused;
            }
        }
    }
    
    // Redémarrer le jeu
    restartGame() {
        clearInterval(this.checkGameStateInterval);
        clearInterval(this.scoreUpdateInterval);
        this.gameOverScreen.classList.add('hidden');
        
        // Redémarrer selon le mode
        if (this.gameMode === 'solo') {
            this.startSoloMode();
        } else {
            this.startMultiMode();
        }
    }
    
    // Retourner au menu principal
    returnToMainMenu() {
        clearInterval(this.checkGameStateInterval);
        clearInterval(this.scoreUpdateInterval);
        
        // Nettoyer les ressources des jeux
        if (this.playerGame) {
            this.playerGame.cleanup();
            this.playerGame = null;
        }
        
        if (this.aiGame) {
            this.aiGame.cleanup();
            this.aiGame = null;
        }
        
        // Afficher le menu principal
        this.gameContainer.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.mainMenu.classList.remove('hidden');
    }
    
    // Nettoyage des ressources lors de la destruction
    cleanup() {
        document.removeEventListener('keydown', this.handleGlobalKeyPress);
        
        if (this.playerGame) {
            this.playerGame.cleanup();
            this.playerGame = null;
        }
        
        if (this.aiGame) {
            this.aiGame.cleanup();
            this.aiGame = null;
        }
        
        clearInterval(this.checkGameStateInterval);
        clearInterval(this.scoreUpdateInterval);
    }
    
    // Nettoyer les scores à 0 du localStorage
    cleanHighScores() {
        const highScores = JSON.parse(localStorage.getItem('tetrisHighScores')) || [];
        
        // Filtrer les scores à 0
        const cleanedScores = highScores.filter(score => score.score > 0);
        
        // Si des scores ont été supprimés, mettre à jour le localStorage
        if (cleanedScores.length !== highScores.length) {
            localStorage.setItem('tetrisHighScores', JSON.stringify(cleanedScores));
            console.log(`${highScores.length - cleanedScores.length} scores à 0 ont été supprimés.`);
        }
        
        return cleanedScores;
    }
}

// Initialiser le gestionnaire de jeu au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const gameManager = new GameManager();
    
    // Nettoyer les scores à 0
    gameManager.cleanHighScores();
    
    // Afficher les meilleurs scores au démarrage
    gameManager.displayHighScores();
    
    // Ajouter un gestionnaire pour nettoyer les ressources lors de la fermeture de la page
    window.addEventListener('beforeunload', () => {
        gameManager.cleanup();
    });
}); 
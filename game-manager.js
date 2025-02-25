class GameManager {
    constructor() {
        // Initialisation des instances de jeu
        this.game = null;
        this.aiGame = null;
        
        // État du jeu
        this.currentMode = null; // 'solo' ou 'multi'
        
        // Éléments DOM
        this.mainMenu = document.getElementById('mainMenu');
        this.gameContainer = document.getElementById('gameContainer');
        this.aiContainer = document.getElementById('aiContainer');
        this.gameOverScreen = document.getElementById('gameOver');
        this.winnerText = document.getElementById('winnerText');
        this.finalScore = document.getElementById('finalScore');
        
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
        this.scoreManager = new ScoreManager();
        this.initialize();
    }
    
    // Gestionnaire d'événements global pour les touches
    handleGlobalKeyPress(event) {
        // Si nous sommes dans le menu ou en game over, ignorer les touches
        if (!this.game || this.mainMenu.classList.contains('hidden') === false || 
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
    initialize() {
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

        // État initial des boutons
        this.pauseBtn.disabled = true;

        // Mise à jour des scores
        setInterval(() => {
            if (this.game && !this.game.gameOver) {
                this.scoreManager.updateGameScores(this.game, this.aiGame);
            }
        }, 100);
    }
    
    // Démarrer le mode solo
    startSoloMode() {
        this.currentMode = 'solo';
        this.cleanup();
        this.showGameContainer();
        
        // Afficher le conteneur de score solo et cacher celui du multi
        document.getElementById('soloScoreContainer').classList.remove('hidden');
        document.getElementById('multiScoreContainer').classList.add('hidden');
        document.getElementById('aiContainer').classList.add('hidden');
        document.getElementById('playerTitle').textContent = 'Joueur';
        
        // Créer une nouvelle instance du jeu
        this.game = new Tetris();
        this.scoreManager.resetScores('solo');

        // Réinitialiser l'état des boutons
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = 'Pause';
        this.pauseBtn.classList.remove('paused');
    }
    
    // Démarrer le mode multijoueur
    startMultiMode() {
        this.currentMode = 'multi';
        this.cleanup();
        this.showGameContainer();
        
        // Afficher le conteneur de score multi et cacher celui du solo
        document.getElementById('soloScoreContainer').classList.add('hidden');
        document.getElementById('multiScoreContainer').classList.remove('hidden');
        document.getElementById('aiContainer').classList.remove('hidden');
        document.getElementById('playerTitle').textContent = 'Vous';
        
        // Créer les instances de jeu
        this.game = new Tetris();
        this.aiGame = new AIPlayer();
        this.scoreManager.resetScores('multi');

        // Réinitialiser l'état des boutons
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = 'Pause';
        this.pauseBtn.classList.remove('paused');
    }
    
    // Afficher le conteneur de jeu et cacher le menu
    showGameContainer() {
        this.mainMenu.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
    }
    
    // Démarrer le jeu
    startGame() {
        if (!this.game) return;

        try {
            // Désactiver le bouton de démarrage et activer le bouton de pause
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.pauseBtn.textContent = 'Pause';
            this.pauseBtn.classList.remove('paused');
    
            // Démarrer le jeu principal
            this.game.reset();
            this.game.isPaused = false;
            this.game.gameOver = false;
            
            // Forcer la création des pièces initiales
            const pieces = Object.keys(this.game.pieces);
            const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
            const nextRandomPiece = pieces[Math.floor(Math.random() * pieces.length)];
            
            this.game.currentPiece = {
                matrix: this.game.pieces[randomPiece],
                pos: {x: 3, y: 0},
                type: randomPiece
            };
            
            this.game.nextPiece = {
                matrix: this.game.pieces[nextRandomPiece],
                pos: {x: 3, y: 0},
                type: nextRandomPiece
            };
            
            this.game.start();
            
            // Démarrer le jeu de l'IA si en mode multi
            if (this.aiGame) {
                this.aiGame.reset();
                this.aiGame.isPaused = false;
                this.aiGame.gameOver = false;
                
                // Forcer la création des pièces initiales pour l'IA
                const aiPieces = Object.keys(this.aiGame.pieces);
                const aiRandomPiece = aiPieces[Math.floor(Math.random() * aiPieces.length)];
                const aiNextRandomPiece = aiPieces[Math.floor(Math.random() * aiPieces.length)];
                
                this.aiGame.currentPiece = {
                    matrix: this.aiGame.pieces[aiRandomPiece],
                    pos: {x: 3, y: 0},
                    type: aiRandomPiece
                };
                
                this.aiGame.nextPiece = {
                    matrix: this.aiGame.pieces[aiNextRandomPiece],
                    pos: {x: 3, y: 0},
                    type: aiNextRandomPiece
                };
                
                this.aiGame.start();
            }
            
            // Mettre en place la vérification de l'état du jeu
            if (this.checkGameStateInterval) {
                clearInterval(this.checkGameStateInterval);
            }
            this.checkGameStateInterval = setInterval(() => this.checkGameState(), 500);
        } catch (error) {
            console.error("Erreur lors du démarrage du jeu:", error);
            alert("Une erreur est survenue lors du démarrage du jeu. Veuillez recharger la page.");
        }
    }
    
    // Vérifier l'état du jeu (game over)
    checkGameState() {
        if (!this.game) return;
        
        if (this.currentMode === 'solo' && this.game.gameOver) {
            this.scoreManager.showGameOver(this.currentMode, this.game);
            clearInterval(this.checkGameStateInterval);
            return;
        }
        
        if (this.currentMode === 'multi') {
            if (this.game.gameOver || this.aiGame.gameOver) {
                this.scoreManager.showGameOver(this.currentMode, this.game, this.aiGame);
                clearInterval(this.checkGameStateInterval);
                if (this.game.gameOver) {
                    this.aiGame.isPaused = true;
                }
            }
        }
    }
    
    // Mettre en pause ou reprendre le jeu
    togglePause() {
        if (!this.game || !this.startBtn.disabled || this.game.gameOver) return; // Ne pas mettre en pause si le jeu n'a pas commencé ou est terminé

        this.game.togglePause();
        this.pauseBtn.textContent = this.game.isPaused ? 'Reprendre' : 'Pause';
        this.pauseBtn.classList.toggle('paused', this.game.isPaused);
        
        // Synchroniser la pause avec le jeu de l'IA
        if (this.aiGame) {
            this.aiGame.isPaused = this.game.isPaused;
        }
    }
    
    // Redémarrer le jeu
    restartGame() {
        clearInterval(this.checkGameStateInterval);
        this.gameOverScreen.classList.add('hidden');
        
        // Redémarrer selon le mode
        if (this.currentMode === 'solo') {
            this.startSoloMode();
        } else {
            this.startMultiMode();
        }
    }
    
    // Retourner au menu principal
    returnToMainMenu() {
        clearInterval(this.checkGameStateInterval);
        
        // Nettoyer les ressources des jeux
        this.cleanup();
        
        // Afficher le menu principal
        this.gameContainer.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.mainMenu.classList.remove('hidden');
        
        this.scoreManager.displayHighScores('solo'); // Réinitialiser l'affichage des scores
    }
    
    // Nettoyage des ressources lors de la destruction
    cleanup() {
        document.removeEventListener('keydown', this.handleGlobalKeyPress);
        
        if (this.game) {
            this.game.cleanup();
            this.game = null;
        }
        
        if (this.aiGame) {
            this.aiGame.cleanup();
            this.aiGame = null;
        }
        
        clearInterval(this.checkGameStateInterval);
    }
}

// Initialiser le gestionnaire de jeu au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const gameManager = new GameManager();
    
    // Exposer le gameManager pour le débogage
    window.gameManager = gameManager;
    
    // Ajouter un gestionnaire pour nettoyer les ressources lors de la fermeture de la page
    window.addEventListener('beforeunload', () => {
        gameManager.cleanup();
    });
}); 
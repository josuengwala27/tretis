// Fichier de débogage pour résoudre le problème de démarrage du jeu
console.log('Débogage Tetris - Chargement');

// Fonction pour remplacer la méthode start de Tetris
function patchTetrisStart() {
    console.log('Patching Tetris.start()');
    
    // Sauvegarde de la méthode originale
    const originalStart = Tetris.prototype.start;
    
    // Remplacement de la méthode start
    Tetris.prototype.start = function() {
        console.log('Tetris.start() appelée');
        
        try {
            // Réinitialiser complètement l'état du jeu
            this.reset();
            console.log('Reset effectué');
            
            // Générer les pièces manuellement
            const pieces = Object.keys(this.pieces);
            console.log('Pièces disponibles:', pieces);
            
            // Créer la pièce courante
            const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
            console.log('Pièce courante choisie:', randomPiece);
            
            this.currentPiece = {
                matrix: this.pieces[randomPiece],
                pos: {x: 3, y: 0},
                type: randomPiece
            };
            console.log('Pièce courante créée:', this.currentPiece);
            
            // Créer la pièce suivante
            const nextRandomPiece = pieces[Math.floor(Math.random() * pieces.length)];
            console.log('Prochaine pièce choisie:', nextRandomPiece);
            
            this.nextPiece = {
                matrix: this.pieces[nextRandomPiece],
                pos: {x: 3, y: 0},
                type: nextRandomPiece
            };
            console.log('Prochaine pièce créée:', this.nextPiece);
            
            // Réinitialiser les compteurs
            this.lastTime = 0;
            this.dropCounter = 0;
            this.gameOver = false;
            this.isPaused = false;
            
            // Dessiner l'état initial
            this.drawNextPiece();
            this.draw();
            console.log('Dessin initial effectué');
            
            // Démarrer la boucle de jeu avec une fonction fléchée pour préserver le contexte
            console.log('Démarrage de la boucle de jeu');
            window.requestAnimationFrame((t) => {
                console.log('Premier frame d\'animation, temps:', t);
                this.update(t);
            });
            
            // Jouer le son de démarrage
            if (this.isSoundEnabled()) {
                this.playStartSound();
            }
            
            console.log('Tetris.start() terminée avec succès');
        } catch (error) {
            console.error('ERREUR dans Tetris.start():', error);
        }
    };
    
    console.log('Tetris.start() patched');
}

// Fonction pour remplacer la méthode update de Tetris
function patchTetrisUpdate() {
    console.log('Patching Tetris.update()');
    
    // Sauvegarde de la méthode originale
    const originalUpdate = Tetris.prototype.update;
    
    // Remplacement de la méthode update
    Tetris.prototype.update = function(time = 0) {
        try {
            // Vérifier si le jeu est en cours
            if (!this.gameOver && !this.isPaused) {
                const deltaTime = time - this.lastTime;
                this.lastTime = time;
                
                // Mise à jour de la chute
                this.dropCounter += deltaTime;
                if (this.dropCounter > 1000 - (this.level * 50)) {
                    this.drop();
                }
                
                // Dessiner le jeu
                this.draw();
            }
            
            // Continuer la boucle de jeu
            window.requestAnimationFrame((t) => this.update(t));
        } catch (error) {
            console.error('ERREUR dans Tetris.update():', error);
        }
    };
    
    console.log('Tetris.update() patched');
}

// Fonction pour remplacer la méthode startGame de GameManager
function patchGameManagerStartGame() {
    console.log('Patching GameManager.startGame()');
    
    // Sauvegarde de la méthode originale
    const originalStartGame = GameManager.prototype.startGame;
    
    // Remplacement de la méthode startGame
    GameManager.prototype.startGame = function() {
        console.log('GameManager.startGame() appelée');
        
        try {
            if (!this.game) {
                console.error('Erreur: this.game est null');
                return;
            }
            
            console.log('État actuel du jeu:', {
                gameOver: this.game.gameOver,
                isPaused: this.game.isPaused
            });
            
            // Désactiver le bouton de démarrage et activer le bouton de pause
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.pauseBtn.textContent = 'Pause';
            this.pauseBtn.classList.remove('paused');
            console.log('Boutons mis à jour');
            
            // Démarrer le jeu principal
            console.log('Réinitialisation du jeu');
            this.game.reset();
            this.game.isPaused = false;
            this.game.gameOver = false;
            
            console.log('Démarrage du jeu');
            this.game.start();
            
            // Démarrer le jeu de l'IA si en mode multi
            if (this.aiGame) {
                console.log('Démarrage du jeu IA');
                this.aiGame.reset();
                this.aiGame.isPaused = false;
                this.aiGame.gameOver = false;
                this.aiGame.start();
            }
            
            // Mettre en place la vérification de l'état du jeu
            if (this.checkGameStateInterval) {
                clearInterval(this.checkGameStateInterval);
            }
            this.checkGameStateInterval = setInterval(() => this.checkGameState(), 500);
            console.log('Intervalle de vérification mis en place');
            
            console.log('GameManager.startGame() terminée avec succès');
        } catch (error) {
            console.error('ERREUR dans GameManager.startGame():', error);
        }
    };
    
    console.log('GameManager.startGame() patched');
}

// Fonction pour vérifier l'état du DOM
function checkDOMElements() {
    console.log('Vérification des éléments DOM');
    
    const elements = {
        tetrisCanvas: document.getElementById('tetris'),
        nextPieceCanvas: document.getElementById('nextPiece'),
        holdPieceCanvas: document.getElementById('holdPiece'),
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        soloScoreContainer: document.getElementById('soloScoreContainer'),
        multiScoreContainer: document.getElementById('multiScoreContainer')
    };
    
    for (const [name, element] of Object.entries(elements)) {
        console.log(`${name}: ${element ? 'OK' : 'MANQUANT'}`);
    }
    
    return elements;
}

// Fonction principale de débogage
function debugTetris() {
    console.log('Démarrage du débogage Tetris');
    
    // Vérifier les éléments DOM
    const domElements = checkDOMElements();
    
    // Patcher les méthodes problématiques
    patchTetrisStart();
    patchTetrisUpdate();
    patchGameManagerStartGame();
    
    console.log('Débogage Tetris terminé, le jeu devrait maintenant fonctionner');
}

// Ajouter un bouton de débogage pour forcer le démarrage du jeu
function addDebugButton() {
    console.log('Ajout du bouton de débogage');
    
    const debugBtn = document.createElement('button');
    debugBtn.textContent = 'FORCER DÉMARRAGE';
    debugBtn.style.position = 'fixed';
    debugBtn.style.top = '10px';
    debugBtn.style.right = '10px';
    debugBtn.style.zIndex = '9999';
    debugBtn.style.backgroundColor = 'red';
    debugBtn.style.color = 'white';
    debugBtn.style.padding = '10px';
    debugBtn.style.border = 'none';
    debugBtn.style.borderRadius = '5px';
    debugBtn.style.cursor = 'pointer';
    
    debugBtn.addEventListener('click', function() {
        console.log('Bouton de débogage cliqué');
        
        try {
            // Récupérer les instances de jeu
            const gameManager = window.gameManager;
            
            if (!gameManager) {
                console.error('GameManager non trouvé');
                alert('GameManager non trouvé. Veuillez recharger la page.');
                return;
            }
            
            // Forcer le démarrage du jeu
            console.log('Forçage du démarrage du jeu');
            
            // Vérifier si nous sommes dans un mode de jeu
            if (!gameManager.currentMode) {
                console.log('Aucun mode sélectionné, démarrage du mode solo');
                gameManager.startSoloMode();
            }
            
            // Forcer la création des pièces
            if (gameManager.game) {
                const pieces = Object.keys(gameManager.game.pieces);
                const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
                const nextRandomPiece = pieces[Math.floor(Math.random() * pieces.length)];
                
                gameManager.game.currentPiece = {
                    matrix: gameManager.game.pieces[randomPiece],
                    pos: {x: 3, y: 0},
                    type: randomPiece
                };
                
                gameManager.game.nextPiece = {
                    matrix: gameManager.game.pieces[nextRandomPiece],
                    pos: {x: 3, y: 0},
                    type: nextRandomPiece
                };
                
                gameManager.game.reset();
                gameManager.game.isPaused = false;
                gameManager.game.gameOver = false;
                
                // Démarrer le jeu manuellement
                gameManager.game.drawNextPiece();
                gameManager.game.draw();
                
                // Démarrer la boucle de jeu
                const self = gameManager.game;
                window.requestAnimationFrame(function(t) {
                    self.update(t);
                });
                
                // Mettre à jour les boutons
                gameManager.startBtn.disabled = true;
                gameManager.pauseBtn.disabled = false;
                
                console.log('Jeu démarré manuellement');
                gameManager.game.debugState();
            } else {
                console.error('Aucune instance de jeu trouvée');
                alert('Aucune instance de jeu trouvée. Veuillez sélectionner un mode de jeu.');
            }
        } catch (error) {
            console.error('ERREUR lors du forçage du démarrage:', error);
            alert('Une erreur est survenue lors du forçage du démarrage: ' + error.message);
        }
    });
    
    document.body.appendChild(debugBtn);
    console.log('Bouton de débogage ajouté');
}

// Exécuter le débogage après le chargement complet de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, attente de 500ms avant débogage');
    setTimeout(function() {
        debugTetris();
        addDebugButton();
        
        // Exposer le gameManager pour le débogage
        const gameManagerScript = document.querySelector('script[src="game-manager.js"]');
        if (gameManagerScript) {
            gameManagerScript.onload = function() {
                console.log('GameManager chargé');
                // Attendre que le GameManager soit initialisé
                setTimeout(function() {
                    window.gameManager = document.gameManager;
                    console.log('GameManager exposé pour le débogage');
                }, 1000);
            };
        }
    }, 500);
});

// Ajouter un gestionnaire d'erreurs global
window.addEventListener('error', function(event) {
    console.error('ERREUR GLOBALE:', event.message, 'à', event.filename, 'ligne', event.lineno);
}); 
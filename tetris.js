class Tetris {
    constructor() {
        this.canvas = document.getElementById('tetris');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPiece');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('holdPiece');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        // Configuration du canvas principal
        this.canvas.width = 300;
        this.canvas.height = 600;
        this.blockSize = 30;
        this.cols = 10;
        this.rows = 20;
        
        // Configuration des canvas secondaires
        this.nextCanvas.width = this.nextCanvas.height = 100;
        this.holdCanvas.width = this.holdCanvas.height = 100;
        
        // Initialisation des variables de jeu
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        this.holdPiece = null;
        this.canHold = true;
        this.dropCounter = 0;
        this.lastTime = 0;
        
        // Facteur de ralentissement pour la "Pause douceur"
        this.slowdownFactor = 1;
        this.slowdownEndTime = 0;
        
        // Couleurs des pièces
        this.colors = [
            null,
            '#FF0D72', // I
            '#0DC2FF', // J
            '#0DFF72', // L
            '#F538FF', // O
            '#FF8E0D', // S
            '#FFE138', // T
            '#3877FF'  // Z
        ];

        // Définition des pièces
        this.pieces = {
            'I': [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
            'J': [[2, 0, 0], [2, 2, 2], [0, 0, 0]],
            'L': [[0, 0, 3], [3, 3, 3], [0, 0, 0]],
            'O': [[4, 4], [4, 4]],
            'S': [[0, 5, 5], [5, 5, 0], [0, 0, 0]],
            'T': [[0, 6, 0], [6, 6, 6], [0, 0, 0]],
            'Z': [[7, 7, 0], [0, 7, 7], [0, 0, 0]]
        };

        this.currentPiece = null;
        this.nextPiece = null;
        
        // Initialisation du système audio
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Initialisation de l'état du son depuis le localStorage avec une valeur par défaut false
        this.soundEnabled = localStorage.getItem('tetrisSoundEnabled') === 'true';
        
        // Gestionnaires d'événements
        this.handleKeyPressFunction = this.handleKeyPress.bind(this);
        document.addEventListener('keydown', this.handleKeyPressFunction);
        
        // Ajout du bouton de son (seulement s'il n'existe pas déjà)
        this.initSoundButton();
    }

    // Nouvelle méthode pour initialiser le bouton de son
    initSoundButton() {
        let soundBtn = document.querySelector('.sound-btn');
        if (!soundBtn) {
            soundBtn = document.createElement('button');
            soundBtn.className = 'sound-btn';
            soundBtn.onclick = () => this.toggleSound();
            document.querySelector('.game-stats').prepend(soundBtn);
        }
        // Mettre à jour l'icône du son selon l'état actuel
        this.updateSoundButtonIcon();
    }

    // Nouvelle méthode pour mettre à jour l'icône du son
    updateSoundButtonIcon() {
        const soundBtn = document.querySelector('.sound-btn');
        if (soundBtn) {
            soundBtn.innerHTML = this.soundEnabled ? '🔊' : '🔇';
        }
    }

    // Méthode modifiée pour la gestion du son
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('tetrisSoundEnabled', this.soundEnabled);
        this.updateSoundButtonIcon();
        
        // Jouer un son de test uniquement si on active le son
        if (this.soundEnabled) {
            this.playTone(440, 0.1, 'sine', 0.3);
        }
    }

    // Méthode modifiée pour vérifier l'état du son
    isSoundEnabled() {
        // Vérifier à la fois l'état local et le localStorage
        return this.soundEnabled && localStorage.getItem('tetrisSoundEnabled') === 'true';
    }

    // Méthode modifiée pour la génération des sons
    playTone(frequency, duration, type = 'sine', volume = 0.5) {
        if (!this.isSoundEnabled()) {
            return;
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Initialisation d'une nouvelle partie
    start() {
        this.reset();
        this.generateNewPiece();
        this.update();
        if (this.isSoundEnabled()) {
            this.playStartSound();
        }
    }

    // Réinitialisation du jeu
    reset() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        this.holdPiece = null;
        this.canHold = true;
        this.dropCounter = 0;
        this.lastTime = 0;
        this.updateScore();
        this.drawHoldPiece();
    }

    // Génération d'une nouvelle pièce
    generateNewPiece() {
        const pieces = Object.keys(this.pieces);
        if (!this.currentPiece) {
            this.currentPiece = {
                matrix: this.pieces[pieces[Math.floor(Math.random() * pieces.length)]],
                pos: {x: 3, y: 0},
                type: pieces[Math.floor(Math.random() * pieces.length)]
            };
        } else {
            this.currentPiece = this.nextPiece;
        }
        
        this.nextPiece = {
            matrix: this.pieces[pieces[Math.floor(Math.random() * pieces.length)]],
            pos: {x: 3, y: 0},
            type: pieces[Math.floor(Math.random() * pieces.length)]
        };
        
        if (this.checkCollision()) {
            this.gameOver = true;
            this.showGameOver();
        }
        
        this.drawNextPiece();
    }

    // Vérification des collisions
    checkCollision() {
        const matrix = this.currentPiece.matrix;
        const pos = this.currentPiece.pos;
        
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] !== 0 &&
                    (this.board[y + pos.y] &&
                    this.board[y + pos.y][x + pos.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    // Rotation d'une pièce
    rotate(matrix) {
        const N = matrix.length;
        const rotated = matrix.map((row, i) =>
            row.map((val, j) => matrix[N - 1 - j][i])
        );
        
        if (this.currentPiece) {
            const pos = this.currentPiece.pos;
            const prevMatrix = this.currentPiece.matrix;
            this.currentPiece.matrix = rotated;
            
            if (this.checkCollision()) {
                this.currentPiece.matrix = prevMatrix;
            } else {
                this.playRotateSound();
            }
        }
    }

    // Déplacement d'une pièce
    move(dir) {
        this.currentPiece.pos.x += dir;
        if (this.checkCollision()) {
            this.currentPiece.pos.x -= dir;
        } else {
            this.playMoveSound();
        }
    }

    // Descente d'une pièce
    drop() {
        this.currentPiece.pos.y++;
        if (this.checkCollision()) {
            this.currentPiece.pos.y--;
            this.merge();
            this.generateNewPiece();
            this.clearLines();
            this.canHold = true;
        } else {
            // Son uniquement pour la descente rapide (touche bas)
            if (this.lastKeyPressed === 40) { // 40 est le code de la touche bas
                this.playFastDropSound();
            }
        }
        this.dropCounter = 0;
    }

    // Chute instantanée
    hardDrop() {
        while (!this.checkCollision()) {
            this.currentPiece.pos.y++;
        }
        this.currentPiece.pos.y--;
        this.playDropSound();
        this.merge();
        this.generateNewPiece();
        this.clearLines();
        this.canHold = true;
    }

    // Fusion d'une pièce avec le plateau
    merge() {
        this.currentPiece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.board[y + this.currentPiece.pos.y][x + this.currentPiece.pos.x] = value;
                }
            });
        });
    }

    // Effacement des lignes complètes
    clearLines() {
        let linesCleared = 0;
        
        outer: for (let y = this.board.length - 1; y >= 0; y--) {
            for (let x = 0; x < this.board[y].length; x++) {
                if (this.board[y][x] === 0) continue outer;
            }
            
            const row = this.board.splice(y, 1)[0].fill(0);
            this.board.unshift(row);
            linesCleared++;
            y++;
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.level = Math.floor(this.lines / 10) + 1;
            this.updateScore();
            this.playLineSound(linesCleared);
            
            // Vérifier si exactement 2 lignes ont été complétées
            if (linesCleared === 2) {
                // Déclencher l'événement de cadeau surprise
                if (typeof this.onTwoLinesCleared === 'function') {
                    this.onTwoLinesCleared();
                }
            }
        }
    }

    // Calcul du score
    calculateScore(lines) {
        const basePoints = [40, 100, 300, 1200];
        return basePoints[lines - 1] * this.level;
    }

    // Mise à jour de l'affichage du score
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }

    // Ajout du son pour le hold
    playHoldSound() {
        this.playTone(450, 0.15, 'sine', 0.3);
        setTimeout(() => this.playTone(350, 0.1, 'sine', 0.2), 100);
    }

    // Système de pièce gardée
    holdPieceFunction() {
        if (!this.canHold) return;
        
        if (this.holdPiece === null) {
            this.holdPiece = {
                matrix: this.currentPiece.matrix,
                type: this.currentPiece.type
            };
            this.generateNewPiece();
        } else {
            const temp = {
                matrix: this.currentPiece.matrix,
                type: this.currentPiece.type
            };
            this.currentPiece.matrix = this.holdPiece.matrix;
            this.currentPiece.type = this.holdPiece.type;
            this.holdPiece = temp;
        }
        
        this.currentPiece.pos = {x: 3, y: 0};
        this.canHold = false;
        this.drawHoldPiece();
        this.playHoldSound();
    }

    // Fonction pour vider la pièce gardée
    clearHoldPiece() {
        if (this.holdPiece !== null) {
            this.holdPiece = null;
            this.drawHoldPiece();
            this.playTone(200, 0.2, 'square', 0.3); // Son pour la suppression
        }
    }

    // Dessin de la pièce gardée
    drawHoldPiece() {
        this.holdCtx.fillStyle = '#000';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (this.holdPiece) {
            const matrix = this.holdPiece.matrix;
            const blockSize = 20;
            const offset = {
                x: (this.holdCanvas.width - matrix[0].length * blockSize) / 2,
                y: (this.holdCanvas.height - matrix.length * blockSize) / 2
            };
            
            matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        this.holdCtx.fillStyle = this.colors[value];
                        this.holdCtx.fillRect(
                            offset.x + x * blockSize,
                            offset.y + y * blockSize,
                            blockSize,
                            blockSize
                        );
                        
                        this.holdCtx.strokeStyle = '#fff';
                        this.holdCtx.strokeRect(
                            offset.x + x * blockSize,
                            offset.y + y * blockSize,
                            blockSize,
                            blockSize
                        );
                    }
                });
            });
        }
    }

    // Gestion des touches
    handleKeyPress(event) {
        if (this.gameOver) return;
        
        // Si le jeu est en pause, ne pas traiter les touches
        if (this.isPaused) return;
        
        this.lastKeyPressed = event.keyCode;
        
        switch(event.keyCode) {
            case 37: // Gauche
                this.move(-1);
                break;
            case 39: // Droite
                this.move(1);
                break;
            case 40: // Bas
                this.drop();
                break;
            case 38: // Haut (Rotation)
                this.rotate(this.currentPiece.matrix);
                break;
            case 13: // Entrée (Hard Drop)
                event.preventDefault(); // Empêcher le comportement par défaut
                this.hardDrop();
                break;
            case 67: // C (Hold)
                this.holdPieceFunction();
                break;
            case 88: // X (Supprimer la pièce gardée)
                this.clearHoldPiece();
                break;
        }
    }

    // Calcul de la position de la ghost piece
    getGhostPosition() {
        const pos = {...this.currentPiece.pos};
        while (!this.checkCollision()) {
            this.currentPiece.pos.y++;
        }
        this.currentPiece.pos.y--;
        const ghostPos = {...this.currentPiece.pos};
        this.currentPiece.pos = pos;
        return ghostPos;
    }

    // Dessin du plateau
    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dessiner la ghost piece
        if (this.currentPiece) {
            const ghostPos = this.getGhostPosition();
            this.drawMatrix(this.currentPiece.matrix, ghostPos, true);
        }
        
        this.drawMatrix(this.board, {x: 0, y: 0});
        this.drawMatrix(this.currentPiece.matrix, this.currentPiece.pos);
        
        // Dessin de la grille
        this.ctx.strokeStyle = '#333';
        for (let i = 0; i <= this.cols; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.blockSize, 0);
            this.ctx.lineTo(i * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i <= this.rows; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.blockSize);
            this.ctx.lineTo(this.canvas.width, i * this.blockSize);
            this.ctx.stroke();
        }
    }

    // Dessin d'une matrice (pièce ou plateau)
    drawMatrix(matrix, offset, isGhost = false) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    if (isGhost) {
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    } else {
                        this.ctx.fillStyle = this.colors[value];
                        this.ctx.strokeStyle = '#fff';
                    }
                    
                    this.ctx.fillRect(
                        (x + offset.x) * this.blockSize,
                        (y + offset.y) * this.blockSize,
                        this.blockSize,
                        this.blockSize
                    );
                    
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(
                        (x + offset.x) * this.blockSize,
                        (y + offset.y) * this.blockSize,
                        this.blockSize,
                        this.blockSize
                    );
                }
            });
        });
    }

    // Dessin de la prochaine pièce
    drawNextPiece() {
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const matrix = this.nextPiece.matrix;
        const blockSize = 20;
        const offset = {
            x: (this.nextCanvas.width - matrix[0].length * blockSize) / 2,
            y: (this.nextCanvas.height - matrix.length * blockSize) / 2
        };
        
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.nextCtx.fillStyle = this.colors[value];
                    this.nextCtx.fillRect(
                        offset.x + x * blockSize,
                        offset.y + y * blockSize,
                        blockSize,
                        blockSize
                    );
                    
                    this.nextCtx.strokeStyle = '#fff';
                    this.nextCtx.strokeRect(
                        offset.x + x * blockSize,
                        offset.y + y * blockSize,
                        blockSize,
                        blockSize
                    );
                }
            });
        });
    }

    // Gestion de la pause
    togglePause() {
        this.isPaused = !this.isPaused;
        this.playPauseSound();
    }

    // Affichage du game over
    showGameOver() {
        this.playGameOverSound();
    }

    // Sons spécifiques
    playMoveSound() {
        this.playTone(300, 0.1, 'square', 0.2);
    }

    playRotateSound() {
        this.playTone(400, 0.15, 'sine', 0.3);
    }

    playDropSound() {
        this.playTone(200, 0.2, 'square', 0.4);
    }

    // Son pour la descente rapide
    playFastDropSound() {
        this.playTone(250, 0.05, 'square', 0.15);
    }

    playLineSound(lines) {
        if (lines === 4) {
            // Son spécial pour Tetris
            this.playTone(600, 0.3, 'sawtooth', 0.5);
            setTimeout(() => this.playTone(800, 0.3, 'sawtooth', 0.5), 100);
        } else {
            this.playTone(500, 0.2, 'sine', 0.4);
        }
    }

    playGameOverSound() {
        this.playTone(200, 0.3, 'sawtooth', 0.5);
        setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.5), 300);
    }

    playPauseSound() {
        this.playTone(350, 0.2, 'sine', 0.3);
    }

    playStartSound() {
        this.playTone(440, 0.2, 'sine', 0.4);
        setTimeout(() => this.playTone(880, 0.3, 'sine', 0.4), 200);
    }

    // Nettoyage des ressources lors de la destruction
    cleanup() {
        // Arrêter la boucle de jeu
        this.gameOver = true;
        this.isPaused = true;
        
        // Nettoyer les événements
        document.removeEventListener('keydown', this.handleKeyPressFunction);
        
        // Effacer les canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        // Réinitialiser les variables de jeu
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
    }

    // Boucle de jeu principale
    update(time = 0) {
        if (!this.gameOver && !this.isPaused) {
            const deltaTime = time - this.lastTime;
            this.lastTime = time;
            
            // Vérifier si le ralentissement est terminé
            if (this.slowdownEndTime > 0 && time > this.slowdownEndTime) {
                this.slowdownFactor = 1;
                this.slowdownEndTime = 0;
            }
            
            this.dropCounter += deltaTime;
            // Appliquer le facteur de ralentissement à la vitesse de chute
            const dropSpeed = (1000 - (this.level * 50)) * this.slowdownFactor;
            if (this.dropCounter > dropSpeed) {
                this.drop();
            }
            
            this.draw();
        }
        requestAnimationFrame(this.update.bind(this));
    }

    // Nouvelle méthode pour activer le ralentissement temporaire
    activateSlowdown(durationMs = 10000) {
        // Ralentir la chute des pièces de 20%
        this.slowdownFactor = 1.2;
        this.slowdownEndTime = performance.now() + durationMs;
        
        // Jouer un son pour indiquer le ralentissement
        this.playSlowdownSound();
    }
    
    // Son pour le ralentissement
    playSlowdownSound() {
        if (this.isSoundEnabled()) {
            this.playTone(300, 0.2, 'sine', 0.4);
            setTimeout(() => this.playTone(200, 0.3, 'sine', 0.4), 200);
        }
    }

    // Nouvelle méthode pour forcer la prochaine pièce à être facile (carré ou ligne droite)
    forceEasyPiece() {
        // Les pièces faciles sont le carré (O) et la ligne droite (I)
        const easyPieces = ['O', 'I'];
        const randomEasyPiece = easyPieces[Math.floor(Math.random() * easyPieces.length)];
        
        // Remplacer la prochaine pièce par une pièce facile
        this.nextPiece = {
            matrix: this.pieces[randomEasyPiece],
            pos: {x: 3, y: 0},
            type: randomEasyPiece
        };
        
        // Mettre à jour l'affichage de la prochaine pièce
        this.drawNextPiece();
        
        // Jouer un son spécial pour indiquer le cadeau
        this.playGiftSound();
    }
    
    // Son pour le cadeau surprise
    playGiftSound() {
        this.playTone(700, 0.1, 'sine', 0.4);
        setTimeout(() => this.playTone(900, 0.2, 'sine', 0.4), 100);
    }
} 
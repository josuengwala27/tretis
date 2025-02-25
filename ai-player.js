class AIPlayer extends Tetris {
    constructor() {
        super();
        
        // Remplacer les éléments du canvas
        this.canvas = document.getElementById('aiTetris');
        this.ctx = this.canvas.getContext('2d');
        
        // Configuration du canvas de l'IA (identique au joueur)
        this.canvas.width = 300;
        this.canvas.height = 600;
        this.blockSize = 30;
        this.cols = 10;
        this.rows = 20;
        
        // Désactiver les contrôles clavier pour l'IA
        document.removeEventListener('keydown', this.handleKeyPressFunction);
        
        // Paramètres spécifiques à l'IA
        this.thinkingDelay = 300; // Délai entre les décisions de l'IA (ms)
        this.lastThinkTime = 0;
        this.moveStrategy = 'leftToRight'; // Stratégie de jeu simple
        this.currentColumn = 0; // Colonne cible actuelle
        
        // Hériter de l'état du son du jeu principal
        this.soundEnabled = localStorage.getItem('tetrisSoundEnabled') === 'true';

        // Initialiser le générateur de nombres aléatoires avec une graine différente
        this.lastRandomSeed = Date.now();
    }
    
    // Surcharge de la méthode update pour inclure la logique de l'IA
    update(time = 0) {
        if (!this.gameOver && !this.isPaused) {
            const deltaTime = time - this.lastTime;
            this.lastTime = time;
            
            // Logique de chute des pièces (identique à la classe parent)
            this.dropCounter += deltaTime;
            if (this.dropCounter > 1000 - (this.level * 50)) {
                this.drop();
            }
            
            // Logique de décision de l'IA
            this.thinkCounter = (this.thinkCounter || 0) + deltaTime;
            if (this.thinkCounter > this.thinkingDelay) {
                this.makeDecision();
                this.thinkCounter = 0;
            }
            
            this.draw();
        }
        requestAnimationFrame(this.update.bind(this));
    }
    
    // Surcharge de la méthode start pour synchroniser avec le jeu principal
    start() {
        this.reset();
        this.generateNewPiece();
        this.update();
        // Ne pas jouer de son de démarrage pour l'IA
    }

    // Surcharge des méthodes de son pour réduire le volume
    playTone(frequency, duration, type = 'sine', volume = 0.5) {
        // Réduire le volume des sons de l'IA de moitié
        super.playTone(frequency, duration, type, volume * 0.5);
    }

    // Méthode pour prendre une décision de mouvement
    makeDecision() {
        if (!this.currentPiece || this.gameOver || this.isPaused) return;
        
        switch (this.moveStrategy) {
            case 'leftToRight':
                this.leftToRightStrategy();
                break;
            default:
                this.leftToRightStrategy();
                break;
        }
    }
    
    // Stratégie simple: remplir de gauche à droite
    leftToRightStrategy() {
        // Déterminer la position actuelle
        const currentX = this.currentPiece.pos.x;
        
        // Calculer la largeur de la pièce actuelle
        const pieceWidth = this.getPieceWidth(this.currentPiece.matrix);
        
        // Si nous sommes à la position cible, faire une chute instantanée
        if (currentX === this.currentColumn) {
            // Rotation aléatoire (25% de chance)
            if (Math.random() < 0.25) {
                this.rotate(this.currentPiece.matrix);
            }
            
            // Chute instantanée
            this.hardDrop();
            
            // Mettre à jour la colonne cible pour la prochaine pièce
            this.updateTargetColumn();
            return;
        }
        
        // Déplacer vers la gauche ou la droite selon la position cible
        if (currentX < this.currentColumn) {
            this.move(1); // Déplacer à droite
        } else if (currentX > this.currentColumn) {
            this.move(-1); // Déplacer à gauche
        }
    }
    
    // Mettre à jour la colonne cible selon la stratégie
    updateTargetColumn() {
        // Stratégie simple: remplir de gauche à droite
        // Trouver la colonne la plus basse
        let lowestColumn = 0;
        let lowestHeight = this.getColumnHeight(0);
        
        for (let col = 1; col < this.cols; col++) {
            const height = this.getColumnHeight(col);
            if (height < lowestHeight) {
                lowestHeight = height;
                lowestColumn = col;
            }
        }
        
        // Ajouter un peu d'aléatoire pour éviter les comportements trop prévisibles
        this.currentColumn = Math.max(0, Math.min(this.cols - 1, lowestColumn + Math.floor(Math.random() * 3) - 1));
    }
    
    // Obtenir la hauteur d'une colonne (nombre de blocs)
    getColumnHeight(col) {
        for (let row = 0; row < this.rows; row++) {
            if (this.board[row][col] !== 0) {
                return this.rows - row;
            }
        }
        return 0;
    }
    
    // Obtenir la largeur d'une pièce
    getPieceWidth(matrix) {
        let width = 0;
        for (let y = 0; y < matrix.length; y++) {
            let rowWidth = 0;
            for (let x = matrix[y].length - 1; x >= 0; x--) {
                if (matrix[y][x] !== 0) {
                    rowWidth = x + 1;
                    break;
                }
            }
            width = Math.max(width, rowWidth);
        }
        return width;
    }

    // Surcharge de cleanup pour s'assurer que toutes les ressources sont libérées
    cleanup() {
        super.cleanup();
        this.thinkCounter = 0;
        this.lastThinkTime = 0;
    }

    // Surcharge de la méthode de génération de pièce aléatoire
    getRandomPiece() {
        // Utiliser un générateur de nombres pseudo-aléatoires différent de celui du joueur
        this.lastRandomSeed = (this.lastRandomSeed * 9301 + 49297) % 233280;
        const pieces = Object.keys(this.pieces);
        const index = Math.floor((this.lastRandomSeed / 233280) * pieces.length);
        return pieces[index];
    }

    // Surcharge de la méthode de génération de nouvelle pièce
    generateNewPiece() {
        const randomPiece = this.getRandomPiece();
        if (!this.currentPiece) {
            this.currentPiece = {
                matrix: this.pieces[randomPiece],
                pos: {x: 3, y: 0},
                type: randomPiece
            };
        } else {
            this.currentPiece = this.nextPiece;
        }
        
        const nextRandomPiece = this.getRandomPiece();
        this.nextPiece = {
            matrix: this.pieces[nextRandomPiece],
            pos: {x: 3, y: 0},
            type: nextRandomPiece
        };
        
        if (this.checkCollision()) {
            this.gameOver = true;
            this.showGameOver();
        }
        
        this.drawNextPiece();
    }

    // Surcharge de la méthode draw pour assurer un rendu identique
    draw() {
        // Effacer le canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dessiner la ghost piece
        if (this.currentPiece) {
            const ghostPos = this.getGhostPosition();
            this.drawMatrix(this.currentPiece.matrix, ghostPos, true);
        }
        
        // Dessiner le plateau et la pièce courante
        this.drawMatrix(this.board, {x: 0, y: 0});
        if (this.currentPiece) {
            this.drawMatrix(this.currentPiece.matrix, this.currentPiece.pos);
        }
        
        // Dessiner le quadrillage
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        
        // Lignes verticales
        for (let i = 0; i <= this.cols; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.blockSize, 0);
            this.ctx.lineTo(i * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Lignes horizontales
        for (let i = 0; i <= this.rows; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.blockSize);
            this.ctx.lineTo(this.canvas.width, i * this.blockSize);
            this.ctx.stroke();
        }
    }

    // Surcharge de la méthode drawMatrix pour assurer un rendu identique des pièces
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

    // Surcharge de la méthode drop pour assurer une chute correcte
    drop() {
        this.currentPiece.pos.y++;
        if (this.checkCollision()) {
            this.currentPiece.pos.y--;
            this.merge();
            this.generateNewPiece();
            this.clearLines();
            this.canHold = true;
        }
        this.dropCounter = 0;
    }

    // Surcharge de la méthode clearLines pour déclencher l'événement onTwoLinesCleared
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
    
    // Surcharge de la méthode playGiftSound pour réduire le volume
    playGiftSound() {
        this.playTone(700, 0.1, 'sine', 0.2); // Volume réduit pour l'IA
        setTimeout(() => this.playTone(900, 0.2, 'sine', 0.2), 100);
    }
} 
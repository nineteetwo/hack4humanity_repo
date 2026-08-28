/**
 * ============================================================
 * DOLPHY — chess.js
 * Loaded ONLY by app.html (alongside learn.js).
 * Contains all chess game logic.
 * ============================================================
 * Depends on: app.js (DesignSystem)
 * Called by: PanelManager.show('chess') in learn.js
 * ============================================================
 */

"use strict";

/* ============================================================
   CHESS PIECE — Individual piece data & Unicode emoji
   ============================================================ */
class ChessPiece {
  static EMOJIS = {
    white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' },
  };

  constructor(type, color, row, col) {
    this.type  = type;
    this.color = color;
    this.row   = row;
    this.col   = col;
  }

  get emoji() { return ChessPiece.EMOJIS[this.color][this.type]; }
  get key()   { return `${this.row}-${this.col}`; }
}

/* ============================================================
   CHESS BOARD — Renders & manages the 8×8 grid
   ============================================================ */
class ChessBoard {
  constructor(container, game) {
    this.container = container;
    this.game      = game;
    this.squares   = {};
  }

  render() {
    this.container.innerHTML = '';
    const board = document.createElement('div');
    board.className = 'chess-board';
    board.setAttribute('role', 'grid');
    board.setAttribute('aria-label', 'Chess board');

    for (let row = 0; row < 8; row++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'chess-row';
      rowEl.setAttribute('role', 'row');

      /* Rank label */
      const rankLabel = document.createElement('div');
      rankLabel.className = 'chess-rank-label';
      rankLabel.textContent = 8 - row;
      rankLabel.setAttribute('aria-hidden', 'true');
      rowEl.appendChild(rankLabel);

      for (let col = 0; col < 8; col++) {
        const sq = document.createElement('div');
        sq.className = `chess-sq chess-sq--${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
        sq.dataset.row = row;
        sq.dataset.col = col;
        sq.setAttribute('role', 'gridcell');
        sq.setAttribute('aria-label', `${String.fromCharCode(97 + col)}${8 - row}`);
        sq.addEventListener('click', () => this.game.handleSquareClick(row, col));
        this.squares[`${row}-${col}`] = sq;
        rowEl.appendChild(sq);
      }
      board.appendChild(rowEl);
    }

    /* File labels */
    const fileRow = document.createElement('div');
    fileRow.className = 'chess-file-labels';
    fileRow.setAttribute('aria-hidden', 'true');
    const spacer = document.createElement('div');
    spacer.className = 'chess-corner-spacer';
    fileRow.appendChild(spacer);
    ['a','b','c','d','e','f','g','h'].forEach(f => {
      const lbl = document.createElement('div');
      lbl.className = 'chess-file-label';
      lbl.textContent = f;
      fileRow.appendChild(lbl);
    });
    board.appendChild(fileRow);

    this.container.appendChild(board);
    this.refresh();
  }

  refresh() {
    Object.values(this.squares).forEach(sq => {
      sq.innerHTML = '';
      sq.classList.remove('chess-sq--selected', 'chess-sq--movable', 'chess-sq--last-move');
    });

    this.game.pieces.forEach(piece => {
      const sq = this.squares[piece.key];
      if (!sq) return;
      const span = document.createElement('span');
      span.className = `chess-piece chess-piece--${piece.color}`;
      span.textContent = piece.emoji;
      span.setAttribute('aria-label', `${piece.color} ${piece.type}`);
      sq.appendChild(span);
    });

    if (this.game.selectedPiece) {
      const sq = this.squares[this.game.selectedPiece.key];
      if (sq) sq.classList.add('chess-sq--selected');
      this.game.getValidMoves(this.game.selectedPiece).forEach(([r, c]) => {
        const moveSq = this.squares[`${r}-${c}`];
        if (moveSq) moveSq.classList.add('chess-sq--movable');
      });
    }

    if (this.game.lastMove) {
      const [from, to] = this.game.lastMove;
      [this.squares[`${from[0]}-${from[1]}`], this.squares[`${to[0]}-${to[1]}`]]
        .forEach(sq => sq?.classList.add('chess-sq--last-move'));
    }
  }
}

/* ============================================================
   CHESS GAME — Full chess state & move logic
   ============================================================ */
class ChessGame {
  static initialized = false;
  static _instance   = null;

  constructor() {
    this.pieces        = [];
    this.currentTurn   = 'white';
    this.selectedPiece = null;
    this.lastMove      = null;
    this.captures      = { white: 0, black: 0 };
    this.timerSeconds  = 0;
    this.timerInterval = null;
    this._setupInitialPosition();
  }

  _setupInitialPosition() {
    const backRank = ['rook','knight','bishop','queen','king','bishop','knight','rook'];
    backRank.forEach((type, col) => this.pieces.push(new ChessPiece(type, 'black', 0, col)));
    for (let col = 0; col < 8; col++) this.pieces.push(new ChessPiece('pawn', 'black', 1, col));
    for (let col = 0; col < 8; col++) this.pieces.push(new ChessPiece('pawn', 'white', 6, col));
    backRank.forEach((type, col) => this.pieces.push(new ChessPiece(type, 'white', 7, col)));
  }

  getPieceAt(row, col) {
    return this.pieces.find(p => p.row === row && p.col === col) || null;
  }

  getValidMoves(piece) {
    const moves    = [];
    const { type, color, row, col } = piece;
    const opponent = color === 'white' ? 'black' : 'white';

    const canOccupy = (r, c) =>
      r >= 0 && r < 8 && c >= 0 && c < 8 &&
      (!this.getPieceAt(r, c) || this.getPieceAt(r, c)?.color === opponent);

    const slideMoves = (dirs) => {
      dirs.forEach(([dr, dc]) => {
        let r = row + dr, c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          if (this.getPieceAt(r, c)) {
            if (this.getPieceAt(r, c)?.color === opponent) moves.push([r, c]);
            break;
          }
          moves.push([r, c]);
          r += dr; c += dc;
        }
      });
    };

    switch (type) {
      case 'pawn': {
        const dir      = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        if (!this.getPieceAt(row + dir, col)) {
          moves.push([row + dir, col]);
          if (row === startRow && !this.getPieceAt(row + 2 * dir, col))
            moves.push([row + 2 * dir, col]);
        }
        [-1, 1].forEach(dc => {
          const t = this.getPieceAt(row + dir, col + dc);
          if (t && t.color === opponent) moves.push([row + dir, col + dc]);
        });
        break;
      }
      case 'rook':   slideMoves([[0,1],[0,-1],[1,0],[-1,0]]); break;
      case 'bishop': slideMoves([[1,1],[1,-1],[-1,1],[-1,-1]]); break;
      case 'queen':  slideMoves([[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]); break;
      case 'king':
        [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => {
          if (canOccupy(row+dr, col+dc)) moves.push([row+dr, col+dc]);
        }); break;
      case 'knight':
        [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => {
          if (canOccupy(row+dr, col+dc)) moves.push([row+dr, col+dc]);
        }); break;
    }
    return moves;
  }

  handleSquareClick(row, col) {
    const clicked = this.getPieceAt(row, col);

    if (this.selectedPiece) {
      const validMoves = this.getValidMoves(this.selectedPiece);
      const isValid    = validMoves.some(([r, c]) => r === row && c === col);

      if (isValid) {
        this._movePiece(this.selectedPiece, row, col);
        this.selectedPiece = null;
        this.board.refresh();
        return;
      }

      if (clicked && clicked.color === this.currentTurn) {
        this.selectedPiece = clicked;
        this.board.refresh();
        return;
      }

      this.selectedPiece = null;
      this.board.refresh();
      return;
    }

    if (clicked && clicked.color === this.currentTurn) {
      this.selectedPiece = clicked;
      this.board.refresh();
    }
  }

  _movePiece(piece, toRow, toCol) {
    const captured = this.getPieceAt(toRow, toCol);
    const fromRow  = piece.row;
    const fromCol  = piece.col;

    if (captured) {
      this.pieces = this.pieces.filter(p => p !== captured);
      this.captures[this.currentTurn]++;
      this._updateCaptures();
    }

    piece.row = toRow;
    piece.col = toCol;
    this.lastMove = [[fromRow, fromCol], [toRow, toCol]];
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
    this._updateTurnIndicator();
  }

  _updateCaptures() {
    const wEl = document.getElementById('chess-white-pts');
    const bEl = document.getElementById('chess-black-pts');
    if (wEl) wEl.textContent = `${this.captures.white} capture${this.captures.white !== 1 ? 's' : ''}`;
    if (bEl) bEl.textContent = `${this.captures.black} capture${this.captures.black !== 1 ? 's' : ''}`;
  }

  _updateTurnIndicator() {
    const el = document.getElementById('chess-turn');
    if (el) el.textContent = `${this.currentTurn.charAt(0).toUpperCase() + this.currentTurn.slice(1)}'s Turn`;
  }

  _startTimer() {
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      const m  = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
      const s  = String(this.timerSeconds % 60).padStart(2, '0');
      const el = document.getElementById('chess-timer');
      if (el) el.textContent = `${m}:${s}`;
    }, 1000);
  }

  static init(container) {
    ChessGame.initialized = true;
    const game = new ChessGame();

    container.innerHTML = `
      <div class="chess-page">
        <div class="chess-header">
          <h2 class="chess-title">♟️ Play Chess</h2>
          <div class="chess-controls">
            <div class="chess-stat-pill chess-stat-pill--turn">
              <span id="chess-turn">White's Turn</span>
            </div>
            <div class="chess-stat-pill chess-stat-pill--timer">
              <span>⏱</span>
              <span id="chess-timer">00:00</span>
            </div>
          </div>
        </div>

        <div class="chess-api-notice">
          <span class="chess-api-notice__icon">🔗</span>
          <span>Chess.com API integration coming soon! Enjoy a local 2-player game for now.</span>
        </div>

        <div class="chess-layout">
          <div id="chess-board-container" class="chess-board-wrap"></div>
          <div class="chess-sidebar">
            <div class="chess-info-card">
              <h4>♟ How to Play</h4>
              <ul>
                <li>Click a piece to select it</li>
                <li>Green dots show valid moves</li>
                <li>Click a green dot to move</li>
                <li>Players alternate turns</li>
              </ul>
            </div>
            <div class="chess-info-card">
              <h4>📊 Captures</h4>
              <div class="chess-captures">
                <div><span>♔ White:</span> <span id="chess-white-pts">0 captures</span></div>
                <div><span>♚ Black:</span> <span id="chess-black-pts">0 captures</span></div>
              </div>
            </div>
            <button class="clay-btn clay-btn--ghost clay-btn--full" id="chess-reset-btn">🔄 New Game</button>
          </div>
        </div>
      </div>
    `;

    const boardContainer = container.querySelector('#chess-board-container');
    game.board = new ChessBoard(boardContainer, game);
    game.board.render();
    game._startTimer();

    container.querySelector('#chess-reset-btn').addEventListener('click', () => {
      clearInterval(game.timerInterval);
      ChessGame.initialized = false;
      ChessGame.init(container);
    });

    ChessGame._instance = game;
  }
}

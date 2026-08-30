"""
Real-time multiplayer şahmatın "beyni".

Niyə burda AYRICA server-side gediş yoxlaması var, halbuki frontend-də
artıq chess.js var? Çünki WebSocket üzərindən client sadəcə "e2-dən e4-ə
getdim" deyə bir mesaj göndərir — server bunu KÖR-KÖRANƏ qəbul etsə,
hər iki oyunçu da öz ekranında istədiyi kimi hərəkət edə, hətta rəqibin
piyadasını da özününkü kimi hərəkət etdirə bilər. python-chess kitabxanası
ilə hər gediş server-də YENİDƏN yoxlanılır (qanuni gedişdirmi, növbə
kimindir və s.) — client "təklif edir", server "qərar verir".

python-chess: pip-lə qurulan, tam FIDE qaydalarını bilən kitabxanadır
(rokировка, en passant, pat, mat — hamısı daxildir).
"""

import random
from dataclasses import dataclass, field

import chess
from fastapi import WebSocket
from sqlalchemy.orm import Session

from app import models


@dataclass
class GameRoom:
    game_id: int
    board: chess.Board = field(default_factory=chess.Board)
    sockets: dict[str, WebSocket] = field(default_factory=dict)  # "white"/"black" -> ws
    white_user_id: int | None = None
    black_user_id: int | None = None


class ChessManager:
    def __init__(self):
        self.waiting_queue: list[tuple[WebSocket, models.User]] = []
        self.rooms: dict[int, GameRoom] = {}

    # ---------------- Matchmaking ----------------
    async def join_queue(self, ws: WebSocket, user: models.User, db: Session) -> GameRoom | None:
        """İkinci oyunçu gələndə cütlük yaranır və DB-də ChessGame yazılır.
        Qaytarılan dəyər None-dursa, deməli bu socket növbədə gözləyir."""
        self.waiting_queue.append((ws, user))

        if len(self.waiting_queue) < 2:
            return None

        (ws_a, user_a), (ws_b, user_b) = self.waiting_queue[:2]
        self.waiting_queue = self.waiting_queue[2:]

        # Rəngi təsadüfi seçirik — real şahmat serverlərində olduğu kimi
        if random.random() < 0.5:
            white_user, black_user = user_a, user_b
            white_ws, black_ws = ws_a, ws_b
        else:
            white_user, black_user = user_b, user_a
            white_ws, black_ws = ws_b, ws_a

        game = models.ChessGame(
            white_user_id=white_user.id,
            black_user_id=black_user.id,
            status=models.ChessGameStatus.active,
        )
        db.add(game)
        db.commit()
        db.refresh(game)

        room = GameRoom(game_id=game.id, white_user_id=white_user.id, black_user_id=black_user.id)
        self.rooms[game.id] = room

        await white_ws.send_json({
            "type": "matched", "room_id": game.id, "color": "white",
            "opponent": black_user.name or black_user.email,
        })
        await black_ws.send_json({
            "type": "matched", "room_id": game.id, "color": "black",
            "opponent": white_user.name or white_user.email,
        })
        return room

    def leave_queue(self, ws: WebSocket):
        self.waiting_queue = [(w, u) for (w, u) in self.waiting_queue if w is not ws]

    # ---------------- Live game ----------------
    def get_room(self, room_id: int) -> GameRoom | None:
        return self.rooms.get(room_id)

    def player_color(self, room: GameRoom, user_id: int) -> str | None:
        if room.white_user_id == user_id:
            return "white"
        if room.black_user_id == user_id:
            return "black"
        return None

    async def register_socket(self, room: GameRoom, color: str, ws: WebSocket):
        room.sockets[color] = ws
        # Rəqibə "qoşuldu" xəbəri
        await self._broadcast(room, {"type": "presence", "color": color, "connected": True}, exclude=ws)

    def unregister_socket(self, room: GameRoom, color: str):
        if room.sockets.get(color):
            del room.sockets[color]

    async def handle_move(self, room: GameRoom, color: str, uci_move: str, db: Session) -> dict:
        """uci_move formatı: 'e2e4' və ya promotion üçün 'e7e8q'."""
        board = room.board

        turn_color = "white" if board.turn == chess.WHITE else "black"
        if color != turn_color:
            return {"type": "error", "message": "Sənin növbən deyil"}

        try:
            move = chess.Move.from_uci(uci_move)
        except ValueError:
            return {"type": "error", "message": "Gediş formatı yanlışdır"}

        if move not in board.legal_moves:
            return {"type": "error", "message": "Bu gediş qanuni deyil"}

        san = board.san(move)
        board.push(move)

        # DB-də FEN-i yenilə ki, reconnect zamanı vəziyyət itməsin
        game = db.query(models.ChessGame).filter(models.ChessGame.id == room.game_id).first()
        if game:
            game.fen = board.fen()

        result = {
            "type": "move",
            "uci": uci_move,
            "san": san,
            "fen": board.fen(),
            "turn": "white" if board.turn == chess.WHITE else "black",
            "in_check": board.is_check(),
        }

        if board.is_game_over():
            outcome = board.outcome()
            winner = None
            if outcome and outcome.winner is True:
                winner = "white"
            elif outcome and outcome.winner is False:
                winner = "black"
            else:
                winner = "draw"

            result["type"] = "game_over"
            result["winner"] = winner
            result["reason"] = outcome.termination.name if outcome else "unknown"

            if game:
                game.status = models.ChessGameStatus.finished
                game.winner = winner
                self._award_win_bonus(db, room, winner)

        if game:
            db.commit()

        await self._broadcast(room, result)
        return result

    def _award_win_bonus(self, db: Session, room: GameRoom, winner: str | None):
        """Kiçik bonus: qazanana +25 XP. Bu da server-side hesablanır,
        eyni səbəbdən — client-ə "mən qazandım, mənə XP ver" deyə etibar
        etmirik."""
        BONUS_XP = 25
        winner_id = None
        if winner == "white":
            winner_id = room.white_user_id
        elif winner == "black":
            winner_id = room.black_user_id
        if winner_id:
            user = db.query(models.User).filter(models.User.id == winner_id).first()
            if user:
                user.xp += BONUS_XP
                user.gems += 5

    async def _broadcast(self, room: GameRoom, message: dict, exclude: WebSocket | None = None):
        for ws in room.sockets.values():
            if ws is not exclude:
                await ws.send_json(message)

    async def notify_disconnect(self, room: GameRoom, color: str):
        await self._broadcast(room, {"type": "opponent_disconnected", "color": color})


chess_manager = ChessManager()

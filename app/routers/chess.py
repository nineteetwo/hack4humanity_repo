"""
WebSocket auth qeydi: brauzerin native `new WebSocket(url)` API-si custom
header (Authorization) qoymağa icazə vermir. Ona görə JWT-ni query
param kimi göndəririk: wss://host/ws/chess/queue?token=<jwt>
Bu, HTTPS/WSS altında (production-da MÜTLƏQ belə olmalıdır) təhlükəsizdir,
çünki token TLS ilə şifrələnir. Local http/ws development üçün qəbul
edilə bilər, amma production-da wss:// (TLS) məcburidir — açıq ws://
üzərindən token göndərmək onu şəbəkədə "aça-açıq" edər.
"""

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.auth import decode_access_token
from app.chess_manager import chess_manager
from app import models, schemas

router = APIRouter(tags=["chess"])


def _get_user_from_token(token: str, db: Session) -> models.User | None:
    user_id = decode_access_token(token)
    if user_id is None:
        return None
    return db.query(models.User).filter(models.User.id == user_id).first()


@router.get("/chess/games/{room_id}")
def get_game_state(room_id: int, db: Session = Depends(get_db)):
    """Reconnect zamanı client cari FEN-i buradan çəkib lövhəni yenidən çəkə bilər."""
    game = db.query(models.ChessGame).filter(models.ChessGame.id == room_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Oyun tapılmadı")
    return {
        "room_id": game.id,
        "fen": game.fen,
        "status": game.status.value,
        "winner": game.winner,
        "white_user_id": game.white_user_id,
        "black_user_id": game.black_user_id,
    }


@router.websocket("/ws/chess/queue")
async def ws_matchmaking(websocket: WebSocket, token: str):
    db = SessionLocal()
    try:
        user = _get_user_from_token(token, db)
        if not user:
            await websocket.close(code=4401)  # 4401 = custom "unauthorized"
            return

        await websocket.accept()
        try:
            room = await chess_manager.join_queue(websocket, user, db)
            if room is None:
                # Rəqib tapılana qədər saxlanılır. Client bağlana bilər
                # (məs. səhifəni tərk etsə) — onu WebSocketDisconnect tutur.
                while True:
                    await websocket.receive_text()  # heartbeat/keepalive gözlə
        except WebSocketDisconnect:
            chess_manager.leave_queue(websocket)
    finally:
        db.close()


@router.websocket("/ws/chess/game/{room_id}")
async def ws_game(websocket: WebSocket, room_id: int, token: str):
    db = SessionLocal()
    try:
        user = _get_user_from_token(token, db)
        if not user:
            await websocket.close(code=4401)
            return

        room = chess_manager.get_room(room_id)
        if room is None:
            await websocket.close(code=4404)  # otaq yoxdur
            return

        color = chess_manager.player_color(room, user.id)
        if color is None:
            await websocket.close(code=4403)  # bu oyunun oyunçusu deyilsən
            return

        await websocket.accept()
        await chess_manager.register_socket(room, color, websocket)
        await websocket.send_json({"type": "sync", "fen": room.board.fen(), "color": color})

        try:
            while True:
                data = await websocket.receive_json()
                if data.get("type") == "move":
                    result = await chess_manager.handle_move(room, color, data["uci"], db)
                    # handle_move UĞURLU gedişi artıq broadcast edib (hər iki
                    # oyunçuya). Amma "error" halında (növbə deyil / qanunsuz
                    # gediş) YALNIZ göndərənə cavab yollamaq lazımdır — rəqibə
                    # xəbər vermək mənasızdır, o heç nə yanlış etməyib.
                    if result.get("type") == "error":
                        await websocket.send_json(result)
                elif data.get("type") == "resign":
                    winner = "black" if color == "white" else "white"
                    game = db.query(models.ChessGame).filter(models.ChessGame.id == room_id).first()
                    if game:
                        game.status = models.ChessGameStatus.finished
                        game.winner = winner
                        chess_manager._award_win_bonus(db, room, winner)
                        db.commit()
                    await chess_manager._broadcast(room, {"type": "game_over", "winner": winner, "reason": "resignation"})
        except WebSocketDisconnect:
            chess_manager.unregister_socket(room, color)
            await chess_manager.notify_disconnect(room, color)
    finally:
        db.close()

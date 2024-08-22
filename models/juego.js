const WINNER_COMBOS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

class Juegos {
    constructor() {
        this.activeGames = {};
    }

    // Crear un juego con dos jugadores
    createGame(roomId, jugador1, jugador2) {
        this.activeGames[roomId] = {
            board: Array(9).fill(null),
            turn: 'X',
            players: [jugador1, jugador2], // Almacena los dos jugadores
        };
    }

    // Realizar un movimiento en el juego
    makeMove(roomId, index, jugadorId) {
        const juego = this.activeGames[roomId];
        
        if (juego && juego.board[index] === null && juego.turn === (jugadorId === juego.players[0] ? 'X' : 'O')) {
            juego.board[index] = juego.turn;
            juego.turn = juego.turn === 'X' ? 'O' : 'X';
            
            return {
                board: juego.board,
                turn: juego.turn,
                winner: this.checkWinner(juego.board),
                isDraw: juego.board.every(square => square !== null)
            };
        }
        return null;
    }

    // Verificar si hay un ganador
    checkWinner(board) {
        for (const combo of WINNER_COMBOS) {
            const [a, b, c] = combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    // Terminar el juego
    endGame(roomId) {
        delete this.activeGames[roomId];
    }

    // Reiniciar el juego
    resetGame(roomId) {
        if (this.activeGames[roomId]) {
            const players = this.activeGames[roomId].players;
            this.activeGames[roomId] = {
                board: Array(9).fill(null),
                turn: 'X',
                players: players,
            };
        }
    }
}

module.exports = Juegos;

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
    constructor(io) {
        this.activeGames = {};
        this.io = io; 
    }

    createGame(roomId, jugador1, jugador2) {
        this.activeGames[roomId] = {
            board: Array(9).fill(null),
            turn: 'X',
            players: [jugador1, jugador2],
        };
    }

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

    checkWinner(board) {
        for (const combo of WINNER_COMBOS) {
            const [a, b, c] = combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    endGame(roomId) {
        delete this.activeGames[roomId];
    }

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

    iniciarJuego(ListaDeEspera, JugadoresEnJuego) {
        if (ListaDeEspera.length >= 2) {
            const jugador1 = ListaDeEspera.shift();
            const jugador2 = ListaDeEspera.shift(); 

            const roomId = `${jugador1.id}+${jugador2.id}`; 
            jugador1.join(roomId); 
            jugador2.join(roomId); 

            JugadoresEnJuego.push({ id: jugador1.id, roomId });
            JugadoresEnJuego.push({ id: jugador2.id, roomId });

            console.log(`Jugadores emparejados: ${jugador1.id} y ${jugador2.id}`);

            this.createGame(roomId, jugador1.id, jugador2.id);
            this.io.to(roomId).emit('gameStart', { roomId, turn: 'X' });
        }
    }

    removerJugadorPerdedor(perdedorId, roomId, ListaDeEspera, JugadoresEnJuego) {
        JugadoresEnJuego = JugadoresEnJuego.filter(player => player.id !== perdedorId);

        if (ListaDeEspera.length > 0) {
            const nuevoJugador = ListaDeEspera.shift();
            nuevoJugador.join(roomId);

            JugadoresEnJuego.push({ id: nuevoJugador.id, roomId });

            this.resetGame(roomId);
            this.io.to(roomId).emit('gameReset', { board: Array(9).fill(null), turn: 'X' });
            console.log(`Nuevo jugador ${nuevoJugador.id} se unió a la sala ${roomId}`);
        } else {
            this.endGame(roomId);
            console.log(`No hay más jugadores en la lista de espera. El juego en la sala ${roomId} ha terminado.`);
        }
    }
}

module.exports = Juegos;

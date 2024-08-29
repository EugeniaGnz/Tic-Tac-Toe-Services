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

            console.log(`Jugadores entrando a la sala: ${jugador1.id} y ${jugador2.id}`);

            this.createGame(roomId, jugador1.id, jugador2.id);
            this.io.to(roomId).emit('gameStart', { roomId, turn: 'X' });
        }
    }

    removerJugadorPerdedor(perdedorId, roomId, ListaDeEspera, JugadoresEnJuego) {
        JugadoresEnJuego = JugadoresEnJuego.filter(player => player.id !== perdedorId);

        const perdedorSocket = this.io.sockets.sockets.get(perdedorId);
        if (perdedorSocket) {
            ListaDeEspera.push(perdedorSocket);
            console.log(`Jugador ${perdedorId} ha sido añadido a la lista el perdedor`);
        }

        if (ListaDeEspera.length > 0) {
            const nuevoJugador = ListaDeEspera.shift();
            nuevoJugador.join(roomId);

            JugadoresEnJuego.push({ id: nuevoJugador.id, roomId });

        } else {
            this.endGame(roomId);
            console.log(`No hay más jugadores en la lista de espera. `);
        }
    }

    removerJugadoresEmpate(roomId, ListaDeEspera, JugadoresEnJuego) {
            const juego = this.activeGames[roomId];

            if (juego) {
                const [jugador1Id, jugador2Id] = juego.players;

                JugadoresEnJuego = JugadoresEnJuego.filter(player => player.id !== jugador1Id && player.id !== jugador2Id);

                const jugador1Socket = this.io.sockets.sockets.get(jugador1Id);
                const jugador2Socket = this.io.sockets.sockets.get(jugador2Id);

                // Añadir ambos jugadores a la lista de espera
                if (jugador1Socket) {
                    ListaDeEspera.push(jugador1Socket);
                    console.log(`Jugador ${jugador1Id} añadido a la lista de espera `);
                }
                if (jugador2Socket) {
                    ListaDeEspera.push(jugador2Socket);
                    console.log(`Jugador ${jugador2Id} añadido a la lista de espera`);
                }

                //  Para poder mandar cosas es en menssage
                if (jugador1Socket) jugador1Socket.emit('gameEnd', { message: 'Empate. se va a lista de espera' });
                if (jugador2Socket) jugador2Socket.emit('gameEnd', { message: 'Empate. se va a lista de espera' });

                this.endGame(roomId);

                // Reiniciar el juego  en la lista de espera
                if (ListaDeEspera.length >= 2) {
                    this.iniciarJuego(ListaDeEspera, JugadoresEnJuego);
                    console.log(`Se ha reiniciado el juego con los jugadores disponibles en la lista de espera.`);
                }
            }
        }
        //funcion para irse a la lista de espectadores
    moverAEspectadores(jugadorId, ListaDeEspera, ListaDeEspectadores) {
        const jugadorIndex = ListaDeEspera.findIndex(j => j.id === jugadorId);
        if (jugadorIndex !== -1) {
            const [jugador] = ListaDeEspera.splice(jugadorIndex, 1);
            ListaDeEspectadores.push(jugador);
            console.log(`Jugador ${jugadorId} movido a espectadores.`);
        }
    }

    //Funcion para mover a la lista de espera 

    moverAListaDeEspera(jugadorId, ListaDeEspectadores, ListaDeEspera) {
        const espectadorIndex = ListaDeEspectadores.findIndex(j => j.id === jugadorId);
        if (espectadorIndex !== -1) {
            const [espectador] = ListaDeEspectadores.splice(espectadorIndex, 1);
            ListaDeEspera.push(espectador);
            console.log(`Espectador ${jugadorId} movido a lista de espera.`);
        }
    }


}

module.exports = Juegos;
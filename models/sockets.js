const Juegos = require('./juego');

class Sockets {
    constructor(io) {
        this.io = io;
        this.ListaDeEspera = [];
        this.ListaDeEspectadores = [];
        this.JugadoresEnJuego = [];
        this.juegos = new Juegos(io);

        this.socketEvents();
    }

    socketEvents() {
        this.io.on('connection', (socket) => {
            console.log('Jugador conectado:', socket.id);

            socket.on('login', ({ username, role }) => {
                socket.username = username;
                socket.role = role;

                if (role === 'player') {
                    this.ListaDeEspera.push(socket);
                    console.log(`Jugador ${username} añadido a la lista de espera.`);

                    if (this.ListaDeEspera.length >= 2) {
                        this.juegos.iniciarJuego(this.ListaDeEspera, this.JugadoresEnJuego);
                    }
                } else if (role === 'spectator') {
                    this.ListaDeEspectadores.push(socket);
                    console.log(`Espectador ${username} añadido a la lista de espectadores.`);
                }

                this.emitirListaDeEspera();
                this.emitirListaDeEspectadores();
                this.emitirConteoDeEspectadores();
            });

            socket.on('makeMove', (data) => {
                const { roomId, index } = data;
                const moveResult = this.juegos.makeMove(roomId, index, socket.id);

                if (moveResult) {
                    const { board, turn, winner, isDraw } = moveResult;

                    if (winner) {
                        this.io.to(roomId).emit('gameEnd', { winner });
                        console.log('Juego terminado');
                        this.juegos.removerJugadorPerdedor(socket.id, roomId, this.ListaDeEspera, this.JugadoresEnJuego);
                    } else if (isDraw) {
                        this.juegos.endGame(roomId);
                        console.log('Fue empate');
                        this.juegos.removerJugadoresEmpate(roomId, this.ListaDeEspera, this.JugadoresEnJuego);
                        this.juegos.resetGame(roomId);
                        this.io.to(roomId).emit('gameEnd', { winner: 'Empate' });
                        this.io.to(roomId).emit('gameReset', { board: Array(9).fill(null), turn: 'X' });
                    } else {
                        this.io.to(roomId).emit('updateBoard', { board, turn });
                    }

                    // Transmitir la actualización del tablero a los espectadores
                    this.io.to(roomId).emit('updateBoard', { board, turn });
                }
            });

            socket.on('resetGame', () => {
                const roomId = [...socket.rooms].find(room => room !== socket.id);
                if (roomId) {
                    console.log('Juego reiniciado');
                    this.juegos.resetGame(roomId);
                    this.io.to(roomId).emit('gameReset', { board: Array(9).fill(null), turn: 'X' });
                }
            });

            socket.on('disconnect', () => {
                console.log('Jugador desconectado:', socket.id);

                if (socket.role === 'player') {
                    this.ListaDeEspera = this.ListaDeEspera.filter(player => player.id !== socket.id);
                } else if (socket.role === 'spectator') {
                    this.ListaDeEspectadores = this.ListaDeEspectadores.filter(spectator => spectator.id !== socket.id);
                }

                console.log('Lista de espera actual:', this.ListaDeEspera.map(s => s.username));
                console.log('Lista de espectadores actual:', this.ListaDeEspectadores.map(s => s.username));

                const roomId = [...socket.rooms].find(room => room !== socket.id);
                if (roomId && this.juegos.activeGames[roomId]) {
                    this.io.to(roomId).emit('gameEnd', { message: 'El jugador se desconectó' });
                    this.juegos.endGame(roomId);
                    this.juegos.removerJugadorPerdedor(socket.id, roomId, this.ListaDeEspera, this.JugadoresEnJuego);
                    console.log('Juego terminado por desconexión del jugador');
                }

                this.emitirListaDeEspera();
                this.emitirListaDeEspectadores();
                this.emitirConteoDeEspectadores();
            });

            socket.on('moverAEspectadores', () => {
                this.juegos.moverAEspectadores(socket.id, this.ListaDeEspera, this.ListaDeEspectadores);
                this.emitirListaDeEspera();
                this.emitirListaDeEspectadores();
                this.emitirConteoDeEspectadores();
            });

            socket.on('moverAListaEspera', () => {
                this.juegos.moverAListaDeEspera(socket.id, this.ListaDeEspectadores, this.ListaDeEspera);
                this.emitirListaDeEspera();
                this.emitirListaDeEspectadores();
                this.emitirConteoDeEspectadores();
            });
        });
    }

    emitirListaDeEspera() {
        this.io.emit('actualizarListaDeEspera', this.ListaDeEspera.map(s => ({ id: s.id, username: s.username })));
    }

    emitirListaDeEspectadores() {
        this.io.emit('actualizarListaDeEspectadores', this.ListaDeEspectadores.map(s => ({ id: s.id, username: s.username })));
    }

    emitirConteoDeEspectadores() {
        const conteoEspectadores = this.ListaDeEspectadores.length;
        this.io.emit('actualizarConteoDeEspectadores', { conteo: conteoEspectadores });
    }
}

module.exports = Sockets;


module.exports = Sockets;

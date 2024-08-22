const Juegos = require('./juego');

class Sockets {
    constructor(io) {
        this.io = io;
        this.ListaDeEspera = []; 
        this.juegos = new Juegos(); 

        this.socketEvents();
    }

    socketEvents() {
        this.io.on('connection', (socket) => {
            console.log('Jugador conectado:', socket.id);

            this.ListaDeEspera.push(socket);
            console.log('Usuarios en lista en espera', this.ListaDeEspera.map(s => s.id));

            if (this.ListaDeEspera.length >= 2) {
                const jugador1 = this.ListaDeEspera.shift(); 
                const jugador2 = this.ListaDeEspera.shift(); 
             
                const roomId = `${jugador1.id}+${jugador2.id}`; 
                jugador1.join(roomId);
                jugador2.join(roomId);

                console.log(`Jugadores emparejados: ${jugador1.id} y ${jugador2.id} `);

                this.juegos.createGame(roomId, jugador1.id, jugador2.id); 
                this.io.to(roomId).emit('gameStart', { roomId, turn: 'X' });
            }

            socket.on('makeMove', (data) => {
                const { roomId, index } = data;

                const moveResult = this.juegos.makeMove(roomId, index, socket.id);

                if (moveResult) {
                    const { board, turn, winner, isDraw } = moveResult;

                    if (winner) {
                        this.io.to(roomId).emit('gameEnd', { winner });
                        this.juegos.endGame(roomId);
                        console.log(`Juego terminado`);

                    } else if (isDraw) {
                        this.io.to(roomId).emit('gameEnd', { winner: 'Empate' });
                        this.juegos.endGame(roomId);
                        console.log(`fue empate`);

                    } else {
                        this.io.to(roomId).emit('updateBoard', { board, turn });
                    }
                }
            });

            // Manejar reinicio del juego
            socket.on('resetGame', () => {
                const roomId = [...socket.rooms].find(room => room !== socket.id);
                if (roomId) {
                    console.log(`Juego reiniciado en la sala ${roomId}`);
                    this.juegos.resetGame(roomId);
                    this.io.to(roomId).emit('gameReset', { board: Array(9).fill(null), turn: 'X' });
                }
            });

            // Manejar desconexión de jugadores
            socket.on('disconnect', () => {
                console.log('Jugador desconectado:', socket.id);

                // Eliminar de la lista de espera
                this.ListaDeEspera = this.ListaDeEspera.filter(player => player.id !== socket.id);
                console.log('Lista de espera actual:', this.ListaDeEspera.map(s => s.id));

                // Terminar la partida si el jugador estaba en una
                const roomId = [...socket.rooms].find(room => room !== socket.id);
                if (roomId && this.juegos.activeGames[roomId]) {
                    console.log(`Juego terminado en la sala ${roomId}, el oponente se desconectó`);
                    this.io.to(roomId).emit('gameEnd', { message: 'El oponente se desconectó' });
                    this.juegos.endGame(roomId);
                }
            });
        });
    }
}

module.exports = Sockets;

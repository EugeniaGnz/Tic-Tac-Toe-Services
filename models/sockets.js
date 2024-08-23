const Juegos = require('./juego');

class Sockets {
    constructor(io) {
        this.io = io;
        this.ListaDeEspera = []; 
        this.JugadoresEnJuego = [];
        this.juegos = new Juegos(io); 

        this.socketEvents();
    }

    socketEvents() {
        this.io.on('connection', (socket) => {
            console.log('Jugador conectado:', socket.id);

            this.ListaDeEspera.push(socket);
            console.log('Usuarios en lista de espera', this.ListaDeEspera.map(s => s.id));
        
            if (this.ListaDeEspera.length >= 2) {
                this.juegos.iniciarJuego(this.ListaDeEspera, this.JugadoresEnJuego);
            }

            socket.on('makeMove', (data) => {
                const { roomId, index } = data;
            
                const moveResult = this.juegos.makeMove(roomId, index, socket.id);
            
                if (moveResult) {
                    const { board, turn, winner, isDraw } = moveResult;
            
                    if (winner) {
                        this.io.to(roomId).emit('gameEnd', { winner });
                        console.log(`Juego terminado`);
                         //se elimina cuando pierde
                        this.juegos.removerJugadorPerdedor(socket.id, roomId, this.ListaDeEspera, this.JugadoresEnJuego);
            
                    } else if (isDraw) {
                        this.juegos.endGame(roomId);
                        console.log(`fue empate`);

            
                        this.juegos.removerJugadoresEmpate(roomId, this.ListaDeEspera, this.JugadoresEnJuego);
                        this.juegos.resetGame(roomId);
                        this.io.to(roomId).emit('gameEnd', { winner: 'Empate' });

                        this.io.to(roomId).emit('gameReset', { board: Array(9).fill(null), turn: 'X' });
            
                    } else {
                        this.io.to(roomId).emit('updateBoard', { board, turn });
                    }
                }
            });
            

            socket.on('resetGame', () => {
                const roomId = [...socket.rooms].find(room => room !== socket.id);
                if (roomId) {
                    console.log(`Juego reiniciado}`);
                    this.juegos.resetGame(roomId);
                    this.io.to(roomId).emit('gameReset', { board: Array(9).fill(null), turn: 'X' });
                }
            });

            socket.on('disconnect', () => {
                console.log('Jugador desconectado:', socket.id);

                this.ListaDeEspera = this.ListaDeEspera.filter(player => player.id !== socket.id);
                console.log('Lista de espera actual:', this.ListaDeEspera.map(s => s.id));

                const roomId = [...socket.rooms].find(room => room !== socket.id);
                if (roomId && this.juegos.activeGames[roomId]) {
                    this.io.to(roomId).emit('gameEnd', { message: 'El jugador se desconectó' });
                    this.juegos.endGame(roomId);
                    //Si gana se va a el usuario a la lista de espera
                    this.juegos.removerJugadorPerdedor(socket.id, roomId, this.ListaDeEspera, this.JugadoresEnJuego);

                    console.log(`Juego terminado se desconecto el jugador`);

                }
            });
        });
    }
}

module.exports = Sockets;

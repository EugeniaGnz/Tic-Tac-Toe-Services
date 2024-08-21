const { v4: uuidv4 } = require('uuid');

class Partido {
    color = {
        r: Math.trunc(Math.random() * 255),
        g: Math.trunc(Math.random() * 255),
        b: Math.trunc(Math.random() * 255),
    }

    constructor(nombre) {

        this.id = uuidv4();
        this.nombre = nombre;
        this.votos = 0;
        this.backgroundColor = `rgba(${this.color.r},${this.color.g},${this.color.b}, 0.2)`;
        this.borderColor = `rgba(${this.color.r},${this.color.g},${this.color.b}, 1)`;
        this.hoverBackgroundColor = `rgba(${this.color.r},${this.color.g},${this.color.b}, 0.4)`;
    }

}

module.exports = Partido;

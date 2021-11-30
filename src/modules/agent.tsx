import { map } from "./math";
import { Line, Vector } from "./models";
import NeuralNetwork from "../thirdparty/nn"

export interface AgentSettings {
    dirX: number,
    dirY: number,
    velReduction: number,
    steerRange: number,
    startPos: Vector,
    sensorSettings: SensorSettings
}

export interface SensorSettings {
    fov: number,
    num: number,
    len: number
}

export interface Sensor {
    rot: number,
    pos: Vector
}

class Agent {
    pos: Vector
    settings: AgentSettings
    size: Vector
    alive: boolean
    isBest: boolean
    reachedCheckpoints: number
    acc: Vector
    vel: Vector
    dir: Vector
    sensors: Sensor[]
    checkpoints: Line[]
    nn: NeuralNetwork

    constructor(settings: AgentSettings, nn?: NeuralNetwork) {
        if (nn) {
            this.nn = nn.copy()
        } else {
            this.nn = new NeuralNetwork(10, 4, 2)
        }
        this.pos = settings.startPos.copy();

        this.settings = settings

        this.size = new Vector(20, 40)
        this.reset()

        this.alive = true
        this.isBest = false
        this.reachedCheckpoints = 0
        this.initSensors(settings.sensorSettings)
    }

    reset() {
        this.acc = new Vector(0, 0)
        this.vel = new Vector(0, 0)
        this.dir = new Vector(this.settings.dirX, this.settings.dirY)
    }

    initSensors(settings) {
        this.sensors = []
        const { fov, num, len } = settings

        for (let i = 0; i < num; i++) {
            this.sensors.push({
                rot: Math.floor(map(i, 0, num - 1, 90 - (fov / 2), 90 + (fov / 2))),
                pos: new Vector(0, - len),
            })
        }

    }
    /* 
        initNeuralNet(nn) {
            if (nn) {
                //this.nn = nn
            } else {
                //this.nn = new NeuralNetwork(this.sensors.length * this.inputFactor + 2, Math.floor((this.sensors.length + 2) / 2), 2)
                const inNodes = this.sensors.length
                const hiddenNodes = Math.floor((this.sensors.length + 2) / 2)
                const outputNodes = 2
                //this.nn = new NeuralNetwork(inNodes, hiddenNodes, outputNodes)
            }
        }
     */
    kill() {
        this.alive = false;
    }

    heading() {
        return this.dir.heading()
    }

    update(input) {
        const output = this.nn.predict(input)
        const velMag = this.vel.mag()

        const steer = map(output[0], 0, 1, -this.settings.steerRange, this.settings.steerRange)
        this.dir.rotate(steer * velMag)
        this.acc = new Vector(0, 0)
        const accChange = map(output[1], 0, 1, -1, 1)
        this.acc.add(new Vector(accChange, 0).rotate(this.dir.heading()).mult(accChange))
        this.acc.add(this.dir.copy().mult(1 / (1 + velMag)))
        this.vel.add(this.acc)

        this.pos.add(this.vel)

        this.vel.div(this.settings.velReduction)
    }
}

function getAcc(tractionForce, fDrag, fRoll) {
    return tractionForce.add(fDrag).add(fRoll)
}

function getFDrag(vel) {
    const cDrag = 0.0015
    const magVel = vel.mag()
    return vel.copy().mult(cDrag * magVel)
}

function getFRoll(vel) {
    const cRoll = 0.05
    return vel.copy().mult(-cRoll)
}

export default Agent
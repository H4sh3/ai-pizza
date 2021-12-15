import { map } from "../etc/math";
import { Line } from "./models";
import NeuralNetwork from "../thirdparty/nn"
import { Node } from './models'
import { randInt } from "../etc/math";
import Vector from "../models/vector";

export interface AgentSettings {
    velReduction: number[],
    steerRange: number,
    sensorSettings: SensorSettings
}

export interface SpawnSettings {
    direction: Vector,
    startNode: Node
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

export interface Task {
    start: Node,
    target: Node,
    delivered: boolean,
}

class Agent {
    pos: Vector
    settings: AgentSettings
    spawnSettings: SpawnSettings
    size: Vector
    alive: boolean
    reachedCheckpoints: number
    overallCheckpoints: number
    acc: Vector
    vel: Vector
    dir: Vector
    sensors: Sensor[]

    task: Task | undefined
    route: Line[]

    nn: NeuralNetwork
    tickSinceLastCP: number
    lifetime: number
    color: {
        r: number,
        g: number,
        b: number,
        h: number,
    }
    highlighted: boolean

    constructor(spawnSettings: SpawnSettings, settings: AgentSettings, nn?: NeuralNetwork) {
        const hidL = Math.floor(((settings.sensorSettings.num * 2) + 2) / 2)
        if (nn) {
            this.nn = nn.copy()
        } else {
            this.nn = new NeuralNetwork(settings.sensorSettings.num * 2, hidL, 2)
        }
        this.spawnSettings = spawnSettings
        this.pos = this.spawnSettings.startNode.pos.copy();

        this.settings = settings

        this.size = new Vector(20, 40)
        this.reset()
        this.initSensors(settings.sensorSettings)
        this.overallCheckpoints = 0
        this.reachedCheckpoints = 0
        this.lifetime = 0

        this.color = {
            r: randInt(0, 256),
            g: randInt(0, 256),
            b: randInt(0, 256),
            h: randInt(0, 101),
        }
        this.highlighted = false

        this.route = []
        this.task = undefined
    }

    reset() {
        this.pos = this.spawnSettings.startNode.pos.copy()
        this.acc = new Vector(0, 0)
        this.vel = new Vector(0, 0)
        this.dir = new Vector(this.spawnSettings.direction.x, this.spawnSettings.direction.y)
        this.alive = true
        this.reachedCheckpoints = 0
        this.tickSinceLastCP = 0
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

    kill() {
        this.alive = false;
    }

    heading() {
        return this.dir.heading()
    }

    update(input, speedLevel: number) {
        this.lifetime++
        const output = this.nn.predict(input)
        const velMag = this.vel.mag()

        const steer = map(output[0], 0, 1, -this.settings.steerRange, this.settings.steerRange)
        this.dir.rotate(steer * velMag)
        this.acc = new Vector(0, 0)
        const accChange = map(output[1], 0, 1, -1, 1)
        const x = new Vector(accChange, 0)
        x.rotate(this.dir.heading()).mult(accChange)
        this.acc.add(x)
        this.acc.add(this.dir.copy().mult(1 / (1 + velMag)))
        this.vel.add(this.acc)

        this.pos.add(this.vel)

        this.vel.div(this.settings.velReduction[speedLevel])
    }
}

export default Agent
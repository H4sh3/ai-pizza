import { map } from "./math";
import { Line, Vector } from "./models";
import NeuralNetwork from "../thirdparty/nn"
import { Node } from './models'
import { directionOfNodes } from './gym'

export interface AgentSettings {
    velReduction: number,
    steerRange: number,
    sensorSettings: SensorSettings
}

export interface SpawnSettings {
    direction: Vector,
    startPos: Vector
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
    spawnSettings: SpawnSettings
    size: Vector
    alive: boolean
    isBest: boolean
    reachedCheckpoints: number
    overallCheckpoints: number
    acc: Vector
    vel: Vector
    dir: Vector
    sensors: Sensor[]
    checkpoints: Line[]
    nn: NeuralNetwork
    tickSinceLastCP: number
    route: Node[]
    lifetime: number

    constructor(spawnSettings: SpawnSettings, settings: AgentSettings, nn?: NeuralNetwork) {
        const hidL = Math.floor(((settings.sensorSettings.num * 2) + 2) / 2)
        if (nn) {
            this.nn = nn.copy()
        } else {
            this.nn = new NeuralNetwork(settings.sensorSettings.num * 2, hidL, 2)
        }
        this.spawnSettings = spawnSettings
        this.pos = this.spawnSettings.startPos.copy();

        this.settings = settings

        this.size = new Vector(20, 40)
        this.reset()
        this.initSensors(settings.sensorSettings)
        this.overallCheckpoints = 0
        this.reachedCheckpoints = 0
        this.lifetime = 0
    }

    changeRoute(route) {
        this.route = route
        this.spawnSettings.direction = directionOfNodes(route[0], route[1])
        this.spawnSettings.startPos = route[0].pos.copy();
        this.pos = this.spawnSettings.startPos.copy()
    }

    reset() {
        this.pos = this.spawnSettings.startPos.copy()
        this.acc = new Vector(0, 0)
        this.vel = new Vector(0, 0)
        this.dir = new Vector(this.spawnSettings.direction.x, this.spawnSettings.direction.y)
        this.alive = true
        this.isBest = false
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

    update(input) {
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

        this.vel.div(this.settings.velReduction)
    }
}

export default Agent
import search from "../etc/astar"
import NeuralNetwork from "../thirdparty/nn"
import Agent, { AgentSettings, SpawnSettings } from "./agent"
import { NODE_SIZE } from "./const"
import { agentsCollisions, directionOfNodes, getAllRoutesDict, getCheckpoints, getSensorIntersectionsWith, transformSensor } from "./etc"
import genRandomCity, { randInt } from "./maps/cityGeneration"
import generateRandomTrainingsMap, { shuffle } from "./maps/trainingsGeneration"
import { PretrainedModel2 } from "./model"
import { Line, Node, Vector } from "./models"

class Sector {
    x1: number
    x2: number
    y1: number
    y2: number
    elements: Line[]
    constructor(x1, y1, x2, y2) {
        this.x1 = x1
        this.x2 = x2
        this.y1 = y1
        this.y2 = y2

        this.elements = []
    }

    inside(v: Vector) {
        return v.x >= this.x1 &&
            v.x <= this.x2 &&
            v.y >= this.y1 &&
            v.y <= this.y2
    }
}

export class Gym {
    width: number
    height: number
    mostCheckpoints: number
    bestNeuralNet: NeuralNetwork | undefined
    epoch: number
    nodes: Node[]
    agents: Agent[]
    roads: Line[]
    checkpoints: Line[]

    // vis stuff
    intersections: Vector[]
    sensorVisual: Line[]
    agentSettings: AgentSettings
    settings: {
        popSize: number,
    }
    maxIter: number
    iteration: number
    pretrainEpoch: number
    pretrainEpochs: number
    pretrain: boolean
    route: Node[]

    allRoutes: { l: number, routes: Node[][] }[]
    selectedRoutes: Node[][]

    crashed: Agent[]
    fewestCrashes: number

    constructor(width, height) {
        this.width = width
        this.height = height
        this.agentSettings = {
            steerRange: 10,
            velReduction: 1.25,
            sensorSettings: {
                num: 9,
                len: NODE_SIZE * 3,
                fov: 250
            }
        }

        this.settings = {
            popSize: 1
        }

        this.mostCheckpoints = -1
        this.epoch = 0
        this.iteration = 0
        this.pretrainEpoch = 0
        this.pretrainEpochs = 100
        this.pretrain = false
        this.maxIter = 10000

        this.intersections = []
        this.sensorVisual = []
        this.allRoutes = []
        this.selectedRoutes = []
        this.crashed = []
        this.fewestCrashes = Infinity

        this.bestNeuralNet = NeuralNetwork.deserialize(PretrainedModel2)

        this.init()
    }

    init() {
        this.nodes = generateRandomTrainingsMap(250)

        this.allRoutes = getAllRoutesDict(this.nodes)
        for (let i = 0; i < 10; i++) {
            this.allRoutes[i].routes.forEach(r => {
                this.selectedRoutes.push(r)
            })
        }

        this.addAgents()
        this.addRoads()
    }

    addRoads() {
        const usedIds: number[] = []
        this.roads = this.nodes.reduce((acc, n) => {
            return acc.concat(n.getLines(usedIds))
        }, [])
    }

    addAgents() {
        this.agents = []
        for (let i = 0; i < this.settings.popSize; i++) {
            this.spawnAgent(this.getRandomRoute())
        }
    }

    getRandomRoute() {
        return this.selectedRoutes[randInt(0, this.selectedRoutes.length - 1)]
    }

    spawnAgent(route: Node[], mutate: boolean = false) {
        const spawnSettings: SpawnSettings = {
            direction: directionOfNodes(route[0], route[1]),
            startPos: route[0].pos.copy(),
        }

        const agent = new Agent(spawnSettings, this.agentSettings)
        if (this.bestNeuralNet) {
            agent.nn = this.bestNeuralNet.copy()
        }
        if (mutate) agent.nn.mutate(0.1)

        agent.route = route
        agent.checkpoints = getCheckpoints(route)

        this.agents.push(agent)
    }

    step() {
        const evaluate = () => {
            console.log("-----")
            // eval
            this.iteration = 0

            const allAgents = [...this.agents, ...this.crashed]
            allAgents.sort((a, b) => a.lifetime > b.lifetime ? -1 : 0)

            const lifetime = allAgents[0].lifetime
            if (lifetime > this.mostCheckpoints) {
                console.log({ lifetime })
                //this.pretrain = false
                this.mostCheckpoints = lifetime
                this.bestNeuralNet = allAgents[0].nn.copy()
            }

            if (this.pretrain && this.pretrainEpoch > this.pretrainEpochs) {
                this.pretrain = false
            } else {
                this.pretrainEpoch++
            }

            console.log(`Crashed: ${this.crashed.length}`)
            console.log(`Checkpoints: ${this.mostCheckpoints}`)


            this.crashed = []

            this.agents = []

            this.epoch++
        }

        const updateAgents = () => {
            this.intersections = []
            this.sensorVisual = []

            this.agents.filter(a => !a.alive).map(dead => {
                this.crashed.push(dead)
            })

            this.agents = this.agents.filter(a => a.alive)
            this.agents = this.agents.filter(a => a.tickSinceLastCP < 100)

            this.agents.forEach(a => {
                // transform sensors to current position & direction
                const transformedSensors = a.sensors.map(sensor => transformSensor(sensor, a))
                this.sensorVisual = [...this.sensorVisual, ...transformedSensors]
                const roadIntersections = getSensorIntersectionsWith(a, transformedSensors, this.roads)
                this.intersections = [...this.intersections, ...roadIntersections[1]]
                const checkpointIntersections = getSensorIntersectionsWith(a, transformedSensors, [a.checkpoints[a.reachedCheckpoints % a.checkpoints.length]])
                const inputs = [...roadIntersections[0], ...checkpointIntersections[0]]
                const reachedLastCheckpoint = agentsCollisions(a, this.roads, a.checkpoints)

                if (reachedLastCheckpoint) {
                    const newRoute = this.getNewRouteFrom(a.route[a.route.length - 1])
                    const dir = directionOfNodes(newRoute[0], newRoute[1])
                    a.checkpoints = getCheckpoints(newRoute)
                    a.spawnSettings.direction = dir
                    a.spawnSettings.startPos = newRoute[0].pos.copy()
                    a.route = newRoute
                    a.reset()
                }

                a.update(inputs)
                a.highlighted = false
            })

            this.agents.sort((a, b) => a.lifetime > b.lifetime ? -1 : 0)
            this.agents[0].highlighted = true
        }

        const loop = () => {
            const alive = this.agents.filter(a => a.alive).length
            if (this.iteration < this.maxIter && alive > 0) {
                // update agents
                updateAgents()
                this.iteration++
            } else {
                evaluate()
                this.iteration = 0
                if (this.pretrain) {
                    this.pretrainEpoch++
                }
            }

            while (this.agents.length < this.settings.popSize) {
                const route = this.selectedRoutes[randInt(0, this.selectedRoutes.length - 1)]
                this.spawnAgent(route, true)
            }
        }

        while (this.pretrain) {
            loop()
        }
        loop()
    }

    getNewRouteFrom(sNode: Node): Node[] {
        let r
        let found = false

        while (!found) {
            let lr = this.allRoutes[randInt(0, this.allRoutes.length - 1)]

            if (found) return
            shuffle(lr.routes)
            lr.routes.forEach(route => {
                if (found) return
                if (route[0].id === sNode.id) {
                    r = route
                    found = true
                }
            })
        }

        return r
    }
}

export default Gym
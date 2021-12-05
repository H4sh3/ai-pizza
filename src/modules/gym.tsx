import search from "../etc/astar"
import NeuralNetwork from "../thirdparty/nn"
import Agent, { AgentSettings, Sensor, SpawnSettings } from "./agent"
import { NODE_SIZE } from "./const"
import { randInt } from "./maps/cityGeneration"
import generateRandomTrainingsMap, { shuffle } from "./maps/trainingsGeneration"
import { checkLineIntersection, map } from "./math"
import { PretrainedModel } from "./model"
import { isVector, Line, Node, Vector } from "./models"

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
    bestNeuralNet: NeuralNetwork
    epoch: number
    nodes: Node[]
    agents: Agent[]
    roads: Line[]
    roadTree: Sector[]
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

    allRoutes: { l: number, routes: Node[][] }[]

    constructor(width, height) {
        this.width = width
        this.height = height
        this.agentSettings = {
            steerRange: 15,
            velReduction: 1.20,
            sensorSettings: {
                num: 9,
                len: 150,
                fov: 250
            }
        }

        this.settings = {
            popSize: 50
        }

        this.mostCheckpoints = -1
        this.epoch = 0
        this.iteration = 0
        this.pretrainEpoch = 0
        this.pretrainEpochs = 100
        this.pretrain = false
        this.maxIter = 1000

        this.intersections = []
        this.sensorVisual = []
        this.allRoutes = []

        this.bestNeuralNet = NeuralNetwork.deserialize(PretrainedModel)

        this.init()
    }

    init() {
        this.nodes = generateRandomTrainingsMap(250)
        this.createAllRoutesDict()
        this.addAgents()
        this.addRoads()
    }

    addRoads() {
        // keep track of used edgeIds to prevent duplications
        const usedIds: number[] = []
        this.roads = []
        this.nodes.forEach(n => {
            this.roads = [...this.roads, ...n.getLines(usedIds)]
        })
    }

    addAgents() {
        this.agents = []
        for (let i = 0; i < this.settings.popSize; i++) {
            this.spawnAgent()
        }
    }

    spawnAgent() {
        const routes = this.allRoutes[randInt(0, this.allRoutes.length - 1)].routes
        const route = routes[randInt(0, routes.length - 1)]

        const s: SpawnSettings = {
            direction: directionOfNodes(route[0], route[1]),
            startPos: route[0].pos.copy(),
        }

        const agent = new Agent(s, this.agentSettings, this.bestNeuralNet.copy())
        agent.route = route
        agent.checkpoints = getCheckpoints(route)

        this.agents.push(agent)
    }

    createAllRoutesDict() {
        const routeLengthDict = {}
        // calculate length between all nodes
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = 0; j < this.nodes.length; j++) {
                if (i == j) continue
                let path = search(this.nodes, this.nodes[i], this.nodes[j])
                if (routeLengthDict[path.length]) {
                    routeLengthDict[path.length].push(path)
                } else {
                    routeLengthDict[path.length] = [path]
                }
            }
        }

        const sorted: { l: number, routes: Node[][] }[] = []
        Object.keys(routeLengthDict).forEach(k => {
            sorted.push({ "l": +k, routes: routeLengthDict[k] })
        })

        sorted.sort((a, b) => a.l > b.l ? -1 : 0)

        this.allRoutes = sorted
    }

    step() {
        const evaluate = () => {
            // eval
            this.iteration = 0
            this.agents.sort((a, b) => a.reachedCheckpoints > b.reachedCheckpoints ? -1 : 0)

            const mostCheckpoints = this.agents[0].reachedCheckpoints
            if (mostCheckpoints > this.mostCheckpoints) {
                console.log({ mostCheckpoints })
                //this.pretrain = false
                this.mostCheckpoints = mostCheckpoints
                this.bestNeuralNet = this.agents[0].nn.copy()
            }


            if (this.epoch > 35 && this.mostCheckpoints < 3) {
                this.agents.map(a => a.nn.mutate(0.1))
                this.epoch = 0
                console.log("---Great reset---")
            } else {
                for (let i = 1; i < this.agents.length; i++) {
                    const x = this.bestNeuralNet.copy()
                    x.mutate(0.1)
                    this.agents[i].nn = x
                }
            }
            this.agents.map(a => a.reset())

            if (this.pretrain && this.pretrainEpoch > this.pretrainEpochs) {
                this.pretrain = false
            } else {
                this.pretrainEpoch++
            }

            this.epoch++
        }

        const updateAgents = () => {
            this.intersections = []
            this.sensorVisual = []

            let finishedRoute = false
            this.agents = this.agents.filter(a => a.alive)
            this.agents.forEach(a => {
                // if (this.iteration > 15 && a.pos.dist(a.settings.startPos) < 25 && a.reachedCheckpoints < 2) a.kill()

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
            })
            while (this.agents.length < this.settings.popSize) {
                this.spawnAgent()
            }
        }

        const loop = () => {
            const alive = this.agents.filter(a => a.alive).length
            if (this.iteration < this.maxIter && alive > 0) {
                // update agents
                updateAgents()
                //this.iteration++
            } else {
                evaluate()
                this.iteration = 0
                if (this.pretrain) {
                    this.pretrainEpoch++
                }
            }
        }

        //while (this.pretrain) {
        //    loop()
        //}
        //loop()
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

const getCheckpoints = (path: Node[]): Line[] => {
    // generates checkpoints for a list of nodes
    // checkpoint direction depends on the following node
    // this way a route of checkpoints is generated that the agent follows
    const checkpoints: Line[] = []

    for (let i = 0; i < path.length - 1; i++) {
        const node = path[i]
        const nextNode = path[i + 1]
        Object.keys(node.connections).some(k => {
            if (node.connections[k] === undefined) return

            if (node.connections[k].startNode === nextNode || node.connections[k].endNode === nextNode) {
                checkpoints.push(getCheckpoint(node.pos, k))
                return true
            }
        })
    }
    return checkpoints
}

const getCheckpoint = (pos, direction) => {
    if (direction === "top") {
        return new Line(pos.x - NODE_SIZE, pos.y - NODE_SIZE, pos.x + NODE_SIZE, pos.y - NODE_SIZE)
    }
    if (direction === "right") {
        return new Line(pos.x + NODE_SIZE, pos.y - NODE_SIZE, pos.x + NODE_SIZE, pos.y + NODE_SIZE)
    }
    if (direction === "left") {
        return new Line(pos.x - NODE_SIZE, pos.y - NODE_SIZE, pos.x - NODE_SIZE, pos.y + NODE_SIZE)
    }
    if (direction === "bottom") {
        return new Line(pos.x - NODE_SIZE, pos.y + NODE_SIZE, pos.x + NODE_SIZE, pos.y + NODE_SIZE)
    }
}

function getSensorIntersectionsWith(agent: Agent, transformedSensors: Line[], otherObjects: Line[]) {
    const inputs = []
    const intersectionPoints = []
    transformedSensors.forEach(sensor => {
        let closest = Infinity
        let closestIntersectionPoint: boolean | Vector = false
        otherObjects.forEach(line => {
            const intersectionPoint = checkLineIntersection(sensor, line)
            if (isVector(intersectionPoint)) {
                if (agent.pos.dist(intersectionPoint) < closest) {
                    closestIntersectionPoint = intersectionPoint
                    closest = agent.pos.dist(intersectionPoint)
                }
            }
        })

        if (isVector(closestIntersectionPoint)) {
            intersectionPoints.push(closestIntersectionPoint)
            inputs.push(map(closestIntersectionPoint.dist(agent.pos), 0, agent.settings.sensorSettings.len, 0, 1))
        } else {
            inputs.push(1)
        }
    })

    return [inputs, intersectionPoints]
}

function transformSensor(s: Sensor, agent: Agent) {
    const current = s.pos.copy()
    current.rotate(s.rot + agent.dir.heading())
    current.add(agent.pos)
    return new Line(current.x, current.y, agent.pos.x, agent.pos.y)
}


const getBody = (agent: Agent): Line[] => {
    return [new Line(agent.pos.x - 5, agent.pos.y, agent.pos.x + 5, agent.pos.y),
    new Line(agent.pos.x, agent.pos.y - 5, agent.pos.x, agent.pos.y + 5)]
}

const agentsCollisions = (agent: Agent, roads: Line[], checkpoints: Line[]): boolean => {
    const body = getBody(agent)
    handleCollisions(agent, body, roads)
    return handleCheckpoints(agent, body, checkpoints)
}

const handleCollisions = (agent: Agent, body: Line[], roads: Line[]) => {
    // check collision with roads
    body.forEach(part => {
        roads.forEach(wall => {
            if (isVector(checkLineIntersection(part, wall))) {
                agent.kill()
                //should kill the loop
                return
            }
        })
    })
}

const handleCheckpoints = (agent: Agent, body: Line[], checkpoints: Line[]): boolean => {
    agent.tickSinceLastCP++
    let collWithLastCp = false
    body.forEach(part => {
        const targetCP = checkpoints[agent.reachedCheckpoints % checkpoints.length]
        if (isVector(checkLineIntersection(part, targetCP))) {
            agent.tickSinceLastCP = 0
            agent.reachedCheckpoints++
            //console.log(`reached ${agent.reachedCheckpoints}`)
            //console.log(`length  ${checkpoints.length}`)
            if (!collWithLastCp) {
                collWithLastCp = agent.reachedCheckpoints === checkpoints.length
                return collWithLastCp
            }
        }
    })
    return collWithLastCp
}

const directionOfNodes = (n1: Node, n2: Node): Vector => {
    let x = 0
    let y = 0
    if (n1.connections.left !== undefined && n1.connections.left.getOther(n1.id).id === n2.id) {
        x = -1
    } else if (n1.connections.right !== undefined && n1.connections.right.getOther(n1.id).id === n2.id) {
        x = 1
    } else if (n1.connections.top !== undefined && n1.connections.top.getOther(n1.id).id === n2.id) {
        y = -1
    } else if (n1.connections.bottom !== undefined && n1.connections.bottom.getOther(n1.id).id === n2.id) {
        y = 1
    }
    return new Vector(x, y)
}

export default Gym
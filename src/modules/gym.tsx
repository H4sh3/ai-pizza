import search from "../etc/astar"
import NeuralNetwork from "../thirdparty/nn"
import Agent, { AgentSettings, Sensor } from "./agent"
import { NODE_SIZE } from "./const"
import genRandomMap from "./mapgen"
import mapgen, { randInt } from "./mapgen"
import { checkLineIntersection, map } from "./math"
import { PretrainedModel } from "./model"
import { isVector, Line, Node, Vector } from "./models"
import getTrainingsEnv from "./trainingsEnv"

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
    roadTree: Sector[]
    checkpoints: Line[]

    // vis stuff
    intersections: Vector[]
    sensorVisual: Line[]

    agentSettings: AgentSettings
    settings: {
        popSize: number
    }
    maxIter: number
    iteration: number
    pretrainEpoch: number
    pretrainEpochs: number
    pretrain: boolean

    allRoutes: { [length: string]: Node[][]; }

    constructor(width, height) {
        this.width = width
        this.height = height
        this.agentSettings = {
            direction: {
                x: 0,
                y: 0
            },
            steerRange: 15,
            velReduction: 1.15,
            startPos: new Vector(0, 0),
            sensorSettings: {
                num: 9,
                len: 150,
                fov: 250
            }
        }

        this.settings = {
            popSize: 25
        }

        this.mostCheckpoints = -1
        this.epoch = 0
        this.iteration = 0
        this.pretrainEpoch = 0
        this.pretrainEpochs = 100
        this.pretrain = true
        this.maxIter = 1000

        this.intersections = []
        this.sensorVisual = []
        this.allRoutes = {}
        this.init()
    }

    init() {
        const training = true
        if (training) {
            const { nodes } = getTrainingsEnv()
            this.nodes = nodes
            this.addTestRoute()
            this.addAgents()
        } else {
            const nodes = genRandomMap()
            this.nodes = nodes
            const route = this.rndRoute()
            this.agents = [new Agent(this.agentSettings, NeuralNetwork.deserialize(PretrainedModel))]
            this.agents[0].route = route
        }
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
        const agent = new Agent(this.agentSettings)
        this.agents.push(agent)
    }

    addTestRoute() {
        this.checkpoints = []
        const { nodes } = this
        const p = [18, 17, 21, 16, 19, 20, 15, 14, 10, 11, 15, 20, 19, 16, 21, 17, 18, 11, 10, 14, 15, 11, 18]
        let path = p.map(id => nodes.filter(n => n.id === id)[0])


        const rt = new Sector(0, 0, this.width, this.height)
        const usedIds = []
        path.forEach(n => {
            n.getLines(usedIds).forEach(l => {
                rt.elements.push(l)
            })
        })
        this.roadTree = [rt]

        const startNode = path[0]
        const s2 = path[1]
        if (startNode.connections.left !== undefined && startNode.connections.left.getOther(startNode.id).id === s2.id) {
            this.agentSettings.direction.x = -1
        } else if (startNode.connections.right !== undefined && startNode.connections.right.getOther(startNode.id).id === s2.id) {
            this.agentSettings.direction.x = 1
        } else if (startNode.connections.top !== undefined && startNode.connections.top.getOther(startNode.id).id === s2.id) {
            this.agentSettings.direction.y = -1
        } else if (startNode.connections.bottom !== undefined && startNode.connections.bottom.getOther(startNode.id).id === s2.id) {
            this.agentSettings.direction.y = 1
        }
        const checkpoints = getCheckpoints(path)

        this.checkpoints = checkpoints
        this.agentSettings.startPos = startNode.pos.copy()
    }

    rndRoute() {
        this.checkpoints = []
        const { nodes } = this

        const routeLengthDict = {}
        // calculate length between all nodes
        for (let i = 0; i < nodes.length; i++) {
            for (let j = 0; j < nodes.length; j++) {
                if (i == j) continue

                let path = search(nodes, nodes[i], nodes[j])
                if (routeLengthDict[path.length]) {
                    routeLengthDict[path.length].push(path)
                } else {
                    routeLengthDict[path.length] = [path]
                }
            }
        }

        this.allRoutes = routeLengthDict

        const x = []
        Object.keys(routeLengthDict).forEach(k => {
            x.push({ "l": +k, routes: routeLengthDict[k] })
        })

        x.sort((a, b) => a.l > b.l ? -1 : 0)
        const toTarget = x[0].routes[0]
        console.log(`longes route ${x[0].l}`)

        const rt = new Sector(0, 0, this.width, this.height)
        const usedIds = []
        toTarget.forEach(n => {
            n.getLines(usedIds).forEach(l => {
                rt.elements.push(l)
            })
        })
        this.roadTree = [rt]

        const startNode = toTarget[0]
        const s2 = toTarget[1]

        this.agentSettings.direction = this.directionOfNodes(startNode, s2)

        const checkpoints = getCheckpoints(toTarget)

        this.checkpoints = checkpoints
        this.agentSettings.startPos = startNode.pos.copy()
        return toTarget
    }

    directionOfNodes(n1: Node, n2: Node): { x: number, y: number } {
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
        return { x, y }
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
            // keep agent 0

            if (this.epoch > 35 && this.mostCheckpoints < 3) {
                this.agents.map(a => a.nn.mutate(1))
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
            this.agents.filter(a => a.alive).forEach(a => {
                if (this.iteration > 15 && a.pos.dist(a.settings.startPos) < 25) a.kill()

                // transform sensors to current position & direction
                const transformedSensors = a.sensors.map(sensor => transformSensor(sensor, a))
                this.sensorVisual = [...this.sensorVisual, ...transformedSensors]

                //const roadIntersections = getSensorIntersectionsWith(a, transformedSensors, this.roadTree.find(r => r.inside(a.pos)).elements)
                const roadIntersections = getSensorIntersectionsWith(a, transformedSensors, this.roads)
                this.intersections = [...this.intersections, ...roadIntersections[1]]

                const checkpointIntersections = getSensorIntersectionsWith(a, transformedSensors, [this.checkpoints[a.reachedCheckpoints % this.checkpoints.length]])
                //this.intersections = [...this.intersections, ...checkpointIntersections[1]]

                const inputs = [...roadIntersections[0], ...checkpointIntersections[0]]

                const reachedLastCheckpoint = agentsCollisions(a, this.roads, this.checkpoints)

                if (reachedLastCheckpoint) {
                    const newRoute = this.getNewRouteFrom(a.route[a.route.length - 1])
                    console.log(newRoute)
                    this.agentSettings.direction = this.directionOfNodes(newRoute[0], newRoute[1])
                    this.checkpoints = getCheckpoints(newRoute)
                    this.agents[0].dir.x = this.agentSettings.direction.x
                    this.agents[0].dir.y = this.agentSettings.direction.y
                }

                a.update(inputs)
            })
        }

        const loop = () => {
            const alive = this.agents.filter(a => a.alive).length
            if (this.iteration < this.maxIter && alive > 0) {
                // update agents
                updateAgents()
                this.iteration++
            } else {
                console.log("eval")
                evaluate()
                this.iteration = 0
                if (this.pretrain) {
                    this.pretrainEpoch++
                }
            }
        }

        while (this.pretrain) {
            loop()
        }
        loop()
    }

    getNewRouteFrom(sNode: Node): Node[] {
        console.log("sNode", sNode)
        Object.keys(this.allRoutes).forEach(k => {
            this.allRoutes[k].map(route => {
                if (route[0] === sNode) {
                    return route
                }
            })
        })
        return []
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

function getRandomPath(nodes: Node[]) {
    let start = nodes[0]
    let end = nodes[15]
    let path = search(nodes, start, end)
    while (path.length === 0) {
        start = nodes[randInt(1, nodes.length)]
        end = nodes[randInt(1, nodes.length)]
        if (start === end) continue
        path = search(nodes, start, end)
    }
    return path
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
                collWithLastCp = agent.reachedCheckpoints === checkpoints.length - 2
                return collWithLastCp
            }
        }
    })
    return collWithLastCp
}

export default Gym
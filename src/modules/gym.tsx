import search from "../etc/astar"
import NeuralNetwork from "../thirdparty/nn"
import Agent, { AgentSettings, Sensor } from "./agent"
import { NODE_SIZE } from "./const"
import genRandomMap from "./mapgen"
import mapgen, { randInt } from "./mapgen"
import { checkLineIntersection, map } from "./math"
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

    constructor(width, height) {
        this.width = width
        this.height = height
        this.agentSettings = {
            dirX: 0,
            dirY: 0,
            steerRange: 15,
            velReduction: 1.20,
            startPos: new Vector(0, 0),
            sensorSettings: {
                num: 7,
                len: 75,
                fov: 200
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
        this.maxIter = 500

        this.intersections = []
        this.sensorVisual = []
        this.init()
    }

    init() {
        const nodes = genRandomMap()
        this.nodes = nodes

        //const { nodes } = getTrainingsEnv()
        //this.addTestRoute()

        this.rndRoute()

        this.addAgents()
        this.addRoads()
        this.initRoadTree()
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
        const p = [18, 17, 21, 16, 19, 20, 15, 11, 18]
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
            this.agentSettings.dirX = -1
        } else if (startNode.connections.right !== undefined && startNode.connections.right.getOther(startNode.id).id === s2.id) {
            this.agentSettings.dirX = 1
        } else if (startNode.connections.top !== undefined && startNode.connections.top.getOther(startNode.id).id === s2.id) {
            this.agentSettings.dirY = -1
        } else if (startNode.connections.bottom !== undefined && startNode.connections.bottom.getOther(startNode.id).id === s2.id) {
            this.agentSettings.dirY = 1
        }
        const checkpoints = getCheckpoints(path)

        this.checkpoints = checkpoints
        this.agentSettings.startPos = startNode.pos.copy()
    }

    rndRoute() {
        this.checkpoints = []
        const { nodes } = this

        let start = nodes[randInt(0, nodes.length)]
        let end = nodes[randInt(0, nodes.length)]
        while (start == end) {
            start = nodes[randInt(0, nodes.length)]
            end = nodes[randInt(0, nodes.length)]
        }

        const path = search(nodes, start, end)
        console.log(path)

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
            this.agentSettings.dirX = -1
        } else if (startNode.connections.right !== undefined && startNode.connections.right.getOther(startNode.id).id === s2.id) {
            this.agentSettings.dirX = 1
        } else if (startNode.connections.top !== undefined && startNode.connections.top.getOther(startNode.id).id === s2.id) {
            this.agentSettings.dirY = -1
        } else if (startNode.connections.bottom !== undefined && startNode.connections.bottom.getOther(startNode.id).id === s2.id) {
            this.agentSettings.dirY = 1
        }
        const checkpoints = getCheckpoints(path)

        this.checkpoints = checkpoints
        this.agentSettings.startPos = startNode.pos.copy()
    }

    initRoadTree() {
        //this.roadTree = []
        //
        //this.roadTree.push(new Sector(0, this.width / 2, 0, this.height))
        //this.roadTree.push(new Sector(this.width / 2, this.width, 0, this.height))
        //
        //this.roads.forEach(l => {
        //    this.roadTree.filter(r => {
        //        return r.inside(l.p1) || r.inside(l.p2)
        //    }).forEach(x => x.elements.push(l))
        //})
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
                console.log("OFF")
                console.log(this.pretrain)
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

                const transformedSensors = a.sensors.map(sensor => transformSensor(sensor, a))
                const roadIntersections = getSensorIntersectionsWith(a, transformedSensors, this.roadTree.find(r => r.inside(a.pos)).elements)

                this.intersections = [...this.intersections, ...roadIntersections[1]]
                this.sensorVisual = [...this.sensorVisual, ...transformedSensors]

                const checkpointIntersections = getSensorIntersectionsWith(a, transformedSensors, this.checkpoints)
                const inputs = [...roadIntersections[0], ...checkpointIntersections[0]]
                agentsCollisions(a, this.roads, this.checkpoints)
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
                evaluate()
                this.iteration = 0
                if (this.pretrain) {
                    this.pretrainEpoch++
                }
            }
        }

        console.log(this.pretrain)
        while (this.pretrain) {
            loop()
        }
        loop()
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

const agentsCollisions = (agent: Agent, roads: Line[], checkpoints: Line[]) => {
    const body = getBody(agent)
    handleCollisions(agent, body, roads)
    handleCheckpoints(agent, body, checkpoints)
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

const handleCheckpoints = (agent: Agent, body: Line[], checkpoints: Line[]) => {
    agent.tickSinceLastCP++
    body.forEach(part => {
        const targetCP = checkpoints[agent.reachedCheckpoints % checkpoints.length]
        if (isVector(checkLineIntersection(part, targetCP))) {
            agent.tickSinceLastCP = 0
            agent.reachedCheckpoints++
            return
        }
    })
}

export default Gym
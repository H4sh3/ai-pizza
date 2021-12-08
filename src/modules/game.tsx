import search from "../etc/astar"
import NeuralNetwork from "../thirdparty/nn"
import Agent, { AgentSettings, Route, SpawnSettings } from "./agent"
import { NODE_SIZE } from "./const"
import { agentsCollisions, directionOfNodes, getAllRoutesDict, getCheckpoints, getSensorIntersectionsWith, transformSensor } from "./etc"
import generateRandomTrainingsMap, { getNodeInDirection, shuffle } from "./maps/trainingsGeneration"
import { randInt } from "./math"
import { PretrainedModel2 } from "./model"
import { Line, Node, Vector } from "./models"

export interface Task {
    start: Node,
    end: Node,
    route: Node[],
    active: boolean,
    deliverd: boolean
}

export class Game {
    width: number
    height: number

    mouse: {
        x: number,
        y: number
    }

    neuralNet: NeuralNetwork

    nodes: Node[]
    agents: Agent[]
    roads: Line[]

    // vis stuff
    intersections: Vector[]
    sensorVisual: Line[]
    agentSettings: AgentSettings

    allRoutes: { l: number, routes: Node[][] }[]
    selectedRoutes: Node[][]

    gameState: {
        numAgents: number,
        running: boolean,
        stations: Node[],
        firstNodePicked: boolean
    }

    tasks: Task[]

    rerender: () => void

    constructor(width, height) {
        this.neuralNet = NeuralNetwork.deserialize(PretrainedModel2)
        this.width = width
        this.height = height
        this.agentSettings = {
            steerRange: 10,
            velReduction: 1.35,
            sensorSettings: {
                num: 9,
                len: NODE_SIZE * 3,
                fov: 250
            }
        }

        this.mouse = {
            x: 0,
            y: 0
        }

        this.intersections = []
        this.sensorVisual = []
        this.allRoutes = []
        this.selectedRoutes = []
        this.agents = []
        this.tasks = []

        this.gameState = {
            numAgents: 1,
            running: false,
            stations: [],
            firstNodePicked: false
        }

        this.init()
    }

    init() {
        this.nodes = generateRandomTrainingsMap(150)

        this.allRoutes = getAllRoutesDict(this.nodes)
        for (let i = 0; i < 10; i++) {
            this.allRoutes[i].routes.forEach(r => {
                this.selectedRoutes.push(r)
            })
        }

        this.addRoads()
    }

    addTasks(startNode: Node, num: number) {
        const tasks = []
        let trys = 0
        const usedEndNodes = []
        while (tasks.length < num && trys <= 10) {
            const r = this.getNewRouteFrom(startNode)
            const endNode = r[r.length - 1]
            trys += 1 // in case every route is used
            if (usedEndNodes.includes(endNode)) return
            tasks.push({
                start: startNode,
                end: endNode,
                route: r
            })
            usedEndNodes.push(endNode)
        }

        tasks.forEach(t => {
            this.tasks.push(t)
        })
    }

    activateTask(task: Task) {
        // task got activated! add route to agent; set task to pending
        this.tasks.find(t => t === task).active = true
        console.log(`${this.agents
            .filter(a => a.routes.length === 0).length} without task!`)
        const agent = this.agents
            .filter(a => a.routes.length === 0) // has no task
            .filter(a => a.spawnSettings.startNode === task.start)[0] // works at tasks station

        const toTarget: Route = new Route(task, task.route, getCheckpoints(task.route), false)
        agent.routes.push(toTarget)

        const routeBack = search(this.nodes, task.end, agent.spawnSettings.startNode)
        const fromTarget: Route = new Route(task, routeBack, getCheckpoints(routeBack), true)
        agent.routes.push(fromTarget)

        const dir = directionOfNodes(task.route[0], task.route[1])
        if (agent.routes.length > 1) {
            agent.spawnSettings.direction.x = dir.x
            agent.spawnSettings.direction.y = dir.y
            agent.dir.x = dir.x
            agent.dir.y = dir.y
        }

        this.tasks.sort((a, b) => !a.active ? -1 : 0)
    }

    addTask(startNode: Node) {
        const r = this.getNewRouteFrom(startNode)
        this.tasks.push({
            start: startNode,
            end: r[r.length - 1],
            route: r,
            active: false,
            deliverd: false,
        })
    }

    addRoads() {
        const usedIds: number[] = []
        this.roads = this.nodes.reduce((acc, n) => {
            return acc.concat(n.getLines(usedIds))
        }, [])
    }

    getRandomRoute() {
        return this.selectedRoutes[randInt(0, this.selectedRoutes.length - 1)]
    }

    spawnAgent(station: Node, mutate: boolean = false) {
        const spawnSettings: SpawnSettings = {
            direction: directionOfNodes(station, station),
            startNode: station,
        }

        const agent = new Agent(spawnSettings, this.agentSettings)

        agent.nn = this.neuralNet.copy()
        if (mutate) agent.nn.mutate(0.1)

        this.agents.push(agent)
    }

    step() {
        const updateAgents = () => {
            this.intersections = []
            this.sensorVisual = []

            this.agents = this.agents.filter(a => a.alive)
            this.agents = this.agents.filter(a => a.tickSinceLastCP < 100)
            this.agents.filter(a => a.routes.length > 0).forEach(a => {
                // transform sensors to current position & direction
                const transformedSensors = a.sensors.map(sensor => transformSensor(sensor, a))
                this.sensorVisual = [...this.sensorVisual, ...transformedSensors]
                const roadIntersections = getSensorIntersectionsWith(a, transformedSensors, this.roads)
                this.intersections = [...this.intersections, ...roadIntersections[1]]

                const currentCheckpoint = [a.routes[0].checkpoints[a.reachedCheckpoints % a.routes[0].checkpoints.length]]
                const checkpointIntersections = getSensorIntersectionsWith(a, transformedSensors, currentCheckpoint)
                const inputs = [...roadIntersections[0], ...checkpointIntersections[0]]

                const finishedCurrentRoute = agentsCollisions(a, this.roads, a.routes[0].checkpoints)

                a.update(inputs)

                if (finishedCurrentRoute) {
                    const finishedRoute = a.routes.shift()
                    if (!finishedRoute.isEnd) {
                        const newRoute = a.routes[0]
                        const dir = directionOfNodes(newRoute.nodes[0], newRoute.nodes[1])
                        a.spawnSettings.direction = dir
                        a.spawnSettings.startNode = newRoute.nodes[0]
                        finishedRoute.task.deliverd = true
                    } else {
                        // set home
                        console.log(`finished ${finishedRoute.getStartNode().id} ->  ${finishedRoute.getEndNode().id}`)
                        a.spawnSettings.startNode = finishedRoute.nodes[finishedRoute.nodes.length - 1]
                        this.tasks = this.tasks.filter(t => t !== finishedRoute.task)
                    }
                    a.reset()
                    this.rerender()
                }
            })
        }

        if (this.tasks.length === 1) {
            this.addTasks(this.gameState.stations[0], 3)
            this.rerender()
        }


        updateAgents()

        while (this.agents.length < this.gameState.numAgents) {
            this.spawnAgent(this.gameState.stations[0], true)
        }
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

export default Game
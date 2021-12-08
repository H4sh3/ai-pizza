import { DespawnAnimation } from "../components/GameUI"
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
        delivered: number,
        running: boolean,
        stations: Node[],
        firstNodePicked: boolean,
        money: number,
        points: number,
        autoTaskAssign: boolean
    }

    tasks: Task[]

    pizzaAnimation: DespawnAnimation[]
    scrollingTexts: DespawnAnimation[]


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
            delivered: 0,
            running: false,
            stations: [],
            firstNodePicked: false,
            money: 1250,
            points: 0,
            autoTaskAssign: false
        }

        this.init()

        // only graphical fancyness -> no functionality
        this.pizzaAnimation = []
        this.scrollingTexts = []
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
        // task got activated! add route to agent; set task to active
        const availableAgents = this.agents
            .filter(a => a.routes.length === 0) // has no task
            .filter(a => a.spawnSettings.startNode === task.start) // works at tasks station

        if (availableAgents.length === 0) return

        task.active = true
        const agent = availableAgents[0]

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
                        reroute(a, a.routes[0])
                        finishedRoute.task.deliverd = true

                        this.addPizzaAnimation(finishedRoute)
                        const profit = this.handleMoney(finishedRoute.nodes.length)
                        this.scrollingTexts.push(
                            {
                                value: profit,
                                pos: finishedRoute.nodes[finishedRoute.nodes.length - 1].pos.copy(),
                                factor: 1
                            }
                        )
                    } else {
                        a.spawnSettings.startNode = finishedRoute.nodes[finishedRoute.nodes.length - 1]
                        this.tasks = this.tasks.filter(t => t !== finishedRoute.task)

                    }
                    a.reset()
                }
            })

        }


        this.pizzaAnimation = this.pizzaAnimation.filter(d => d.factor >= 0)
        this.scrollingTexts = this.scrollingTexts.filter(d => d.factor >= 0)

        const availTasks = this.tasks.filter(t => !t.active)
        if (this.gameState.autoTaskAssign && availTasks.length > 0) {
            this.activateTask(availTasks[0])
        }

        if (availTasks.length < 5) {
            this.addTasks(this.gameState.stations[0], 5)
        }

        updateAgents()

        while (this.agents.length < this.gameState.numAgents) {
            this.spawnAgent(this.gameState.stations[0], true)
        }
        this.rerender()
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

    addPizzaAnimation(route: Route) {
        const newDespawn: DespawnAnimation = {
            pos: route.nodes[route.nodes.length - 1].pos.copy(),
            factor: 1.5
        }
        this.pizzaAnimation.push(newDespawn)
    }

    handleMoney(nodeLength: number) {
        const profit = nodeLength * 4
        this.gameState.points += profit
        this.gameState.money += profit
        this.gameState.points = Math.floor(this.gameState.points)
        this.gameState.money = Math.floor(this.gameState.money)
        this.gameState.delivered++
        return profit
    }
}

const reroute = (agent: Agent, route: Route) => {
    const dir = directionOfNodes(route.nodes[0], route.nodes[1])
    agent.spawnSettings.direction = dir
    agent.spawnSettings.startNode = route.nodes[0]
}

export default Game
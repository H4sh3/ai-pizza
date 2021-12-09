import { DespawnAnimation } from "./models"
import search from "../etc/astar"
import NeuralNetwork from "../thirdparty/nn"
import Agent, { AgentSettings, Route, SpawnSettings } from "./agent"
import { allowedNeighbours, nodeSelectionRange, NODE_SIZE } from "./const"
import { agentsCollisions, directionOfNodes, getAllRoutesDict, getCheckpoints, getSensorIntersectionsWith, transformSensor } from "./etc"
import { addEdge } from "./maps/trainingsEnv"
import generateRandomTrainingsMap, { shuffle } from "./maps/trainingsGeneration"
import { randInt } from "./math"
import { PretrainedModel2 } from "./model"
import { Edge, Line, Node, Vector } from "./models"

export interface Task {
    start: Node,
    end: Node,
    route: Node[],
    active: boolean,
    deliverd: boolean,
}

export class Game {
    width: number
    height: number

    mouse: {
        x: number,
        y: number
    }


    prices: {
        agent: number,
        addEdge: number,
        speed: number
    }


    nodes: Node[]
    edges: Edge[]

    neuralNet: NeuralNetwork
    agents: Agent[]

    roads: Line[]

    // vis stuff
    intersections: Line[]
    sensorVisual: Line[]
    agentSettings: AgentSettings

    allRoutes: { l: number, routes: Node[][] }[]
    selectedRoutes: Node[][]

    gameState: {
        pickingFirstNode: boolean,
        numAgents: number,
        delivered: number,
        running: boolean,
        stations: Node[],
        money: number,
        points: number,
        autoTaskAssign: boolean,
        isFirstGame: boolean,
        speedLevel: number
    }

    tasks: Task[]

    // adding edges
    edgeBuild: {
        active: boolean,
        startNode: Node | undefined
    }

    pizzaAnimation: DespawnAnimation[]
    scrollingTexts: DespawnAnimation[]

    startTime: number
    currTime: number

    rerender: () => void

    constructor(width, height) {
        this.neuralNet = NeuralNetwork.deserialize(PretrainedModel2)
        this.width = width
        this.height = height
        this.init()
        this.gameState.isFirstGame = true
    }

    init() {
        this.agentSettings = {
            steerRange: 10,
            velReduction: [
                2.00,
                1.80,
                1.50,
                1.20
            ],
            sensorSettings: {
                num: 9,
                len: NODE_SIZE * 3,
                fov: 250
            }
        }


        this.prices = {
            agent: 500,
            addEdge: 100,
            speed: 100
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
            pickingFirstNode: true,
            money: 1500,
            points: 0,
            autoTaskAssign: false,
            isFirstGame: false,
            speedLevel: 0
        }

        const { edges, nodes } = generateRandomTrainingsMap(150)
        this.edges = edges
        this.nodes = nodes
        this.initRoutes()

        // only graphical fancyness -> no functionality
        this.pizzaAnimation = []
        this.scrollingTexts = []

        this.edgeBuild = {
            active: false,
            startNode: undefined
        }

        this.startTime = 0
        this.currTime = 0
    }

    initRoutes() {
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

            this.agents.filter(a => !a.alive && a.routes.length > 0).forEach(a => {
                a.routes.forEach(r => {
                    r.task.active = false
                })
            })
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

                a.update(inputs, this.gameState.speedLevel)

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

        if (300 - (Math.floor(this.currTime - this.startTime) / 1000) < 0) {
            // stop the game after 300 seconds
            this.gameState.running = false
        }

        this.pizzaAnimation = this.pizzaAnimation.filter(d => d.factor >= 0)
        this.scrollingTexts = this.scrollingTexts.filter(d => d.factor >= 0)

        const availTasks = this.tasks.filter(t => !t.active)
        if (availTasks.length > 0) {
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

    mouseClicked(mouseX: number, mouseY: number) {
        const pickedNode: Node = this.nodes.find(n => n.pos.dist(new Vector(mouseX, mouseY)) < nodeSelectionRange)
        if (this.gameState.pickingFirstNode) {
            // user is picking first node
            if (pickedNode === undefined) return
            if (pickedNode.getNeightbours().length > allowedNeighbours) return

            this.gameState.stations.push(pickedNode)
            this.gameState.pickingFirstNode = false
            this.spawnAgent(pickedNode)
            this.addTasks(pickedNode, 3)
            this.rerender()
        } else if (this.edgeBuild.active) {
            if (pickedNode === undefined) return
            if (pickedNode.getNeightbours().length > 3) return

            // first node selection
            if (this.edgeBuild.startNode === undefined) {
                this.edgeBuild.startNode = pickedNode
            } else {
                // second node -> add edge
                this.connectNodes(this.edgeBuild.startNode, pickedNode)
                this.edgeBuild.startNode = undefined
                this.edgeBuild.active = false
            }
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

    addPizzaAnimation(route: Route) {
        const newDespawn: DespawnAnimation = {
            pos: route.nodes[route.nodes.length - 1].pos.copy(),
            factor: 1.5
        }
        this.pizzaAnimation.push(newDespawn)
    }

    handleMoney(nodeLength: number) {
        const profit = 10 + Math.floor(nodeLength / 2)
        this.gameState.points += profit
        this.gameState.money += profit
        this.gameState.points = Math.floor(this.gameState.points)
        this.gameState.money = Math.floor(this.gameState.money)
        this.gameState.delivered++
        return profit
    }

    connectNodes(node1: Node, node2: Node) {
        const e = addEdge(node1, node2)
        e.id = this.edges.length
        this.edges.push(e)
        this.initRoutes()
    }

    buyEdge() {
        if (this.gameState.money < this.prices.addEdge) return
        this.gameState.money -= this.prices.addEdge
        this.edgeBuild.active = true
        this.rerender()
    }

    buyAgent() {
        if (this.gameState.money < this.prices.agent) return
        this.gameState.money -= this.prices.agent
        this.gameState.numAgents++
        this.rerender()
    }

    buySpeed() {
        if (this.gameState.money < this.prices.speed) return
        if (this.gameState.speedLevel === 3) return
        this.gameState.money -= this.prices.speed
        this.gameState.speedLevel++
        this.rerender()
    }
}

const reroute = (agent: Agent, route: Route) => {
    const dir = directionOfNodes(route.nodes[0], route.nodes[1])
    agent.spawnSettings.direction = dir
    agent.spawnSettings.startNode = route.nodes[0]
}

export default Game
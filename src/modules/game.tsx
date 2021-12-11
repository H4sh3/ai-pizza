import { DespawnAnimation } from "./models"
import search from "../etc/astar"
import NeuralNetwork from "../thirdparty/nn"
import Agent, { AgentSettings, SpawnSettings, Task } from "./agent"
import { allowedNeighbours, nodeSelectionRange, NODE_SIZE } from "./const"
import { agentsCollisions, directionOfNodes, getAllRoutesDict, getCheckpoints, getSensorIntersectionsWith, transformSensor } from "./etc"
import { addEdge } from "./maps/trainingsEnv"
import generateRandomTrainingsMap, { shuffle } from "./maps/trainingsGeneration"
import { randInt } from "./math"
import { PretrainedModel2 } from "./model"
import { Edge, Line, Node, Vector } from "./models"
import deser from "./maps/scquareCity"

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
        speedLevel: number,
        autoBuyAgents: boolean
    }

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
            speedLevel: 0,
            autoBuyAgents: false,
        }


        const { edges, nodes } = generateRandomTrainingsMap(150)//deser

        this.edges = edges
        this.nodes = nodes
        this.initRoutes()
        this.addRoads()

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

        let allLongRoutes: Node[][] = []
        for (let i = 0; i < this.allRoutes.length; i++) {
            allLongRoutes = [...allLongRoutes, ...this.allRoutes[i].routes]
        }
        this.selectedRoutes = allLongRoutes
    }

    addRoads() {
        const usedIds: number[] = []
        this.roads = this.nodes.reduce((acc, n) => {
            return acc.concat(n.getLines(usedIds))
        }, [])
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

            // died with an active task
            this.agents.filter(a => !a.alive && a.task !== undefined).forEach(a => {
                // agent delivered -> set task undefined, after respawn it gets a new task
                if (a.task.delivered) {
                    a.task = undefined
                }
                // otherwise agent will try again
            })

            this.agents = this.agents.filter(a => a.alive)
            this.agents = this.agents.filter(a => a.tickSinceLastCP < 100)

            // assign new tasks
            this.agents.filter(a => a.task === undefined).forEach(a => {
                const nodesFromStation = this.selectedRoutes.filter(r => r[0] === this.gameState.stations[0])
                const route = nodesFromStation[randInt(0, nodesFromStation.length - 1)]
                const task: Task = {
                    start: route[0],
                    target: route[route.length - 1],
                    delivered: false
                }
                updateOrientation(a, route)
                a.route = getCheckpoints(route)
                a.task = task
                a.reset()
            })

            this.agents.forEach(a => {
                // transform sensors to current position & direction
                const transformedSensors = a.sensors.map(sensor => transformSensor(sensor, a))
                this.sensorVisual = [...this.sensorVisual, ...transformedSensors]
                const roadIntersections = getSensorIntersectionsWith(a, transformedSensors, this.roads)
                this.intersections = [...this.intersections, ...roadIntersections[1]]

                const currentCheckpoint = [a.route[a.reachedCheckpoints % a.route.length]]
                const checkpointIntersections = getSensorIntersectionsWith(a, transformedSensors, currentCheckpoint)
                const inputs = [...roadIntersections[0], ...checkpointIntersections[0]]

                const finishedCurrentRoute = agentsCollisions(a, this.roads, a.route)

                a.update(inputs, this.gameState.speedLevel)

                if (finishedCurrentRoute) {
                    if (a.task.delivered) {
                        a.task = undefined
                    } else {
                        // agent reached end, search route from end to start
                        const routeBack = search(this.nodes, a.task.target, a.task.start)
                        updateOrientation(a, routeBack)
                        a.route = getCheckpoints(routeBack);
                        a.task.delivered = true

                        const profit = this.handleMoney(a.route.length)
                        this.addScrollingText(profit, a.task.target.pos)
                        this.addPizzaAnimation(a.task.target.pos)

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

        updateAgents()

        while (this.agents.length < this.gameState.numAgents) {
            this.spawnAgent(this.gameState.stations[0], true)
        }
        this.rerender()

        if (this.gameState.autoBuyAgents) {
            this.buyAgent()
        }
    }

    addScrollingText(profit: number, pos: Vector) {
        this.scrollingTexts.push(
            {
                value: profit,
                pos: pos.copy(),
                factor: 1
            }
        )
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
                this.addRoads()
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

    addPizzaAnimation(pos: Vector) {
        const newDespawn: DespawnAnimation = {
            pos: pos.copy(),
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

    toggleAutoBuy() {
        this.gameState.autoBuyAgents = !this.gameState.autoBuyAgents
    }
}

const updateOrientation = (agent: Agent, route: Node[]) => {
    const dir = directionOfNodes(route[0], route[1])
    agent.spawnSettings.direction = dir
    agent.spawnSettings.startNode = route[0]
}

export default Game
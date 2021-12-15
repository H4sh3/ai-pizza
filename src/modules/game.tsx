import { DespawnAnimation } from "./models"
import search from "../etc/astar"
import NeuralNetwork from "../thirdparty/nn"
import Agent, { AgentSettings, SpawnSettings, Task } from "./agent"
import { allowedNeighbours, GAME_DURATION, nodeSelectionRange, NODE_SIZE } from "./const"
import { agentsCollisions, directionOfNodes, getAllRoutesDict, getCheckpoints, getSensorIntersectionsWith, transformSensor } from "./etc"
import generateRandomTrainingsMap from "./maps/trainingsGeneration"
import { PretrainedModel2 } from "./model"
import { Line } from "./models"
import Shop from "./shop"
import { randInt } from "../etc/math"
import Vector from "../models/vector"
import { complexConnect, Edge, Node } from "../models/graph"
import { City } from "../models/city"
import { createRoundMap } from "../components/GraphEditor"
import { access } from "fs"

export class Game {
    width: number
    height: number

    mouse: {
        x: number,
        y: number
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
    selectedNodes: Node[]

    gameState: {
        pickingFirstNode: boolean
        numAgents: number
        delivered: number
        running: boolean
        stations: Node[]
        money: number
        points: number
        autoTaskAssign: boolean
        speedLevel: number
        autoBuyAgents: boolean
        iteration: number
        scores: number[]
    }

    borders: Line[]

    // adding edges
    edgeBuild: {
        active: boolean
        startNode: Node | undefined
    }

    pizzaAnimation: DespawnAnimation[]
    scrollingTexts: DespawnAnimation[]

    startTime: number
    currTime: number

    scores: number[][]

    maxScore: number

    shop: Shop

    city: City

    rerender: () => void

    constructor(width, height) {
        this.neuralNet = NeuralNetwork.deserialize(PretrainedModel2)
        this.shop = new Shop()
        this.width = width
        this.height = height
        this.scores = []

        const { edges, nodes } = createRoundMap() // deser
        this.edges = edges
        this.nodes = nodes

        this.maxScore = 0

        this.city = new City()
        nodes.forEach(n => {
            this.city.addIntersection(n)
        })
        this.city.addRoads()
        this.init()
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



        this.intersections = []
        this.sensorVisual = []
        this.allRoutes = []
        this.selectedNodes = []
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
            speedLevel: 0,
            autoBuyAgents: false,
            iteration: 0,
            scores: []
        }


        this.initRoutes()

        // this.nodes.forEach(n => n.initLines())

        this.addRoads()

        // only graphical fancyness -> no functionality
        this.pizzaAnimation = []
        this.scrollingTexts = []


        this.startTime = 0
        this.currTime = 0
    }

    initRoutes() {
        this.allRoutes = getAllRoutesDict(this.nodes)
    }

    addRoads() {
        const usedIds = [];
        this.roads = this.city.intersections.reduce((acc, n) => {
            return acc.concat(n.borders)
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
            this.agents = this.agents.filter(a => a.tickSinceLastCP < 250)

            // assign new tasks
            this.agents.filter(a => a.task === undefined).forEach(a => {
                const targetNode: Node = this.selectedNodes[randInt(0, this.selectedNodes.length - 1)]
                const route = search(this.nodes, this.gameState.stations[0], targetNode);
                const task: Task = {
                    start: route[0],
                    target: route[route.length - 1],
                    delivered: false
                }
                console.log(route)
                updateOrientation(a, route)

                a.route = getCheckpoints(route, this.city)

                a.task = task
                a.reset()
            })

            this.agents.forEach(a => {
                // transform sensors to current position & direction
                const transformedSensors = a.sensors.map(sensor => transformSensor(sensor, a))
                this.sensorVisual = [...this.sensorVisual, ...transformedSensors]
                const roadIntersections = getSensorIntersectionsWith(a, transformedSensors, this.city.borders())
                this.intersections = [...this.intersections, ...roadIntersections[1]]

                const currentCheckpoint = [a.route[a.reachedCheckpoints % a.route.length]]
                const checkpointIntersections = getSensorIntersectionsWith(a, transformedSensors, currentCheckpoint)
                this.intersections = [...this.intersections, ...checkpointIntersections[1]]
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
                        a.route = getCheckpoints(routeBack, this.city);
                        a.task.delivered = true

                        const profit = this.handleMoney(a.route.length)
                        this.addScrollingText(profit, a.task.target.pos)
                        this.addPizzaAnimation(a.task.target.pos)

                    }
                    a.reset()
                }
            })

        }

        if (GAME_DURATION - (Math.floor(this.currTime - this.startTime) / 1000) < 0) {
            // stop the game after 300 seconds
            this.gameState.running = false
            this.scores.push(this.gameState.scores)
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

        this.gameState.iteration++
        if (this.gameState.iteration % 60 === 0) {
            this.gameState.scores.push(this.gameState.delivered)
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
        const selectedNode: Node = this.nodes.find(n => n.pos.dist(new Vector(mouseX, mouseY)) < nodeSelectionRange)
        if (selectedNode === undefined) return

        if (this.gameState.pickingFirstNode) {
            // user is picking first node
            if (selectedNode.getNeighbours().length > allowedNeighbours) return

            this.gameState.stations.push(selectedNode)
            this.gameState.pickingFirstNode = false
            this.spawnAgent(selectedNode)
            this.rerender()


            let allLongRoutes: Node[][] = []
            for (let i = 0; i < this.allRoutes.length; i++) {
                const route = this.allRoutes[i];
                if (route.l > 2) {
                    allLongRoutes = [...allLongRoutes, ...route.routes]
                }
            }
            this.selectedNodes = allLongRoutes.filter(r => r[0] === selectedNode).map(r => r[r.length - 1])

        } else if (this.shop.edgeBuild.active) {
            if (selectedNode.getNeighbours().length > 3) return

            // first node selection
            if (this.shop.edgeBuild.startNode === undefined) {
                this.shop.edgeBuild.startNode = selectedNode
                this.shop.findValidNodes(this.nodes, this.edges)
            } else {
                if (!this.shop.edgeBuild.validSecondNodes.includes(selectedNode)) return
                if (selectedNode === this.shop.edgeBuild.startNode) return

                // second node -> add edge
                this.connectNodes(this.shop.edgeBuild.startNode, selectedNode)
                console.log("update")
                // update roads
                this.shop.edgeBuild.startNode.initLines()
                // selectedNode.initLines()
                // this.addRoads()
                // this.rerender()

                this.shop.edgeBuild.startNode = undefined;
                this.shop.edgeBuild.active = false;
                this.shop.edgeBuild.validSecondNodes = [];
            }
        }
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

        this.maxScore = this.gameState.delivered > this.maxScore ? this.gameState.delivered : this.maxScore

        return profit
    }

    connectNodes(node1: Node, node2: Node) {
        complexConnect(this.nodes, this.edges, node1, node2)
    }

    buyEdge() {
        if (this.gameState.money < this.shop.prices.addEdge || this.shop.edgeBuild.active) return
        this.gameState.money -= this.shop.prices.addEdge
        this.shop.edgeBuild.active = true
        this.rerender()
    }

    buyAgent() {
        if (this.gameState.money < this.shop.prices.agent) return
        this.gameState.money -= this.shop.prices.agent
        this.gameState.numAgents++
        this.rerender()
    }

    buySpeed() {
        if (this.gameState.money < this.shop.prices.speed) return
        if (this.gameState.speedLevel === 3) return
        this.gameState.money -= this.shop.prices.speed
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
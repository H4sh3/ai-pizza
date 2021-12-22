import NeuralNetwork from "../thirdparty/nn"
import Agent, { AgentSettings, SpawnSettings, Task } from "./agent"
import { NODE_SIZE } from "./const"
import { agentsCollisions, directionOfNodes, getAllRoutesDict, getCheckpoints, getSensorIntersectionsWith, shuffle, transformSensor } from "./etc"
import { Line } from "./models"
import { Edge, Node } from "../models/graph"
import { City } from "../models/city"
import { randInt } from "../etc/math"
import LinearIntersections from "./maps/linearIntersection"
import SquareCity from "./maps/scquareCity"
import GraphCity from "./maps/graphCity"
import { createRoundMap } from "../components/GraphEditor"
import WierdCity from "./maps/wierdCity"

const bestModel = { "input_nodes": 18, "hidden_nodes": 10, "output_nodes": 2, "weights_ih": { "rows": 10, "cols": 18, "data": [[-0.7356504541165313, 0.38285595070932676, 1.193272578501787, 0.7069801842761947, 0.7430717557365422, -0.9199135538862528, 1.8367506795179873, -1.1795417833473019, -1.6162083209168254, 0.8927589012751538, 0.5200254507713209, 1.273148862143922, -0.3611342984288213, -0.37468285217500363, 1.1260185148700304, -0.20910235454082085, -1.6313294583289428, 0.392597613087594], [-1.2757329404144755, 0.37334828916335483, 1.2173585198676744, -0.8527602725000714, 0.19020495125540904, -0.7494851169760501, 1.1122462888739706, 0.3948970745343665, 0.0018766310731972435, 1.5175801324188676, 0.6654315266641769, -1.862281573401365, 1.3838060700704358, 0.444811141081221, -0.37581485356601607, 2.910106991786349, 1.1090834564329786, -0.20766421334658736], [0.6564181420834378, -0.5057751269175241, 0.8854744142828195, 1.8859204976639217, 0.06888391909350616, -1.0081682920269515, 0.02763237715186498, -1.0169119528960093, 0.05175193080025298, 0.8757615893776398, -0.6381178965710446, -0.3907953210671087, -1.0449563591517743, -0.3884841687412128, 1.5117174227081054, -1.383683595757826, 0.08921696737158807, 1.6222958606711475], [0.09544010233629185, -0.029483516169660384, 1.1806132936299227, 0.7954363976519814, -1.1795764511747922, -2.252587180367052, 0.06977484982814541, -0.4031689092343215, 0.22862412646422312, -0.3967771754957541, 0.3190181725876498, -0.9069298827909034, 1.9405152210178345, -0.6573952245108821, 0.9700303094208962, -0.11715978223361895, -1.2671302915972995, 0.8700951924666012], [-0.4284454010042622, -0.5807134156992233, -0.758462452649407, 0.5787859008028438, 0.3087592505373604, 0.12729979915956274, 0.17769454631434, -0.29568318881908895, 0.7121007831921639, 2.2222248438617456, -0.08768178654654957, 2.61915440567376, 1.7486327176010577, -0.289072382851989, 1.751150150262302, -0.8627480263498256, -0.582711661011355, 0.3747721373018782], [1.3852050425767075, -1.355829441522537, 0.7136030277796818, 1.2136288975792566, -0.7759911661884624, -0.13789185386890812, -0.24812190018741137, 0.6354309122826792, 1.6216639844950536, 1.397492312683654, 0.24107894894372417, 0.3459880327490792, 1.193693658892264, -0.7148098440342617, 1.004436412016159, -0.01851279918217023, 0.7304158837411197, -0.21082035556525613], [-1.4416511838177044, -0.6124277718071067, 1.4601837211334445, 0.7390066329403342, 0.1921527388470441, -1.1561110596989619, -0.568470905632014, -0.09798142725087375, -0.1310687476740237, -0.9301939799227055, 0.5501406465718806, -0.05148577397908083, -1.0542521643966491, 1.7884803810271241, -0.4105200398699071, -0.8384356717549966, -0.12932419303685622, 0.5740364116736882], [-0.6780569765234391, -0.7728597346738725, -0.28165450015665117, 1.2336069885574137, -0.022999669970376502, 0.7676786253021943, -0.643757911570963, 0.9517841561632489, 0.10384702052279986, 0.3360822426096651, 0.24445661678741337, 1.115912941532573, 0.9490259624016836, -0.7615873014560054, -0.8350220475679997, -0.9054548517396275, -0.5094780367014997, -0.12238075651897329], [0.6931524927794771, 0.4980076787775137, 0.4366656832187582, -0.0008109634562588064, -0.8277132816547229, 0.6933272847316087, 0.7275098799052032, -1.0632507050413893, 0.8829702358442295, -0.6083346491306085, -0.2689219514267335, 1.0937529817486888, 0.22700127088310837, 0.7569278154350877, 0.6456131310950894, -1.439903489137368, -0.5140339941389355, 0.5909404273091554], [-1.1106966000936243, 0.7745379018714695, -0.8112754776863503, -0.10475111864876548, 0.6834936333434113, 1.6019740414005312, 1.0692747729637708, 0.15920427216721578, 0.29428551276824744, -0.8097734458955511, 2.0841223397381654, 0.40478808384695514, 0.6241066436222634, -0.19854415191865074, -1.4485562935319711, 0.5965450556214361, -1.1105065910634189, 1.4254516832878554]] }, "weights_ho": { "rows": 2, "cols": 10, "data": [[-0.4866454129601322, -1.5297882456845762, -1.3646484426331988, -0.3513611892821906, 0.38194998516377215, 0.5988469048145935, -0.41663838442265666, 1.9579365583766122, 1.4839321687270424, 0.37877407683682984], [-0.9945575816612191, 1.4678746067011816, 0.3189883492581934, 0.20182585273147527, -0.014014979911049899, 0.781960881122086, -1.1984565062719743, 1.1911296822636688, 0.6477836377659385, 1.1630733621037823]] }, "bias_h": { "rows": 10, "cols": 1, "data": [[-1.4659718715258334], [0.3027924129434577], [0.6539461837992748], [1.1758381073005675], [-0.4128872316978585], [1.38523102614026], [0.6494442379002479], [-0.08256318834181425], [-1.3661065588861572], [-1.159337252908454]] }, "bias_o": { "rows": 2, "cols": 1, "data": [[0.5627318885835688], [3.327169596082098]] }, "learning_rate": 0.1, "activation_function": {} }

export class Gym {
    width: number
    height: number
    mostCheckpoints: number
    bestNeuralNet: NeuralNetwork | undefined
    epoch: number

    nodes: Node[]
    edges: Edge[]
    city: City

    agents: Agent[]
    roads: Line[]
    checkpoints: Line[]

    // vis stuff
    intersections: Line[]
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
            velReduction: [1.35],
            sensorSettings: {
                num: 9,
                len: NODE_SIZE * 9,
                fov: 250
            }
        }

        this.settings = {
            popSize: 100
        }

        this.mostCheckpoints = -1
        this.epoch = 0
        this.iteration = 0
        this.pretrainEpoch = 0
        this.pretrainEpochs = 50
        this.pretrain = false
        this.maxIter = 1500

        this.intersections = []
        this.sensorVisual = []
        this.allRoutes = []
        this.selectedRoutes = []
        this.crashed = []
        this.fewestCrashes = Infinity

        this.bestNeuralNet = NeuralNetwork.deserialize(bestModel)

        this.init()
    }

    init() {
        const { nodes, edges } = GraphCity()
        this.nodes = nodes
        this.edges = edges

        this.city = new City()
        this.nodes.forEach(n => {
            this.city.addIntersection(n)
        })
        this.city.addRoads()

        this.allRoutes = getAllRoutesDict(this.nodes)
        for (let i = 0; i < 1; i++) {
            this.allRoutes[i].routes.forEach(r => {
                this.selectedRoutes.push(r)
            })
        }

        this.route = this.getRandomRoute()
        this.checkpoints = getCheckpoints(this.route, this.city)
        this.addAgents()
        this.addRoads()
    }

    addRoads() {
        this.roads = this.city.intersections.reduce((acc, n) => {
            return acc.concat(n.borders)
        }, [])
        this.city.roads.forEach(r => {
            this.roads.push(r.line1)
            this.roads.push(r.line2)
        })
    }

    addAgents() {
        this.agents = []
        this.spawnAgent(this.route)
        for (let i = 0; i < this.settings.popSize; i++) {
            this.spawnAgent(this.route, true)
        }
    }

    getRandomRoute() {
        return this.selectedRoutes[randInt(0, this.selectedRoutes.length - 1)]
        return this.selectedRoutes[3]
    }

    spawnAgent(route: Node[], mutate: boolean = false) {
        const task: Task = {
            delivered: false,
            start: route[0],
            target: route[route.length - 1]
        }

        const spawnSettings: SpawnSettings = {
            direction: directionOfNodes(route[0], route[1]),
            startNode: route[0],
        }

        const agent = new Agent(spawnSettings, this.agentSettings)
        agent.task = task
        if (this.bestNeuralNet) {
            agent.nn = this.bestNeuralNet.copy()
        }
        if (mutate) agent.nn.mutate(0.1)

        agent.route = getCheckpoints(route, this.city)

        this.agents.push(agent)
    }

    step() {
        const evaluate = () => {
            console.log("-----")
            // eval
            this.iteration = 0

            const allAgents = [...this.agents, ...this.crashed]
            allAgents.sort((a, b) => a.overallCheckpoints > b.overallCheckpoints ? -1 : 0)

            // const lifetime = allAgents[0].lifetime
            const checkpoints = allAgents[0].overallCheckpoints

            if (checkpoints > this.mostCheckpoints) {
                console.log({ checkpoints })
                //this.pretrain = false
                this.mostCheckpoints = checkpoints
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

            this.route = this.getRandomRoute()
            this.checkpoints = getCheckpoints(this.route, this.city)

            while (this.agents.length < this.settings.popSize) {
                // const route = this.selectedRoutes[randInt(0, this.selectedRoutes.length - 1)]
                this.spawnAgent(this.route, true)
            }


            this.epoch++
        }

        const updateAgents = () => {
            this.intersections = []
            this.sensorVisual = []

            this.agents.filter(a => !a.alive).map(agent => {
                agent.overallCheckpoints += agent.reachedCheckpoints
                this.crashed.push(agent)
            })

            this.agents = this.agents.filter(a => a.alive)
            this.agents = this.agents.filter(a => a.tickSinceLastCP < 250)

            this.agents.forEach(a => {
                // transform sensors to current position & direction
                const transformedSensors = a.sensors.map(sensor => transformSensor(sensor, a))
                this.sensorVisual = [...this.sensorVisual, ...transformedSensors]
                const roadIntersections = getSensorIntersectionsWith(a, transformedSensors, this.roads)

                const checkpointIntersections = getSensorIntersectionsWith(a, transformedSensors, [this.checkpoints[a.reachedCheckpoints % this.checkpoints.length]])

                checkpointIntersections[1].forEach(v => {
                    this.intersections.push(v)
                })

                const inputs = [...roadIntersections[0], ...checkpointIntersections[0]]
                const reachedLastCheckpoint = agentsCollisions(a, this.roads, a.route)

                if (reachedLastCheckpoint) {
                    /*                     
                    const newRoute = this.getNewRouteFrom(a.task.target)
                    a.route = getCheckpoints(newRoute, this.city)

                    const task: Task = {
                        delivered: false,
                        start: newRoute[0],
                        target: newRoute[newRoute.length - 1]
                    }

                    a.task = task

                    updateOrientation(a, newRoute)
                    */
                    a.overallCheckpoints += a.reachedCheckpoints
                    a.reachedCheckpoints = 0

                    a.reset()
                }

                a.update(inputs, 0)
                a.highlighted = false
            })

            if (this.agents.length > 0) {
                this.agents.sort((a, b) => a.reachedCheckpoints > b.reachedCheckpoints ? -1 : 0)
                this.agents[0].highlighted = true
            }
        }

        const loop = () => {
            const alive = this.agents.find(a => a.alive)
            if (this.iteration < this.maxIter && alive) {
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
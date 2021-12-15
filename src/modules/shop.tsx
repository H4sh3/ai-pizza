import { start } from "repl"
import { NODE_SIZE } from "./const"
import { addEdge } from "./maps/trainingsEnv"
import { checkLineIntersection } from "./math"
import { Direction, Edge, isVector, Line, Node } from "./models"

class Shop {
    prices: {
        agent: number,
        addEdge: number,
        speed: number
    }


    edgeBuild: {
        active: boolean
        startNode: Node | undefined
        validSecondNodes: Node[]
    }

    constructor() {

        this.prices = {
            agent: 500,
            addEdge: 100,
            speed: 100
        }

        this.edgeBuild = {
            active: false,
            startNode: undefined,
            validSecondNodes: []
        }
    }

    findValidNodes(nodes: Node[], edges: Edge[]) {
        const startNode = this.edgeBuild.startNode
        this.edgeBuild.validSecondNodes = this.edgeBuild.validSecondNodes = nodes
            .filter(n => n !== startNode)
            .filter(n => !startNode.getNeighbours().includes(n))
            .filter(n => n.pos.dist(startNode.pos) === NODE_SIZE * 3)
    }
}

export default Shop
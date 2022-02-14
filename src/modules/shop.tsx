import { Edge, Node } from "../models/graph"

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
            agent: 200,
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
    }
}

export default Shop
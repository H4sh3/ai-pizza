import { Line } from "../modules/models";
import Vector from "./vector";

export class NewNode {
    pos: Vector
    edges: NewEdge[]
    constructor(pos) {
        this.pos = pos;
        this.edges = [];
    }

    getNeighbours(): NewNode[] {
        return this.edges.map(e => e.getOther(this))
    }
}

export class NewEdge {
    node1: NewNode
    node2: NewNode
    id: number
    constructor(node1: NewNode, node2: NewNode) {
        this.node1 = node1
        this.node2 = node2
        this.id = 0
    }

    getOther(node: NewNode): NewNode {
        return this.node1 == node ? this.node2 : this.node1
    }
}

export const connectNodes = (n1: NewNode, n2: NewNode): NewEdge | undefined => {
    // alrdy connected
    if (n1.edges.some(e => e.getOther(n1) === n2)) return undefined

    const edge = new NewEdge(n1, n2);
    n1.edges.push(edge)
    n2.edges.push(edge)
    return edge
}

export const getLine = (e: NewEdge): Line => {
    return new Line(e.node1.pos.x, e.node1.pos.y, e.node2.pos.x, e.node2.pos.y)
}
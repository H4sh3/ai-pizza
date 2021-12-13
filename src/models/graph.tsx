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
    constructor(node1: NewNode, node2: NewNode) {
        this.node1 = node1
        this.node2 = node2
    }

    getOther(node: NewNode): NewNode {
        return this.node1 == node ? this.node2 : this.node1
    }
}

export const connectNodes = (n1: NewNode, n2: NewNode): NewEdge => {
    const edge = new NewEdge(n1, n2);
    n1.edges.push(edge)
    n2.edges.push(edge)
    return edge
}
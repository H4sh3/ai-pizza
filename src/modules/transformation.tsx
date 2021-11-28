import { Segment } from "./models";

export class Vector {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export class Edge {
    startNode: Node
    endNode: Node

    constructor(start, end) {
        this.startNode = start
        this.endNode = end
    }
}

export class Node {
    id: number
    pos: Vector
    connections: {
        left: Node | undefined,
        right: Node | undefined
        top: Node | undefined,
        bottom: Node | undefined
    }

    constructor(id: number, x: number, y: number) {
        this.id = id
        this.pos = new Vector(x, y)
        this.connections = {
            left: undefined,
            right: undefined,
            top: undefined,
            bottom: undefined,
        }
    }
}


const genPosUUID = (x: number, y: number) => {
    return `${x}#${y}`
}

export const transformation = (segments: Segment[]): { nodes: Node[], edges: Edge[] } => {
    const nodes: Map<string, Node> = getNodes(segments)
    const edges = getEdges(nodes, segments)
    relateNotes(edges)

    return { nodes: Array.from(nodes.values()), edges }
}

const getNodes = (segments: Segment[]) => {
    const nodes: Map<string, Node> = new Map<string, Node>()
    // create map with nodes
    const posUUIDS = []
    segments.forEach(s => {
        if (s.id === 0) {
            console.log(s)
        }
        if (s.id === 2) {
            console.log(s)
        }
        const posUUIDstart = genPosUUID(s.start.x, s.start.y)
        if (!posUUIDS.includes(posUUIDstart)) {
            posUUIDS.push(posUUIDstart)
            nodes.set(posUUIDstart, new Node(s.id, s.start.x, s.start.y))
        }

        const posUUIDend = genPosUUID(s.end.x, s.end.y)
        if (!posUUIDS.includes(posUUIDend)) {
            posUUIDS.push(posUUIDend)
            nodes.set(posUUIDend, new Node(s.id, s.end.x, s.end.y))
        }
    })
    return nodes
}

const getEdges = (nodes: Map<string, Node>, segments: Segment[]) => {
    const edges: Edge[] = []
    segments.forEach(s => {
        const node1 = nodes.get(genPosUUID(s.start.x, s.start.y))
        const node2 = nodes.get(genPosUUID(s.end.x, s.end.y))
        edges.push(new Edge(node1, node2))
    })
    return edges
}

const relateNotes = (edges: Edge[]) => {
    edges.forEach(e => {
        const { startNode, endNode } = e
        // locate endNode relativ to startNode
        const diffX = Math.abs(Math.abs(startNode.pos.x) - Math.abs(endNode.pos.x))
        const diffY = Math.abs(Math.abs(startNode.pos.y) - Math.abs(endNode.pos.y))

        if (diffX > diffY) {
            if (endNode.pos.x < startNode.pos.x) { // left
                startNode.connections.left = e.endNode
                endNode.connections.right = e.startNode
            } else if (endNode.pos.x > startNode.pos.x) { // right
                startNode.connections.right = e.endNode
                endNode.connections.left = e.startNode
            }
        }
        else {
            if (endNode.pos.y < startNode.pos.y) { // top
                startNode.connections.top = e.endNode
                endNode.connections.bottom = e.startNode
            } else if (endNode.pos.y > startNode.pos.y) { // bottom
                startNode.connections.bottom = e.endNode
                endNode.connections.top = e.startNode
            }
        }
    })
}
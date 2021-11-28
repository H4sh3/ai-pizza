import { Segment } from "./models";

import { NODE_SIZE } from './const'

export class Vector {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    dist(other: Vector) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }
}

class Line {
    p1: Vector
    p2: Vector

    constructor(x1, y1, x2, y2) {
        this.p1 = new Vector(x1, y1)
        this.p2 = new Vector(x2, y2)
    }
}


export class Edge {
    id: number
    startNode: Node
    endNode: Node

    constructor(start, end) {
        this.startNode = start
        this.endNode = end
    }

    getOther(id) {
        if (this.startNode.id === id) {
            return this.endNode
        } else {
            return this.startNode
        }
    }

    exchangeNode(id, node) {
        if (this.startNode.id === id) {
            this.startNode = node
        } else {
            this.endNode = node
        }
    }
}

export class Node {
    id: number
    pos: Vector
    connections: {
        left: Edge | undefined,
        right: Edge | undefined
        top: Edge | undefined,
        bottom: Edge | undefined
    }

    getNeightbours() {
        const n = []
        Object.keys(this.connections).forEach(direction => {
            if (this.connections[direction] !== undefined) {
                if (this.connections[direction].startNode.id === this.id) {
                    n.push(this.connections[direction].endNode)
                } else {
                    n.push(this.connections[direction].startNode)
                }
            }
        })
        return n
    }

    getLeft() {
        return this.getDirection("left")
    }
    getRight() {
        return this.getDirection("right")
    }
    getTop() {
        return this.getDirection("top")
    }
    getBottom() {
        return this.getDirection("bottom")
    }

    getDirection(direction) {
        if (this.connections[direction] === undefined) {
            return { node: undefined, edgeId: undefined }
        }

        if (this.connections[direction].startNode.id === this.id) {
            return { node: this.connections[direction].endNode, edgeId: this.connections[direction].id }
        } else {
            return { node: this.connections[direction].startNode, edgeId: this.connections[direction].id }
        }
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

    getLines(): Line[] {
        const lines: Line[] = []
        const usedEdges = []
        Object.keys(this.connections).forEach(direction => {
            const { node, edgeId } = this.getDirection(direction)
            if (node === undefined) {
                if (direction === "top") {
                    const x1 = this.pos.x - NODE_SIZE
                    const y1 = this.pos.y - NODE_SIZE
                    const x2 = this.pos.x + NODE_SIZE
                    const y2 = this.pos.y - NODE_SIZE
                    lines.push(new Line(x1, y1, x2, y2))
                }
                if (direction === "right") {
                    const x1 = this.pos.x + NODE_SIZE
                    const y1 = this.pos.y - NODE_SIZE
                    const x2 = this.pos.x + NODE_SIZE
                    const y2 = this.pos.y + NODE_SIZE
                    lines.push(new Line(x1, y1, x2, y2))
                }
                if (direction === "bottom") {
                    const x1 = this.pos.x - NODE_SIZE
                    const y1 = this.pos.y + NODE_SIZE
                    const x2 = this.pos.x + NODE_SIZE
                    const y2 = this.pos.y + NODE_SIZE
                    lines.push(new Line(x1, y1, x2, y2))
                }
                if (direction === "left") {
                    const x1 = this.pos.x - NODE_SIZE
                    const y1 = this.pos.y - NODE_SIZE
                    const x2 = this.pos.x - NODE_SIZE
                    const y2 = this.pos.y + NODE_SIZE
                    lines.push(new Line(x1, y1, x2, y2))
                }
                return
            }

            if (usedEdges.includes(edgeId)) return

            usedEdges.push(edgeId)

            if (direction === "top") {
                const x1 = this.pos.x - NODE_SIZE
                const y1 = this.pos.y - NODE_SIZE
                const x2 = node.pos.x - NODE_SIZE
                const y2 = node.pos.y + NODE_SIZE
                lines.push(new Line(x1, y1, x2, y2))

                const x1_2 = this.pos.x + NODE_SIZE
                const y1_2 = this.pos.y - NODE_SIZE
                const x2_2 = node.pos.x + NODE_SIZE
                const y2_2 = node.pos.y + NODE_SIZE
                lines.push(new Line(x1_2, y1_2, x2_2, y2_2))
            }
            if (direction === "left") {
                const x1 = this.pos.x - NODE_SIZE
                const y1 = this.pos.y - NODE_SIZE
                const x2 = node.pos.x + NODE_SIZE
                const y2 = node.pos.y - NODE_SIZE
                lines.push(new Line(x1, y1, x2, y2))

                const x1_2 = this.pos.x - NODE_SIZE
                const y1_2 = this.pos.y + NODE_SIZE
                const x2_2 = node.pos.x + NODE_SIZE
                const y2_2 = node.pos.y + NODE_SIZE
                lines.push(new Line(x1_2, y1_2, x2_2, y2_2))
            }
            if (direction === "right") {
                const x1 = this.pos.x + NODE_SIZE
                const y1 = this.pos.y - NODE_SIZE
                const x2 = node.pos.x - NODE_SIZE
                const y2 = node.pos.y - NODE_SIZE
                lines.push(new Line(x1, y1, x2, y2))

                const x1_2 = this.pos.x + NODE_SIZE
                const y1_2 = this.pos.y + NODE_SIZE
                const x2_2 = node.pos.x - NODE_SIZE
                const y2_2 = node.pos.y + NODE_SIZE
                lines.push(new Line(x1_2, y1_2, x2_2, y2_2))
            }
            if (direction === "bottom") {
                const x1 = this.pos.x - NODE_SIZE
                const y1 = this.pos.y + NODE_SIZE
                const x2 = node.pos.x - NODE_SIZE
                const y2 = node.pos.y - NODE_SIZE
                lines.push(new Line(x1, y1, x2, y2))

                const x1_2 = this.pos.x + NODE_SIZE
                const y1_2 = this.pos.y + NODE_SIZE
                const x2_2 = node.pos.x + NODE_SIZE
                const y2_2 = node.pos.y - NODE_SIZE
                lines.push(new Line(x1_2, y1_2, x2_2, y2_2))
            }
        })
        return lines
    }
}


const genPosUUID = (x: number, y: number) => {
    return `${x}#${y}`
}

export const transformation = (segments: Segment[]): { nodes: Node[], edges: Edge[] } => {
    const nodes: Map<string, Node> = getNodes(segments)
    const edges: Edge[] = getEdges(nodes, segments)
    relateNotes(edges)

    const nArr = Array.from(nodes.values())
    nArr.filter(n => n.id == 0)[0].id = -1

    return { nodes: removeSimple(nArr), edges }
}

const getNodes = (segments: Segment[]) => {
    const nodes: Map<string, Node> = new Map<string, Node>()
    // create map with nodes
    const posUUIDS = []
    segments.forEach(s => {
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

    let indx = 0
    edges.forEach(e => {
        e.id = indx++
    })

    return edges
}


const removeSimple = (nodes: Node[]) => {
    let run = true
    let i = 0
    while (run) {
        i++
        let changed = false
        let rmId
        nodes.forEach(e => {
            if (changed) return
            if (e.connections.top !== undefined) return
            if (e.connections.bottom !== undefined) return
            if (e.connections.left === undefined) return
            if (e.connections.right === undefined) return

            console.log(e.id)
            e.connections.left.exchangeNode(e.id, e.connections.right.getOther(e.id))
            e.connections.right.exchangeNode(e.id, e.connections.left.getOther(e.id))

            rmId = e.id
            changed = true
        })
        
        if (!changed) {
            run = false
        }
        nodes = nodes.filter(x => x.id !== rmId)
    }

    run = true
    i = 0
    while (run) {
        i++
        let changed = false
        let rmId
        nodes.forEach(e => {
            if (changed) return
            if (e.connections.top === undefined) return
            if (e.connections.bottom === undefined) return
            if (e.connections.left !== undefined) return
            if (e.connections.right !== undefined) return

            e.connections.top.exchangeNode(e.id, e.connections.bottom.getOther(e.id))
            e.connections.bottom.exchangeNode(e.id, e.connections.top.getOther(e.id))

            rmId = e.id
            changed = true
        })
        
        if (!changed) {
            run = false
        }
        nodes = nodes.filter(x => x.id !== rmId)
    }
    return nodes
}

const relateNotes = (edges: Edge[]) => {
    edges.forEach(e => {
        const { startNode, endNode } = e
        // locate endNode relativ to startNode
        const diffX = Math.abs(Math.abs(startNode.pos.x) - Math.abs(endNode.pos.x))
        const diffY = Math.abs(Math.abs(startNode.pos.y) - Math.abs(endNode.pos.y))

        if (diffX > diffY) {
            if (endNode.pos.x < startNode.pos.x) { // left
                startNode.connections.left = e
                endNode.connections.right = e
            } else if (endNode.pos.x > startNode.pos.x) { // right
                startNode.connections.right = e
                endNode.connections.left = e
            }
        }
        else {
            if (endNode.pos.y < startNode.pos.y) { // top
                startNode.connections.top = e
                endNode.connections.bottom = e
            } else if (endNode.pos.y > startNode.pos.y) { // bottom
                startNode.connections.bottom = e
                endNode.connections.top = e
            }
        }
    })
}
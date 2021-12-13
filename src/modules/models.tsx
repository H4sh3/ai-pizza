import { NODE_SIZE } from "./const";
import { addEdge } from "./maps/trainingsEnv";


export interface Position {
    x: number,
    y: number
}

export interface DespawnAnimation {
    pos: Vector,
    factor: number,
    value?: number
}

export interface SegmentJson {
    id: number,
    start: Position,
    end: Position,
    forward: number[],
    backward: number[]
}

export interface Segment {
    id: number,
    start: Position,
    end: Position,
    forward: Segment[],
    backward: Segment[]
}


export class Line {
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

    constructor(start: Node, end: Node, id: number) {
        this.startNode = start
        this.endNode = end
        this.id = id
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

    getLine(): Line {
        return new Line(this.startNode.pos.x, this.startNode.pos.y, this.endNode.pos.x, this.endNode.pos.y)
    }

}

export enum Direction {
    left,
    right,
    up,
    down
}

export class Node {
    id: number
    color: string
    pos: Vector
    connections: {
        left: Edge | undefined,
        right: Edge | undefined
        top: Edge | undefined,
        bottom: Edge | undefined
    }
    lines: { line: Line, id: number }[]
    edgeIds: number[]

    constructor(id: number, x: number, y: number) {
        this.id = id
        this.pos = new Vector(x, y)
        this.connections = {
            left: undefined,
            right: undefined,
            top: undefined,
            bottom: undefined,
        }
        this.color = "#AAAAAA"
        this.lines = [];
    }

    removeEdge(edge: Edge) {
        Object.keys(this.connections).forEach(direction => {
            if (this.connections[direction] === edge) {
                this.connections[direction] = undefined
                console.log("removed")
            }
        })
    }

    getOpenDirections(): Direction[] {
        const directions: Direction[] = []

        if (this.connections.bottom === undefined) {
            directions.push(Direction.down)
        }
        if (this.connections.left === undefined) {
            directions.push(Direction.left)
        }
        if (this.connections.right === undefined) {
            directions.push(Direction.right)
        }
        if (this.connections.top === undefined) {
            directions.push(Direction.up)
        }

        return directions
    }

    getNeightbours(): Node[] {
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

    getEdges(): Edge[] {
        const x: Edge[] = []
        Object.keys(this.connections).map(k => {
            if (this.connections[k] != undefined) {
                x.push(this.connections[k])
            }
        })
        return x
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

    getLines(usedIds: number[]) {
        return this.lines.filter(l => l.id == -1 || !usedIds.includes(l.id)).map(l => {
            usedIds.push(l.id)
            return l.line
        })
    }

    initLines() {
        this.lines = []

        Object.keys(this.connections).forEach(direction => {
            const { node, edgeId } = this.getDirection(direction)
            if (node === undefined) {
                if (direction === "top") {
                    const x1 = this.pos.x - NODE_SIZE
                    const y1 = this.pos.y - NODE_SIZE
                    const x2 = this.pos.x + NODE_SIZE
                    const y2 = this.pos.y - NODE_SIZE
                    this.lines.push({ line: new Line(x1, y1, x2, y2), id: -1 })
                }
                if (direction === "right") {
                    const x1 = this.pos.x + NODE_SIZE
                    const y1 = this.pos.y - NODE_SIZE
                    const x2 = this.pos.x + NODE_SIZE
                    const y2 = this.pos.y + NODE_SIZE
                    this.lines.push({ line: new Line(x1, y1, x2, y2), id: -1 })
                }
                if (direction === "bottom") {
                    const x1 = this.pos.x - NODE_SIZE
                    const y1 = this.pos.y + NODE_SIZE
                    const x2 = this.pos.x + NODE_SIZE
                    const y2 = this.pos.y + NODE_SIZE
                    this.lines.push({ line: new Line(x1, y1, x2, y2), id: -1 })
                }
                if (direction === "left") {
                    const x1 = this.pos.x - NODE_SIZE
                    const y1 = this.pos.y - NODE_SIZE
                    const x2 = this.pos.x - NODE_SIZE
                    const y2 = this.pos.y + NODE_SIZE
                    this.lines.push({ line: new Line(x1, y1, x2, y2), id: -1 })
                }
            } else {
                if (direction === "top") {
                    const x1 = this.pos.x - NODE_SIZE
                    const y1 = this.pos.y - NODE_SIZE
                    const x2 = node.pos.x - NODE_SIZE
                    const y2 = node.pos.y + NODE_SIZE
                    this.lines.push({ line: new Line(x1, y1, x2, y2), id: edgeId })

                    const x1_2 = this.pos.x + NODE_SIZE
                    const y1_2 = this.pos.y - NODE_SIZE
                    const x2_2 = node.pos.x + NODE_SIZE
                    const y2_2 = node.pos.y + NODE_SIZE
                    this.lines.push({ line: new Line(x1_2, y1_2, x2_2, y2_2), id: edgeId })
                }
                if (direction === "left") {
                    const x1 = this.pos.x - NODE_SIZE
                    const y1 = this.pos.y - NODE_SIZE
                    const x2 = node.pos.x + NODE_SIZE
                    const y2 = node.pos.y - NODE_SIZE
                    this.lines.push({ line: new Line(x1, y1, x2, y2), id: edgeId })

                    const x1_2 = this.pos.x - NODE_SIZE
                    const y1_2 = this.pos.y + NODE_SIZE
                    const x2_2 = node.pos.x + NODE_SIZE
                    const y2_2 = node.pos.y + NODE_SIZE
                    this.lines.push({ line: new Line(x1_2, y1_2, x2_2, y2_2), id: edgeId })
                }
                if (direction === "right") {
                    const x1 = this.pos.x + NODE_SIZE
                    const y1 = this.pos.y - NODE_SIZE
                    const x2 = node.pos.x - NODE_SIZE
                    const y2 = node.pos.y - NODE_SIZE
                    this.lines.push({ line: new Line(x1, y1, x2, y2), id: edgeId })

                    const x1_2 = this.pos.x + NODE_SIZE
                    const y1_2 = this.pos.y + NODE_SIZE
                    const x2_2 = node.pos.x - NODE_SIZE
                    const y2_2 = node.pos.y + NODE_SIZE
                    this.lines.push({ line: new Line(x1_2, y1_2, x2_2, y2_2), id: edgeId })
                }
                if (direction === "bottom") {
                    const x1 = this.pos.x - NODE_SIZE
                    const y1 = this.pos.y + NODE_SIZE
                    const x2 = node.pos.x - NODE_SIZE
                    const y2 = node.pos.y - NODE_SIZE
                    this.lines.push({ line: new Line(x1, y1, x2, y2), id: edgeId })

                    const x1_2 = this.pos.x + NODE_SIZE
                    const y1_2 = this.pos.y + NODE_SIZE
                    const x2_2 = node.pos.x + NODE_SIZE
                    const y2_2 = node.pos.y - NODE_SIZE
                    this.lines.push({ line: new Line(x1_2, y1_2, x2_2, y2_2), id: edgeId })
                }
            }
        })
    }
}

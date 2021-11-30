import { NODE_SIZE } from "./const";
import { degToRad } from "./math";


export interface Position {
    x: number,
    y: number
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

    add(other: Vector) {
        this.x += other.x
        this.y += other.y
    }

    sub(other: Vector) {
        this.x -= other.x
        this.y -= other.y
    }

    mult(scalar: number) {
        this.x *= scalar
        this.y *= scalar
    }

    copy() {
        return new Vector(this.x, this.y)
    }

    rotate(deg: number) {
        const theta = degToRad(deg);

        const cs = Math.cos(theta);
        const sn = Math.sin(theta);

        const tmpX = this.x * cs - this.y * sn;
        this.y = this.x * sn + this.y * cs;
        this.x = tmpX
    }

    normalize() {
        if (Math.abs(this.x) > Math.abs(this.y)) {
            this.y /= this.x
            this.x /= this.x
        } else {
            this.x /= this.y
            this.y /= this.y
        }
    }


}

export const isVector = (value: any): value is Vector => {
    return (
        !value === false &&
        "x" in value &&
        "y" in value
    )
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
        this.color = "#AAAAAA"
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

export function checkLineIntersection(l1: Line, l2: Line): Vector | boolean {
    const x1 = l1.p1.x
    const y1 = l1.p1.y
    const x2 = l1.p2.x
    const y2 = l1.p2.y
    const x3 = l2.p1.x
    const y3 = l2.p1.y
    const x4 = l2.p2.x
    const y4 = l2.p2.y
    const x = checkIntersection(x1, y1, x2, y2, x3, y3, x4, y4)

    if (x) {
        return x
    } else {
        return false
    }
}

function checkIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
    const numeA = ((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3));
    const numeB = ((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3));
    if (denom == 0) {
        if (numeA == 0 && numeB == 0) {
            return false;
        }
        return false;
    }
    const uA = numeA / denom;
    const uB = numeB / denom;
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
        return new Vector(x1 + (uA * (x2 - x1)), y1 + (uA * (y2 - y1)));
    }
    return false;
}
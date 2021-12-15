import { connect } from "tls";
import { checkLineIntersection } from "../etc/math";
import { Edge, Line } from "../modules/models";
import Vector, { isVector } from "./vector";
import { v4 as uuidv4 } from 'uuid';
import { NODE_SIZE } from "../modules/const";

export class NewNode {
    pos: Vector
    edges: NewEdge[]
    id: string
    constructor(pos) {
        this.pos = pos;
        this.edges = [];
        this.id = uuidv4();
    }

    getNeighbours(): NewNode[] {
        return this.edges.map(e => e.getOther(this))
    }

    removeEdge(edge: NewEdge) {
        this.edges = this.edges.filter(e => e != edge);
    }
}

export class NewEdge {
    node1: NewNode
    node2: NewNode
    id: string
    line: Line
    constructor(node1: NewNode, node2: NewNode) {
        this.node1 = node1
        this.node2 = node2
        this.id = uuidv4();
        this.line = new Line(node1.pos.x, node1.pos.y, node2.pos.x, node2.pos.y)
    }

    getOther(node: NewNode): NewNode {
        return this.node1 == node ? this.node2 : this.node1
    }
}

export const connectNodes = (nodes: NewNode[], edges: NewEdge[], n1: NewNode, n2: NewNode) => {
    const edgesToRemove: string[] = [];
    const newConnections: { s: NewNode, e: NewNode }[] = [];
    // start and end are same node
    if (n1 === n2) return { edgesToRemove, newConnections }

    // already connected
    if (n1.edges.some(e => e.getOther(n1) === n2)) return { edgesToRemove, newConnections }

    // find intersections for new edge
    const newEdgeLine: Line = new Line(n1.pos.x, n1.pos.y, n2.pos.x, n2.pos.y)
    const intersections: { e: NewEdge, pos: Vector }[] = [];
    edges.forEach(e => {
        if (e.node1.pos.dist(n1.pos) < 1 ||
            e.node2.pos.dist(n1.pos) < 1 ||
            e.node1.pos.dist(n2.pos) < 1 ||
            e.node2.pos.dist(n2.pos) < 1
        ) { } else {
            const v = checkLineIntersection(e.line, newEdgeLine)
            if (isVector(v)) {
                intersections.push({ e, pos: v })
            }
        }
    })

    // if we have intersection use closest to n1
    if (intersections.length > 0) {
        intersections.sort((a, b) => a.pos.dist(n1.pos) < b.pos.dist(n1.pos) ? -1 : 0)
        const { e, pos } = intersections[0];

        const nodeInRange = nodes.filter(n => n !== n1 && n !== n2).find(n => n.pos.dist(pos) < NODE_SIZE)

        if (nodeInRange) {
            newConnections.push({ s: n1, e: nodeInRange })
            newConnections.push({ s: n2, e: nodeInRange })
        } else {

            if (nodes.some(n => n.pos.dist(pos) < NODE_SIZE * 2)) return { edgesToRemove, newConnections }
            const newNode = new NewNode(pos)
            nodes.push(newNode)

            e.node1.removeEdge(e)
            e.node2.removeEdge(e)

            newConnections.push({ s: e.node1, e: newNode })
            newConnections.push({ s: newNode, e: e.node2 })
            newConnections.push({ s: n1, e: newNode })
            newConnections.push({ s: newNode, e: n2 })
            edgesToRemove.push(e.id)
        }
    } else {
        // no intersection: add edge
        addEdge(edges, n1, n2)
    }

    return { edgesToRemove, newConnections }
}

const addEdge = (edges, n1: NewNode, n2: NewNode) => {
    const edge = new NewEdge(n1, n2);
    n1.edges.push(edge)
    n2.edges.push(edge)
    edges.push(edge)
}

export const getLine = (e: NewEdge): Line => {
    return new Line(e.node1.pos.x, e.node1.pos.y, e.node2.pos.x, e.node2.pos.y)
}

export const complexConnect = (nodes: NewNode[], edges: NewEdge[], n1: NewNode, n2: NewNode) => {
    let toAdd = [{ s: n1, e: n2 }]
    let cnt = 50
    while (toAdd.length > 0 && cnt > 0) {
        const { s, e } = toAdd.shift()
        const { edgesToRemove, newConnections } = connectNodes(nodes, edges, s, e)
        edges = edges.filter(e => !edgesToRemove.includes(e.id))
        toAdd = toAdd.concat(newConnections)
        cnt--
    }
    return edges
}
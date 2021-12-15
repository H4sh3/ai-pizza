import { NODE_SIZE } from "../modules/const";
import { checkLineIntersection } from "../etc/math";
import { Line } from "../modules/models";
import { NewEdge, NewNode } from "./graph"
import Vector, { isVector } from "./vector";


export class City {
    intersections: Intersection[]
    roads: Road[]

    constructor() {
        this.intersections = []
        this.roads = []
    }

    addIntersection(node) {
        this.intersections.push(new Intersection(node))
    }

    addRoads() {
        const turnings = this.intersections.reduce((acc, i) => {
            i.turns.forEach(t => {
                if (t.node) {
                    acc.push(t)
                }
            })
            return acc
        }, [])

        const usedEdges: NewEdge[] = []
        for (let i = 0; i < turnings.length; i++) {
            for (let j = 0; j < turnings.length; j++) {
                const t1: Turn = turnings[i]
                const t2: Turn = turnings[j]
                if (t1 === t2) continue
                if (t1.edge !== t2.edge) continue
                const edge = t1.edge; // edge between turnings
                if (usedEdges.includes(edge)) continue

                // same edge
                this.roads.push({
                    edge,
                    line1: new Line(t1.line.p1.x, t1.line.p1.y, t2.line.p2.x, t2.line.p2.y,),
                    line2: new Line(t1.line.p2.x, t1.line.p2.y, t2.line.p1.x, t2.line.p1.y,),
                })
                usedEdges.push(edge)
            }
        }
    }
}

export class Road {
    edge: NewEdge
    line1: Line
    line2: Line

    constructor() {

    }
}

interface Turn {
    pos: Vector,
    node: NewNode,
    edge: NewEdge,
    distToNode: number,
    line?: Line,
}

export const getTurns = (node): Turn[] => {
    return node.edges.map(e => {
        const distToNode = 15
        const other = e.getOther(node)
        let pos = other.pos.copy().sub(node.pos.copy()).normalize()

        const turn: Turn = {
            pos,
            node: other,
            edge: e,
            distToNode
        }
        return turn
    })
}

const addLine = (turn: Turn, node: NewNode) => {
    const p1 = new Vector(-NODE_SIZE * 0.5, 0)
    const p2 = new Vector(NODE_SIZE * 0.5, 0)
    // console.log(t.heading)
    p1.rotate(turn.pos.heading() - 90)
    p2.rotate(turn.pos.heading() - 90)
    p1.add(node.pos).add(turn.pos.copy().mult(turn.distToNode))
    p2.add(node.pos).add(turn.pos.copy().mult(turn.distToNode))
    turn.line = new Line(p1.x, p1.y, p2.x, p2.y)
    return turn
}

export class Intersection {
    node: NewNode
    turns: Turn[]
    borders: Line[]

    constructor(node: NewNode) {
        this.borders = []
        this.node = node
        this.turns = getTurns(this.node)
        spreadVectors(this.turns)

        let noIntersections = false

        let limit = 50;
        while (!noIntersections && limit > 0) {
            noIntersections = true
            this.turns.map(t => {
                return addLine(t, this.node)
            })

            // check for intersections between turnings, if yes push the enhance turningDistance
            for (let i = 0; i < this.turns.length; i++) {
                const t1 = this.turns[i]
                let broke = false
                for (let j = 0; j < this.turns.length; j++) {
                    const t2 = this.turns[j]
                    if (t1 !== t2) {
                        const intersection = checkLineIntersection(t1.line, t2.line)

                        if (isVector(intersection)) {
                            this.turns.forEach(t => {
                                t.distToNode += 5
                                t = addLine(t, this.node)
                            })

                            broke = true
                            noIntersections = false
                            spreadVectors(this.turns)
                            break
                        }
                    }
                }
                if (broke) break
            }
            limit--
        }



        // if its only one node close it with extra turn that has no edge and gets border
        // check min max angle
        handleSmallTurns(this.turns, this.node)

        // close the intersection where no turning exists
        this.addBorders()
    }

    addBorders() {
        this.borders = []
        const pointRelations: { v: Vector, turn: Turn, angle: number }[] = [];
        const center = this.node.pos.copy()
        this.turns.forEach(t => {
            pointRelations.push({ v: t.line.p1, turn: t, angle: t.line.p1.angleBetween(center) })
            pointRelations.push({ v: t.line.p2, turn: t, angle: t.line.p2.angleBetween(center) })
        })

        pointRelations.sort((a, b) => a.angle < b.angle ? -1 : 0)
        for (let i = 1; i < pointRelations.length; i++) {
            const start = pointRelations[i - 1]
            const end = pointRelations[i]

            if (start.turn === end.turn && start.turn.node != undefined && end.turn.node != undefined) continue // dont connect same
            this.borders.push(new Line(start.v.x, start.v.y, end.v.x, end.v.y))
        }

        // add extra border between first and last
        const first = pointRelations[0]
        const last = pointRelations[pointRelations.length - 1]
        if (first.turn !== last.turn || (first.turn.node === undefined || first.turn.node === undefined)) {
            this.borders.push(new Line(first.v.x, first.v.y, last.v.x, last.v.y))
        }

    }
}

export const calculateCenter = (points: Vector[]): Vector => {
    const center = new Vector(0, 0);

    points.forEach(p => {
        center.add(p)
    })

    center.div(points.length)

    return center;
}

export const spreadVectors = (turns: Turn[]) => {
    turns.sort((a, b) => a.pos.heading() < b.pos.heading() ? -1 : 0)
    const minAngle = 25
    let enoughSpread = minAngleBetweenVectors(turns.map(t => t.pos), minAngle)
    let max = 500
    while (!enoughSpread && max > 0) {
        max--
        for (let i = 1; i < turns.length; i++) {
            const v1 = turns[i]
            const v2 = turns[i - 1]
            if (isAngleToSmall(v1.pos, v2.pos, minAngle)) {
                if (v1.pos.heading() < 0 && v2.pos.heading() < 0) {
                    if (v1.pos.heading() < v2.pos.heading()) {
                        v1.pos.rotate(-5)
                    } else {
                        v2.pos.rotate(-5)
                    }
                } else {
                    if (v1.pos.heading() > v2.pos.heading()) {
                        v1.pos.rotate(5)
                    } else {
                        v2.pos.rotate(5)
                    }
                }
            }
        }
        turns.sort((a, b) => a.pos.heading() < b.pos.heading() ? -1 : 0)
        enoughSpread = minAngleBetweenVectors(turns.map(t => t.pos), minAngle)
    }
    return turns
}

const calcAngleRange = (turns: Turn[]) => {
    let minAngle = Infinity
    let maxAngle = 0
    turns.forEach(d => {
        if (Math.abs(d.pos.heading()) < minAngle) {
            minAngle = Math.abs(d.pos.heading())
        }
        if (Math.abs(d.pos.heading()) > maxAngle) {
            maxAngle = Math.abs(d.pos.heading())
        }
    })
    return maxAngle - minAngle
}

const minAngleBetweenVectors = (vectors: Vector[], minAngle: number) => {
    for (let i = 1; i < vectors.length; i++) {
        const v1 = vectors[i]
        const v2 = vectors[i - 1]
        if (isAngleToSmall(v1, v2, minAngle)) {
            return false
        }
    }
    return true
}


const handleSmallTurns = (turns: Turn[], node: NewNode) => {
    const angleRange = calcAngleRange(turns)
    if (turns.length < 2 && angleRange < 110) {
        const turn = turns[0]
        const newTurn: Turn = {
            pos: undefined,
            node: undefined,
            edge: undefined,
            distToNode: 50,
            line: {
                p1: turn.line.p1.copy().sub(node.pos).rotate(-180).add(node.pos),
                p2: turn.line.p2.copy().sub(node.pos).rotate(180).add(node.pos),
            },
        }
        turns.push(newTurn)
    }
}

const isAngleToSmall = (v1: Vector, v2: Vector, minAngle: number) => {
    const d = v1.heading() - v2.heading()
    return Math.abs(d) < minAngle
}


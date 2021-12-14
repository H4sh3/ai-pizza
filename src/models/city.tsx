import { NODE_SIZE } from "../modules/const";
import { checkLineIntersection } from "../etc/math";
import { Line } from "../modules/models";
import { NewEdge, NewNode } from "./graph"
import Vector, { isVector } from "./vector";
import { off } from "process";
import { updateFunctionTypeNode } from "typescript";


interface Direction {
    pos: Vector,
    angle: number,
    node: NewNode,
    edge: NewEdge
}

interface Turning {
    line: Line,
    node: NewNode | undefined,
    edge: NewEdge
}

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
            Object.keys(i.turning).forEach(k => {
                if (i.turning[k].node) {
                    acc.push(i.turning[k])
                }
            })
            return acc
        }, [])

        const usedEdges: NewEdge[] = []
        for (let i = 0; i < turnings.length; i++) {
            for (let j = 0; j < turnings.length; j++) {
                const t1: Turning = turnings[i]
                const t2: Turning = turnings[j]
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

export class Intersection {
    node: NewNode
    turning: { [nodeId: string]: Turning; } = {};
    borders: Line[]
    directions: Direction[]

    constructor(node: NewNode) {
        this.node = node
        this.turning = {};
        this.directions = []
        this.node.edges.map(e => {
            const other = e.getOther(node)
            let normalized = node.pos.copy().sub(other.pos.copy()).normalize()
            const heading = normalized.heading()
            const direction: Direction = {
                "pos": normalized,
                "angle": heading,
                "node": other,
                "edge": e
            }
            this.directions.push(direction)
        })

        let noIntersections = false
        let limit = 50;
        let turningDistance = 25

        while (!noIntersections && limit > 0) {
            noIntersections = true
            this.turning = {};
            this.directions.forEach(d => {
                const p1 = new Vector(-NODE_SIZE * 0.5, 0)
                const p2 = new Vector(NODE_SIZE * 0.5, 0)
                p1.rotate(d.angle - 90)
                p2.rotate(d.angle - 90)
                p1.add(this.node.pos).sub(d.pos.copy().mult(turningDistance))
                p2.add(this.node.pos).sub(d.pos.copy().mult(turningDistance))
                this.turning[d.node.id] = { line: new Line(p1.x, p1.y, p2.x, p2.y), node: d.node, edge: d.edge }
            })

            // check for intersections between turnings, if yes push the enhance turningDistance
            let foundIntersection = false
            Object.keys(this.turning).forEach(k1 => {
                Object.keys(this.turning).forEach(k2 => {
                    const t1 = this.turning[k1].line
                    const t2 = this.turning[k2].line
                    if (t1 !== t2) {
                        const intersection = checkLineIntersection(t1, t2)
                        if (!foundIntersection) {
                            if (isVector(intersection)) {
                                foundIntersection = true
                            }
                        }
                    }
                })
            })
            if (foundIntersection) {
                noIntersections = false
            }

            limit--
            turningDistance += 1
        }


        // check min max angle
        let minAngle = Infinity
        let maxAngle = 0
        this.directions.forEach(d => {
            if (Math.abs(d.angle) < minAngle) {
                minAngle = Math.abs(d.angle)
            }
            if (Math.abs(d.angle) > maxAngle) {
                maxAngle = Math.abs(d.angle)
            }
        })
        const angleRange = maxAngle - minAngle
        console.log({ angleRange })

        // if its only one node
        if (Object.keys(this.turning).length < 2 || angleRange < 110) {
            const turn = this.turning[Object.keys(this.turning)[0]]
            console.log(turn)
            this.turning[-1] = {
                node: undefined,
                edge: undefined,
                line: {
                    p1: turn.line.p1.copy().sub(this.node.pos).rotate(-180).add(this.node.pos),
                    p2: turn.line.p2.copy().sub(this.node.pos).rotate(180).add(this.node.pos),
                }
            }
        }


        // close the intersection where no turning exists
        const pointRelations: { v: Vector, turning: Turning, angle: number }[] = [];
        const center = this.node.pos.copy()
        Object.keys(this.turning).forEach(k => {
            const t = this.turning[k]
            pointRelations.push({ v: t.line.p1, turning: t, angle: t.line.p1.angleBetween(center) })
            pointRelations.push({ v: t.line.p2, turning: t, angle: t.line.p2.angleBetween(center) })
        })

        pointRelations.sort((a, b) => a.angle < b.angle ? -1 : 0)
        this.borders = []
        for (let i = 1; i < pointRelations.length; i++) {
            const start = pointRelations[i - 1]
            const end = pointRelations[i]

            if (start.turning === end.turning && start.turning.node != undefined && end.turning.node != undefined) continue // dont connect same
            this.borders.push(new Line(start.v.x, start.v.y, end.v.x, end.v.y))
        }

        // add extra border between first and last
        const first = pointRelations[0]
        const last = pointRelations[pointRelations.length - 1]
        if (first.turning !== last.turning) {
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
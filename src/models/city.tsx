import { NODE_SIZE } from "../modules/const";
import { checkLineIntersection } from "../etc/math";
import { Line } from "../modules/models";
import { NewNode } from "./graph"
import Vector, { isVector } from "./vector";


interface Direction {
    pos: Vector,
    angle: number,
    node: NewNode
}

export class Intersection {
    node: NewNode
    turning: { [nodeId: string]: Line; } = {};
    borders: Line[]
    directions: Direction[]

    constructor(node: NewNode) {
        this.node = node
        this.turning = {};
        this.directions = []
        this.node.edges.map(e => {
            const other = e.getOther(node)
            let normalized = node.pos.copy().sub(other.pos.copy()).normalize()
            console.log(normalized.mag())
            const heading = normalized.heading()
            const direction: Direction = {
                "pos": normalized,
                "angle": heading,
                "node": other
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
                const p1 = new Vector(-NODE_SIZE, 0)
                const p2 = new Vector(NODE_SIZE, 0)
                p1.rotate(d.angle - 90)
                p2.rotate(d.angle - 90)
                p1.add(this.node.pos).sub(d.pos.copy().mult(turningDistance))
                p2.add(this.node.pos).sub(d.pos.copy().mult(turningDistance))
                this.turning[d.node.id] = new Line(p1.x, p1.y, p2.x, p2.y)
            })

            // check for intersections between turnings, if yes push the enhance turningDistance
            let foundIntersection = false
            Object.keys(this.turning).forEach(k1 => {
                Object.keys(this.turning).forEach(k2 => {
                    const t1 = this.turning[k1]
                    const t2 = this.turning[k2]
                    if (t1 !== t2) {
                        const intersection = checkLineIntersection(t1, t2)
                        if (!foundIntersection) {
                            if (isVector(intersection)) {
                                foundIntersection = true
                            }
                            console.log("inter")
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


        this.borders = []
        const usedPoints = []
        Object.keys(this.turning).forEach(k => {
            const turn = this.turning[k]

            let turnClosest;
            let otherClosest;
            let smallestDist = Infinity;
            Object.keys(this.turning).forEach(k2 => {
                const otherTurn = this.turning[k2]
                if (otherTurn !== turn) {

                    let d1 = usedPoints.includes(turn.p1) || usedPoints.includes(otherTurn.p1) ? Infinity : turn.p1.dist(otherTurn.p1)
                    let d2 = usedPoints.includes(turn.p1) || usedPoints.includes(otherTurn.p2) ? Infinity : turn.p1.dist(otherTurn.p2)
                    let d3 = usedPoints.includes(turn.p2) || usedPoints.includes(otherTurn.p1) ? Infinity : turn.p2.dist(otherTurn.p1)
                    let d4 = usedPoints.includes(turn.p2) || usedPoints.includes(otherTurn.p2) ? Infinity : turn.p2.dist(otherTurn.p2)
                    if (d1 <= smallestDist && d1 <= d2 && d1 <= d3 && d1 <= d4) {
                        smallestDist = d1
                        turnClosest = turn.p1
                        otherClosest = otherTurn.p1
                    } else if (d2 <= smallestDist && d2 <= d1 && d2 <= d3 && d2 <= d4) {
                        smallestDist = d2
                        turnClosest = turn.p1
                        otherClosest = otherTurn.p2
                    } else if (d3 <= smallestDist && d3 <= d1 && d3 <= d2 && d3 <= d4) {
                        smallestDist = d3
                        turnClosest = turn.p2
                        otherClosest = otherTurn.p1
                    } else if (d4 <= smallestDist && d4 <= d1 && d4 <= d2 && d4 <= d3) {
                        smallestDist = d4
                        turnClosest = turn.p2
                        otherClosest = otherTurn.p2
                        this.borders.push(new Line(turnClosest.x, turnClosest.y, otherClosest.x, otherClosest.y))
                    }
                }
            })
            usedPoints.push(turnClosest, otherClosest)
            if (turnClosest === undefined || otherClosest === undefined) {

            } else {
                this.borders.push(new Line(turnClosest.x, turnClosest.y, otherClosest.x, otherClosest.y))
            }
        })
    }
}


import { NODE_SIZE } from "../modules/const";
import { checkLineIntersection, radToDeg } from "../etc/math";
import { Line } from "../modules/models";
import { Edge, Node } from "./graph"
import Vector, { isVector } from "./vector";
import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";
import { accessSync } from "fs";

export class City {
    intersections: Intersection[]
    constructor(nodes: Node[], edges: Edge[]) {
        this.intersections = []
        nodes.forEach(n => {
            if (n.edges.length > 0) {
                this.addIntersection(n)
            }
        })
        this.finalize(edges)
    }

    addIntersection(node) {
        this.intersections.push(new Intersection(node))
    }

    addRoads() {
        const turns: Turn[] = this.intersections.reduce((acc, t) => {
            return acc.concat(t.turns.filter(t => t.node !== undefined))
        }, [])

        const usedEdges: Edge[] = []
        for (let i = 0; i < turns.length; i++) {
            for (let j = 0; j < turns.length; j++) {
                const t1: Turn = turns[i]
                const t2: Turn = turns[j]
                if (t1 === t2) continue
                if (t1.edge !== t2.edge) continue // same edge
                const edge = t1.edge; // edge between turnings
                if (usedEdges.includes(edge)) continue // connected already

                t1.intersection.borders.push(new Line(t1.line.p1.x, t1.line.p1.y, t2.line.p2.x, t2.line.p2.y,))
                t1.intersection.borders.push(new Line(t1.line.p2.x, t1.line.p2.y, t2.line.p1.x, t2.line.p1.y,))
                usedEdges.push(edge)
            }
        }
    }

    getIntersection(node: Node): Intersection {
        return this.intersections.find(i => i.node === node)
    }

    borders() {
        const x = this.intersections.reduce((acc, i) => { return acc.concat(i.borders) }, [])
        return x
    }

    getTurnLines() {
        const lines = []
        this.intersections.forEach(i => {
            i.turns.forEach(t => {
                lines.push(t.line)
            })
        })
        return lines
    }


    finalize(edges: Edge[]) {

        // fix turns that are further away from own node
        const allTurns: Turn[] = this.intersections.reduce((acc, t) => {
            return acc.concat(t.turns.filter(t => t.node !== undefined))
        }, [])

        for (let i = 0; i < edges.length; i++) {
            const e = edges[i]
            const node1 = e.node1
            const node2 = e.node2

            const turn1 = allTurns.find(t => t.edge === e && t.node === node2)
            const turn2 = allTurns.find(t => t.edge === e && t.node === node1)

            const posTurn1 = turn1.line.p1.copy().add(turn1.line.p2).div(2)
            const posTurn2 = turn2.line.p1.copy().add(turn2.line.p2).div(2)

            const distNode1ToTurn1 = node1.pos.dist(posTurn1)
            const distNode1ToTurn2 = node1.pos.dist(posTurn2)
            const distNode2ToTurn1 = node2.pos.dist(posTurn1)
            const distNode2ToTurn2 = node2.pos.dist(posTurn2)

            if (distNode1ToTurn2 < distNode1ToTurn1 && distNode2ToTurn2 < distNode2ToTurn1) {
                console.log("test")
                turn1.line.p1 = turn2.line.p2.copy()
                turn1.line.p2 = turn2.line.p1.copy()
            }
        }

        this.addBorders()
        this.addRoads()
    }

    addBorders() {
        this.intersections.forEach(i => i.addBorders())
    }

    getBordersOfNodes(nodes: Node[]) {
        const relevantIntersections = this.intersections.filter(i => nodes.includes(i.node))
        const usedIntersections = []
        const borders: Line[] = relevantIntersections.reduce((acc, i) => {

            i.turns.forEach(t => {
                const neighbourIntersection = this.intersections.find(i => t.node === i.node)
                if (neighbourIntersection && !usedIntersections.includes(neighbourIntersection)) {
                    acc = acc.concat(neighbourIntersection.borders)
                    neighbourIntersection.turns.forEach(t2 => {
                        acc = acc.concat(t2.intersection.borders)
                        usedIntersections.push(neighbourIntersection)
                    })
                }
            })

            if (!usedIntersections.includes(i)) {
                usedIntersections.push(i)
                acc = acc.concat(i.borders)
            }
            return acc
        }, [])
        return borders
    }
}

export class Road {
    edge: Edge
    line1: Line
    line2: Line

    constructor() {

    }
}

export interface Turn {
    pos: Vector,
    node: Node,
    edge: Edge,
    distToNode: number,
    line?: Line,
    centerDot?: Vector,
    intersection: Intersection
}

export const getTurns = (node: Node, intersection: Intersection): Turn[] => {
    return node.edges.map(e => {
        const distToNode = 5
        const other = e.getOther(node)
        let pos = other.pos.copy().sub(node.pos.copy()).normalize()

        const turn: Turn = {
            pos,
            node: other,
            edge: e,
            distToNode,
            intersection
        }
        return turn
    })
}

const addLine = (turn: Turn, node: Node) => {
    const turnSize = NODE_SIZE //* 0.75
    const p1 = new Vector(-turnSize, 0)
    const p2 = new Vector(turnSize, 0)
    p1.rotate(turn.pos.heading() - 90)
    p2.rotate(turn.pos.heading() - 90)
    p1.add(node.pos).add(turn.pos.copy().mult(turn.distToNode))
    p2.add(node.pos).add(turn.pos.copy().mult(turn.distToNode))
    turn.line = new Line(p1.x, p1.y, p2.x, p2.y)
    return turn
}

export class Intersection {
    node: Node
    turns: Turn[]
    borders: Line[]
    constructor(node: Node) {
        this.borders = []
        this.node = node
        this.turns = getTurns(this.node, this)

        let noIntersections = false

        let limit = 25;
        while (!noIntersections) {
            noIntersections = true
            this.turns.map(t => {
                return addLine(t, this.node)
            })

            // check for intersections between turnings, if yes push the enhance turningDistance
            for (let i = 0; i < this.turns.length; i++) {
                let t1 = this.turns[i]
                let broke = false
                for (let j = 0; j < this.turns.length; j++) {
                    let t2 = this.turns[j]
                    if (t1 !== t2) {
                        const intersection = checkLineIntersection(t1.line, t2.line)

                        if (isVector(intersection)) {
                            this.turns.forEach(t => {
                                t.distToNode += 15
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

            if (--limit <= 0) break
        }
        if (limit <= 0) {
            console.log("limit reached!")
        }



        // if its only one node close it with extra turn that has no edge and gets border
        // check min max angle
        handleSmallTurns(this.turns, this.node, this)

        // close the intersection where no turning exists
    }

    addBorders() {
        this.borders = []
        const pointRelations: { v: Vector, turn: Turn, angle: number }[] = [];
        const center = this.node.pos;

        // calculate how the points are positioned around the intersection
        this.turns.forEach(t => {
            pointRelations.push({ v: t.line.p1, turn: t, angle: t.line.p1.copy().sub(center).heading() })
            pointRelations.push({ v: t.line.p2, turn: t, angle: t.line.p2.copy().sub(center).heading() })
        })

        pointRelations.sort((a, b) => a.angle < b.angle ? -1 : 0)
        for (let i = 1; i < pointRelations.length; i++) {
            const start = pointRelations[i - 1]
            const end = pointRelations[i]

            const isSameTurn = start.turn === end.turn
            if (isSameTurn && start.turn.node != undefined && end.turn.node != undefined) continue // dont connect same

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
    const minAngle = 5
    let enoughSpread = minAngleBetweenVectors(turns.map(t => t.pos), minAngle)
    let max = 150
    while (!enoughSpread && max > 0) {
        max--
        const angleBetween = []

        for (let i = 1; i < turns.length; i++) {
            const t1 = turns[i - 1]
            const t2 = turns[i]
            const angle = t1.pos.angleBetween(t2.pos)

            const t0 = i - 2 >= 0 ? turns[i - 2] : turns[turns.length - 1]
            const t3 = i + 1 <= turns.length - 1 ? turns[i + 1] : turns[0]

            const a1 = t0.pos.angleBetween(t1.pos)
            const a2 = t2.pos.angleBetween(t3.pos)

            angleBetween.push({
                t1,
                t2,
                angle,
                rotateT1: a1 > a2
            })
        }

        //  calc angle between first and last

        const a1 = turns[0].pos.angleBetween(turns[1].pos)
        const a2 = turns[turns.length - 1].pos.angleBetween(turns[turns.length - 2].pos)

        angleBetween.push({
            t1: turns[0],
            t2: turns[turns.length - 1],
            angle: turns[0].pos.angleBetween(turns[turns.length - 1].pos),
            rotateT1: a1 > a2
        })

        angleBetween.sort((a, b) => a.angle < b.angle ? -1 : 0)

        const toRotate = angleBetween[0] // turns with smallest angle between

        const rotationStep = 1

        if (toRotate.t1.pos.heading() < 0 && toRotate.t2.pos.heading() < 0) {
            if (toRotate.t1.pos.heading() < toRotate.t2.pos.heading()) {
                if (toRotate.rotateT1) {
                    toRotate.t1.pos.rotate(-rotationStep)
                } else {
                    toRotate.t2.pos.rotate(rotationStep)
                }
            } else {
                if (toRotate.rotateT1) {
                    toRotate.t1.pos.rotate(rotationStep)
                } else {
                    toRotate.t2.pos.rotate(-rotationStep)
                }
            }
        } else if (toRotate.t1.pos.heading() > 0 && toRotate.t2.pos.heading() > 0) {
            if (toRotate.t1.pos.heading() < toRotate.t2.pos.heading()) {
                if (toRotate.rotateT1) {
                    toRotate.t1.pos.rotate(-rotationStep)
                } else {
                    toRotate.t2.pos.rotate(rotationStep)
                }
            } else {
                if (toRotate.rotateT1) {
                    toRotate.t1.pos.rotate(rotationStep)
                } else {
                    toRotate.t2.pos.rotate(-rotationStep)
                }
            }
        } else {
            if (toRotate.t1.pos.heading() <= 0 && toRotate.t2.pos.heading() >= 0) {
                if (toRotate.t1.pos.heading() < -90) {
                    if (toRotate.rotateT1) {
                        toRotate.t1.pos.rotate(rotationStep)
                    } else {
                        toRotate.t2.pos.rotate(-rotationStep)
                    }
                } else {
                    if (toRotate.rotateT1) {
                        toRotate.t1.pos.rotate(-rotationStep)
                    } else {
                        toRotate.t2.pos.rotate(rotationStep)
                    }
                }
            } else if (toRotate.t1.pos.heading() >= 0 && toRotate.t2.pos.heading() <= 0) {
                if (toRotate.t1.pos.heading() > 90) {
                    if (toRotate.rotateT1) {
                        toRotate.t1.pos.rotate(-rotationStep)
                    } else {
                        toRotate.t2.pos.rotate(rotationStep)
                    }
                } else {
                    if (toRotate.rotateT1) {
                        toRotate.t1.pos.rotate(rotationStep)
                    } else {
                        toRotate.t2.pos.rotate(-rotationStep)
                    }
                }
            }
        }
        turns.sort((a, b) => a.pos.heading() < b.pos.heading() ? -1 : 0)

        enoughSpread = minAngleBetweenVectors(turns.map(t => t.pos), minAngle)
    }
    return turns
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

export const calcMeanDirection = (directions: Vector[]): Vector => {
    return directions.reduce((sum, v) => { return sum.add(v.copy().normalize()) }, new Vector(0, 0)).div(directions.length)
}

const handleSmallTurns = (turns: Turn[], node: Node, intersection: Intersection) => {
    // meav vector of where the turns are pointing
    const meanDirection = calcMeanDirection(turns.filter(t => t.edge !== undefined).map(t => t.pos))
    // use length of this vector to decide if they point in a similar direction
    const meanDirecitonMag = meanDirection.mag()
    if (meanDirecitonMag > 0.50) {
        meanDirection.rotate(180)
        // const { distToNode } = turns[0]
        const distToNode = 25

        const p1 = new Vector(-NODE_SIZE * 0.75, 0)
        const p2 = new Vector(NODE_SIZE * 0.75, 0)
        p1.rotate(meanDirection.heading() - 90)
        p2.rotate(meanDirection.heading() - 90)
        p1.add(node.pos).add(meanDirection.copy().mult(distToNode))
        p2.add(node.pos).add(meanDirection.copy().mult(distToNode))

        const newTurn: Turn = {
            pos: undefined,
            node: undefined,
            edge: undefined,
            distToNode,
            line: new Line(p1.x, p1.y, p2.x, p2.y),
            intersection
        }
        turns.push(newTurn)
    }
}

const isAngleToSmall = (v1: Vector, v2: Vector, minAngle: number) => {
    const d = v1.heading() - v2.heading()
    return Math.abs(d) < minAngle
}


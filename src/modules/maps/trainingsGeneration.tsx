import { Direction, Edge, Line, Node } from "../models"
import { randInt } from "../../etc/math"
import { HEIGHT, NODE_SIZE, WIDTH } from "../const"
import { addEdge } from "./trainingsEnv"
import { checkLineIntersection } from "../../etc/math"
import Vector, { isVector } from "../../models/vector"

export const generateRandomTrainingsMap = (n: number) => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    //const n0 = new Node(0, WIDTH / 2, HEIGHT / 2)
    const n0 = new Node(0, NODE_SIZE * 2, NODE_SIZE * 2)
    nodes.push(n0)
    const n1 = getNodeInDirection(Direction.right, n0)
    nodes.push(n1)
    edges.push(addEdge(n0, n1))

    const n2 = getNodeInDirection(Direction.down, n1)
    nodes.push(n2)
    edges.push(addEdge(n1, n2))

    const n3 = getNodeInDirection(Direction.right, n2)
    nodes.push(n3)
    edges.push(addEdge(n2, n3))

    const n4 = getNodeInDirection(Direction.down, n3)
    nodes.push(n4)
    edges.push(addEdge(n3, n4))

    let node = n4
    let blockedNodes = []
    let trys = 0
    while (nodes.length < n && trys <= n * 4) {
        const newNode = generateNextNode(node, edges)
        const invalid = newNode === undefined ? true : nodes.filter(n => n.pos.dist(newNode.pos) < 1).length > 0
        if (invalid) {
            // no node found
            // use prev node and repeat
            blockedNodes.push(node)
            node = nodes.filter(n => !blockedNodes.includes(n)).slice(-1)[0] // get earlier node
            if (node === undefined) trys = 100000
        } else {
            // node can be used: new edge creates no intersections with other edges
            edges.push(addEdge(node, newNode))
            nodes.push(newNode)
            node = newNode
        }
        trys++
    }

    nodes.map((e, i) => e.id = i)

    // random edges
    for (let i = 0; i < 10; i++) {
        let n = nodes[randInt(0, nodes.length - 1)]

        const direction = randInt(0, 4)

        if (direction === 0) {
            if (n.connections.bottom === undefined) {
                for (let j = 0; j < nodes.length; j++) {
                    const n2 = nodes[j]
                    if (n == n2) continue
                    if (n2.pos.x === n.pos.x && n2.pos.y === n.pos.y + 3 * NODE_SIZE) {
                        edges.push(addEdge(n, n2))
                        break;
                    }
                }
            }
        } else if (direction === 1) {
            if (n.connections.top === undefined) {
                for (let j = 0; j < nodes.length; j++) {
                    const n2 = nodes[j]
                    if (n == n2) continue
                    if (n2.pos.x === n.pos.x && n2.pos.y === n.pos.y - 3 * NODE_SIZE) {
                        edges.push(addEdge(n, n2))
                        break;
                    }
                }
            }
        } else if (direction === 2) {
            if (n.connections.left === undefined) {
                for (let j = 0; j < nodes.length; j++) {
                    const n2 = nodes[j]
                    if (n == n2) continue
                    if (n2.pos.x === n.pos.x - 3 * NODE_SIZE && n2.pos.y === n.pos.y) {
                        edges.push(addEdge(n, n2))
                        break;
                    }
                }
            }
        } else if (direction === 3) {
            if (n.connections.right === undefined) {
                for (let j = 0; j < nodes.length; j++) {
                    const n2 = nodes[j]
                    if (n == n2) continue
                    if (n2.pos.x === n.pos.x + 3 * NODE_SIZE && n2.pos.y === n.pos.y) {
                        edges.push(addEdge(n, n2))
                        break;
                    }
                }
            }
        }
    }

    edges.map((e, i) => e.id = i)

    return { nodes, edges }
}

export const generateNextNode = (startNode: Node, edges: Edge[]): Node | undefined => {
    let directions = startNode.getOpenDirections()

    shuffle(directions)

    let node: Node | undefined = undefined
    directions.forEach(direction => {
        let possibleNextNode = getNodeInDirection(direction, startNode)
        const { x, y } = possibleNextNode.pos
        if (x < NODE_SIZE * 2 || x > WIDTH - NODE_SIZE * 2 || y < NODE_SIZE * 2 || y > HEIGHT - NODE_SIZE * 2) return

        let line = new Line(startNode.pos.x, startNode.pos.y, possibleNextNode.pos.x, possibleNextNode.pos.y)
        let intersections = edges.filter(e => !startNode.getEdges().includes(e)).filter(e => isVector(checkLineIntersection(e.getLine(), line))).length
        if (intersections === 0) {
            node = possibleNextNode
        }
    })

    return node
}

export const getNodeInDirection = (direction: Direction, node: Node, dist: number = 3): Node => {
    const pos = node.pos.copy()
    switch (direction) {
        case Direction.up:
            pos.add(new Vector(0, -dist * NODE_SIZE))
            break
        case Direction.down:
            pos.add(new Vector(0, dist * NODE_SIZE))
            break
        case Direction.left:
            pos.add(new Vector(-dist * NODE_SIZE, 0))
            break
        case Direction.right:
            pos.add(new Vector(dist * NODE_SIZE, 0))
            break
    }
    return new Node(0, pos.x, pos.y)
}

export default generateRandomTrainingsMap
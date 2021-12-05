import { Direction, Edge, isVector, Line, Node, Vector } from "../models"
import { randInt } from "../maps/cityGeneration"
import { HEIGHT, NODE_SIZE, WIDTH } from "../const"
import { addEdge } from "./trainingsEnv"
import { checkLineIntersection } from "../math"



const generateTrainingsMap = (size: number): Node[] => {
    const nodes = []
    const edges = []
    const n0 = new Node(0, NODE_SIZE * 2, HEIGHT - NODE_SIZE * 2)
    const n1 = getNodeInDirection(Direction.right, n0)
    edges.push(addEdge(n0, n1))

    const n2 = getNodeInDirection(Direction.up, n1)
    const n3 = getNodeInDirection(Direction.right, n2)
    edges.push(addEdge(n1, n2))
    edges.push(addEdge(n2, n3))

    const n4 = getNodeInDirection(Direction.up, n3)
    edges.push(addEdge(n3, n4))

    const n5 = getNodeInDirection(Direction.right, n4)
    edges.push(addEdge(n4, n5))

    const n6 = getNodeInDirection(Direction.up, n5)
    edges.push(addEdge(n5, n6))

    const n7 = getNodeInDirection(Direction.left, n6, 5)
    const n8 = getNodeInDirection(Direction.right, n6, 5)
    edges.push(addEdge(n6, n7))
    edges.push(addEdge(n6, n8))

    const n9 = getNodeInDirection(Direction.up, n6, 5)
    edges.push(addEdge(n6, n9))

    const n10 = getNodeInDirection(Direction.right, n9, 5)
    edges.push(addEdge(n9, n10))

    const n11 = getNodeInDirection(Direction.up, n10, 3)
    edges.push(addEdge(n10, n11))

    const n12 = getNodeInDirection(Direction.right, n11, 4)
    edges.push(addEdge(n11, n12))

    const n16 = getNodeInDirection(Direction.up, n12, 5)
    edges.push(addEdge(n12, n16))

    const n13 = getNodeInDirection(Direction.right, n12, 4)
    edges.push(addEdge(n12, n13))

    const n17 = getNodeInDirection(Direction.up, n13, 5)
    edges.push(addEdge(n13, n17))

    const n18 = getNodeInDirection(Direction.down, n13, 5)
    edges.push(addEdge(n13, n18))

    const n14 = getNodeInDirection(Direction.right, n13, 3)
    edges.push(addEdge(n13, n14))

    const n19 = getNodeInDirection(Direction.up, n14, 5)
    edges.push(addEdge(n14, n19))

    const n20 = getNodeInDirection(Direction.down, n14, 5)
    edges.push(addEdge(n14, n20))

    const n15 = getNodeInDirection(Direction.right, n14, 6)
    edges.push(addEdge(n14, n15))

    const n21 = getNodeInDirection(Direction.down, n15, 6)
    edges.push(addEdge(n15, n21))

    const n22 = getNodeInDirection(Direction.right, n21, 6)
    edges.push(addEdge(n21, n22))

    const n23 = getNodeInDirection(Direction.down, n22, 6)
    edges.push(addEdge(n22, n23))



    const n24 = getNodeInDirection(Direction.right, n23, 3)
    edges.push(addEdge(n23, n24))

    nodes.push(n0, n1, n2, n3, n4, n5, n6, n7, n8, n9, n10, n11, n12, n13, n14, n15, n16)
    nodes.push(n17, n18, n19, n20, n21, n22, n23, n24)

    nodes.map((n, i) => n.id = i)
    edges.map((n, i) => n.id = i)
    return nodes
}

export const generateRandomTrainingsMap = (n: number) => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    let node = new Node(0, WIDTH / 2, HEIGHT / 2)
    nodes.push(node)
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
            if (node === undefined) trys = 100000; console.log(`done at ${nodes.length}`)
        } else {
            // node can be used: new edge creates no intersections with other edges
            edges.push(addEdge(node, newNode))
            nodes.push(newNode)
            node = newNode
            console.log("added")
        }
        trys++
    }

    nodes.map((e, i) => e.id = i)
    edges.map((e, i) => e.id = i)

    return nodes
}

export const generateNextNode = (startNode: Node, edges: Edge[]): Node | undefined => {
    let directions = startNode.getOpenDirections()

    shuffle(directions)

    let node: Node | undefined = undefined
    directions.forEach(direction => {
        let possibleNextNode = getNodeInDirection(direction, startNode)
        const { x, y } = possibleNextNode.pos
        if (x < 0 || x > WIDTH || y < 0 || y > HEIGHT) return

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

function shuffle<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default generateTrainingsMap
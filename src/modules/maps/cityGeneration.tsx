import { HEIGHT, NODE_SIZE, WIDTH } from "../const";
import { radToDeg, checkLineIntersection, randInt } from "../math";
import { Edge, Node, Vector } from "../models";

const config = {
    width: WIDTH,
    height: HEIGHT,
    center: new Vector(WIDTH / 2, HEIGHT / 2),
    maxAngle: 75,
    minDist: NODE_SIZE * 3,
    cols: Math.round(WIDTH / (NODE_SIZE * 2)),
    rows: Math.round(HEIGHT / (NODE_SIZE * 2)),
}

const genRandomCity = (): Node[] => {
    let bestMap = generateGraph()
    return bestMap.nodes
}

const generateGraph = () => {
    let nodes: Node[] = []
    const edges: Edge[] = []

    let count = 0
    while ((nodes.length < config.cols / 3) && count < 50) {
        count++
        const pos = new Vector(randInt(1, config.cols - 1) * NODE_SIZE * 2, config.height / 2)

        if (nodes.some(n => n.pos.dist(pos) < config.minDist)) continue
        nodes.push(new Node(0, pos.x, pos.y))
    }

    count = 0
    const newPositions = []
    nodes.forEach(n => {
        for (let i = 0; i < 5; i++) {
            const pos = new Vector(n.pos.x, randInt(1, config.rows - 1) * NODE_SIZE * 2)
            newPositions.push(pos)
        }
    })

    newPositions.forEach(pos => {
        if (nodes.some(n => n.pos.dist(pos) < config.minDist)) return
        nodes.push(new Node(0, pos.x, pos.y))
    })

    nodes.map((n, i) => n.id = i)
    addEdges(nodes, edges)

    nodes.filter(n => n.connections.left === undefined || n.connections.right === undefined)
        .forEach(n => {
            const others = nodes.filter(o => o !== n)
            others.sort((a, b) => a.pos.dist(n.pos) < b.pos.dist(n.pos) ? -1 : 0)
            addEdge(n, others[0], edges)
        })

    return { nodes, edges }
}


const checkGraphes = (nodes: Node[]) => {
    const graphs = {}
    const visited = []

    const followGraph = (startId: number, node: Node, visited: Node[]) => {
        node.getNeighbours().forEach(next => {
            visited.push(node)
            graphs[startId].push(node)
            if (!visited.includes(next)) {
                followGraph(startId, next, visited)
            }
        })
        return
    }

    const n = nodes[0]
    visited.push(n)
    graphs[n.id] = [n]
    followGraph(n.id, n, visited)

    nodes.forEach(n => {
        if (visited.includes(n)) return
        visited.push(n)
        graphs[n.id] = [n]
        followGraph(n.id, n, visited)
    })

    const toRemove = []
    Object.keys(graphs).forEach(k => {
        if (graphs[k].length > 1) return

        if (graphs[k][0].getNeighbours().length != 0) {
            toRemove.push(k)
        }
    })

    toRemove.forEach(k => {
        //delete graphs[k]
    })

    return graphs
}


const addEdges = (nodes: Node[], edges: Edge[]) => {
    const canceledNodes = {}
    nodes.forEach(n => {
        canceledNodes[n.id] = []
    })

    const vectors = []

    nodes.forEach(n => {
        let copy = nodes.filter(n1 => n1 !== n).filter(n1 => !canceledNodes[n.id].includes(n1.id))
        copy.sort((a, b) => a.pos.dist(n.pos) < b.pos.dist(n.pos) ? -1 : 0)

        for (let i = 0; i < 5; i++) {
            const closest = copy[i]
            if (addEdge(n, closest, edges)) {
                canceledNodes[n.id].push(closest.id)
            }
        }

    })
    return vectors
}

const addEdge = (n: Node, closest: Node, edges: Edge[]) => {
    const e = new Edge(n, closest, edges.length)

    const edgeLine = e.getLine()

    // check for intersection with other edges
    if (edges.some(e2 => {
        if (e2.endNode === n || e2.startNode === n || e2.endNode === closest || e2.startNode === closest) return false
        const res = checkLineIntersection(e2.getLine(), edgeLine)
        if (res === false) return false
        //vectors.push(res)
        return true
    })) return

    // check if angle to steep
    let angle = Math.abs(radToDeg(Math.atan2(edgeLine.p2.x - edgeLine.p1.x, edgeLine.p2.y - edgeLine.p1.y)))
    if (angle > 90) {
        angle -= 90
    }


    if (angle !== 0 && angle < config.maxAngle) return
    const diffX = absoluteDist(n, closest, "x")
    const diffY = absoluteDist(n, closest, "y")

    if (diffX >= diffY) {
        if (n.pos.x < closest.pos.x) { // left
            if (closest.connections.left === undefined && n.connections.right === undefined) {
                closest.connections.left = e
                n.connections.right = e
                edges.push(e)
                return true
            }
        } else if (n.pos.x > closest.pos.x) { // right
            if (closest.connections.right === undefined && n.connections.left === undefined) {
                closest.connections.right = e
                n.connections.left = e
                edges.push(e)
                return true
            }
        }
    } else {
        if (n.pos.y < closest.pos.y) { // top
            if (closest.connections.top === undefined && n.connections.bottom === undefined) {
                closest.connections.top = e
                n.connections.bottom = e
                edges.push(e)
                return true
            }

        } else if (n.pos.y > closest.pos.y) { // bottom
            if (closest.connections.bottom === undefined && n.connections.top === undefined) {
                closest.connections.bottom = e
                n.connections.top = e
                edges.push(e)
                return true
            }
        }
    }
    return false
}

const getMinXminY = (nodes: Node[]): Node => {
    let node;
    let tX = Infinity
    let tY = Infinity

    nodes.forEach(n => {
        const { x, y } = n.pos
        if (x <= tX && y <= tY) {
            node = n
            tX = x
            tY = y
        }
    })
    return node
}


const getMaxXminY = (nodes: Node[]): Node => {
    let node;
    let tX = 0
    let tY = Infinity

    nodes.forEach(n => {
        const { x, y } = n.pos
        if (x >= tX && y <= tY) {
            node = n
            tX = x
            tY = y
        }
    })
    return node
}

const getMaxXmaxY = (nodes: Node[]): Node => {
    let node;
    let tX = 0
    let tY = 0

    nodes.forEach(n => {
        const { x, y } = n.pos
        if (x >= tX && y >= tY) {
            node = n
            tX = x
            tY = y
        }
    })
    return node
}

const getMinXmaxY = (nodes: Node[]): Node => {
    let node;
    let tX = Infinity
    let tY = 0

    nodes.forEach(n => {
        const { x, y } = n.pos
        if (x <= tX && y >= tY) {
            node = n
            tX = x
            tY = y
        }
    })
    return node
}


export const absoluteDist = (node1: Node, node2: Node, axis: string) => {
    return Math.abs(Math.abs(node1.pos[axis]) - Math.abs(node2.pos[axis]))
}

export default genRandomCity
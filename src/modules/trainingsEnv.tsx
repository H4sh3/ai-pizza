import { NODE_SIZE } from "./const";
import { Edge, Node } from "./models";

const getTrainingsEnv = (): { nodes: Node[], edges: Edge[] } => {

    const nodes: Node[] = []
    const edges: Edge[] = []

    let offSet = NODE_SIZE * 2

    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            nodes.push(new Node(0, offSet + (x * 4 * NODE_SIZE * 1.5), offSet + (y * 4 * NODE_SIZE)))
        }
    }

    nodes.map((n, i) => n.id = i)

    // add edges
    nodes.forEach((n, i) => {
        const left = nodes[i - 1]
        if (left && left.connections.right === undefined && ![3, 7, 11, 15].includes(left.id)) {
            const e = new Edge(n, left, 0)
            left.connections.right = e
            n.connections.left = e
            edges.push(e)
        }

        const bottom = nodes[i + 4]
        if (bottom && bottom.connections.right === undefined) {//&& ![3, 7, 11, 15].includes(bottom.id)) {
            const e = new Edge(n, bottom, 0)
            bottom.connections.top = e
            n.connections.bottom = e
            edges.push(e)
        }
    })

    edges.map((e, i) => e.id = i)
    const n16 = new Node(0, offSet + (5 * 4 * NODE_SIZE * 1.5), offSet + (0 * 4 * NODE_SIZE))
    const n17 = new Node(0, offSet + (5 * 4 * NODE_SIZE * 1.5), offSet + (2 * 4 * NODE_SIZE))
    const n18 = new Node(0, offSet + (4 * 4 * NODE_SIZE * 1.5), offSet + (2 * 4 * NODE_SIZE))
    const n19 = new Node(0, offSet + (6 * 4 * NODE_SIZE * 1.5), offSet + (0 * 4 * NODE_SIZE))
    const n20 = new Node(0, offSet + (6 * 4 * NODE_SIZE * 1.5), offSet + (3 * 4 * NODE_SIZE))
    const n21 = new Node(0, offSet + (5 * 4 * NODE_SIZE * 1.5), offSet + (1 * 4 * NODE_SIZE))

    nodes.push(n16)
    nodes.push(n17)
    nodes.push(n18)
    nodes.push(n19)
    nodes.push(n20)
    nodes.push(n21)

    nodes.map((n, i) => n.id = i)

    const n11 = nodes[11]
    const n15 = nodes[15]

    edges.push(addEdge(n16, n19))
    edges.push(addEdge(n17, n18))
    edges.push(addEdge(n11, n18))
    edges.push(addEdge(n21, n17))
    edges.push(addEdge(n19, n20))
    edges.push(addEdge(n21, n16))
    edges.push(addEdge(n15, n20))

    edges.map((n, i) => n.id = i)

    return { nodes, edges }
}

const addEdge = (n1: Node, n2: Node): Edge => {
    let e = new Edge(n1, n2, 0)

    // above or bellow
    if (n1.pos.x === n2.pos.x) {
        //above
        if (n1.pos.y < n2.pos.y) {
            n1.connections.bottom = e
            n2.connections.top = e
        }
        else {
            n1.connections.top = e
            n2.connections.bottom = e
        }
        //left or right
    } else if (n1.pos.y === n2.pos.y) {
        // left
        if (n1.pos.x < n2.pos.x) {
            n1.connections.right = e
            n2.connections.left = e
        }
        else {
            n1.connections.left = e
            n2.connections.right = e
        }
    }
    return e
}

export default getTrainingsEnv;
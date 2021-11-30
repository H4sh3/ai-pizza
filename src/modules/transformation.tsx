import { Edge, Segment, SegmentJson, Node } from "./models";



export const loadData = (input: SegmentJson[]): Segment[] => {
    const segments = new Map<number, Segment>();
    input.forEach(s => {
        segments.set(s.id, {
            id: s.id,
            start: s.start,
            end: s.end,
            forward: [],
            backward: [],
        })
    })

    input.forEach(s => {
        const segment = segments.get(s.id)
        segment.forward = s.forward.map(f => segments.get(segments.get(f).id))
        segment.backward = s.backward.map(f => segments.get(segments.get(f).id))
    })

    let tmp: Segment[] = []
    segments.forEach((s, k) => {
        tmp.push(s)
    })

    let minX = 0
    let minY = 0

    tmp.forEach(s => {
        if (s.start.x < minX) {
            minX = s.start.x
        }
        if (s.end.x < minX) {
            minX = s.end.x
        }
        if (s.start.y < minY) {
            minY = s.start.y
        }
        if (s.end.y < minY) {
            minY = s.end.y
        }
    })

    minX = Math.abs(minX)
    minY = Math.abs(minY)

    tmp.forEach(s => {
        s.start.x += minX
        s.start.y += minY
        s.end.x += minX
        s.end.y += minY
    })

    const faktor = 0.3
    tmp.forEach(s => {
        s.start.x *= faktor
        s.start.y *= faktor
        s.end.x *= faktor
        s.end.y *= faktor
        s.start.x += 100
        s.start.y += 100
        s.end.x += 100
        s.end.y += 100

        s.start.x = Math.round(s.start.x)
        s.start.y = Math.round(s.start.y)
        s.end.x = Math.round(s.end.x)
        s.end.y = Math.round(s.end.y)
    })

    return tmp
}


const genPosUUID = (x: number, y: number) => {
    return `${x}#${y}`
}

export const transformation = (segments: Segment[]): { nodes: Node[], edges: Edge[] } => {
    const nodes: Map<string, Node> = getNodes(segments)
    const edges: Edge[] = getEdges(nodes, segments)
    relateNotes(edges)

    const nArr = Array.from(nodes.values())
    //nArr.filter(n => n.id == 0)[0].id = -1

    return { nodes: removeSimple(nArr), edges }
}

const getNodes = (segments: Segment[]) => {
    const nodes: Map<string, Node> = new Map<string, Node>()
    // create map with nodes
    const posUUIDS = []
    segments.forEach(s => {
        const posUUIDstart = genPosUUID(s.start.x, s.start.y)
        if (!posUUIDS.includes(posUUIDstart)) {
            posUUIDS.push(posUUIDstart)
            nodes.set(posUUIDstart, new Node(s.id, s.start.x, s.start.y))
        }

        const posUUIDend = genPosUUID(s.end.x, s.end.y)
        if (!posUUIDS.includes(posUUIDend)) {
            posUUIDS.push(posUUIDend)
            nodes.set(posUUIDend, new Node(s.id, s.end.x, s.end.y))
        }
    })
    return nodes
}

const getEdges = (nodes: Map<string, Node>, segments: Segment[]) => {
    const edges: Edge[] = []

    segments.forEach(s => {
        const node1 = nodes.get(genPosUUID(s.start.x, s.start.y))
        const node2 = nodes.get(genPosUUID(s.end.x, s.end.y))
        if (node1.id === 42 || node2.id === 42) {
            console.log(node1, node2)
        }
        edges.push(new Edge(node1, node2))
    })

    let indx = 0
    edges.forEach(e => {
        e.id = indx++
    })

    return edges
}


const removeSimple = (nodes: Node[]) => {
    let run = true
    let i = 0
    while (run) {
        i++
        let changed = false
        let rmId
        nodes.forEach(e => {
            if (changed) return
            if (e.connections.top !== undefined) return
            if (e.connections.bottom !== undefined) return
            if (e.connections.left === undefined) return
            if (e.connections.right === undefined) return

            e.connections.left.exchangeNode(e.id, e.connections.right.getOther(e.id))
            e.connections.right.exchangeNode(e.id, e.connections.left.getOther(e.id))

            rmId = e.id
            changed = true
        })

        if (!changed) {
            run = false
        }
        nodes = nodes.filter(x => x.id !== rmId)
    }

    run = true
    i = 0
    while (run) {
        i++
        let changed = false
        let rmId
        nodes.forEach(e => {
            if (changed) return
            if (e.connections.top === undefined) return
            if (e.connections.bottom === undefined) return
            if (e.connections.left !== undefined) return
            if (e.connections.right !== undefined) return

            e.connections.top.exchangeNode(e.id, e.connections.bottom.getOther(e.id))
            e.connections.bottom.exchangeNode(e.id, e.connections.top.getOther(e.id))

            rmId = e.id
            changed = true
        })

        if (!changed) {
            run = false
        }
        nodes = nodes.filter(x => x.id !== rmId)
    }
    return nodes
}

export const absoluteDist = (node1: Node, node2: Node, axis: string) => {
    return Math.abs(Math.abs(node1.pos[axis]) - Math.abs(node2.pos[axis]))
}

const relateNotes = (edges: Edge[]) => {
    edges.forEach(e => {
        const { startNode, endNode } = e
        // locate endNode relativ to startNode
        const diffX = absoluteDist(startNode, endNode, "x")
        const diffY = absoluteDist(startNode, endNode, "y")

        if (diffX > diffY) {
            if (endNode.pos.x < startNode.pos.x) { // left
                startNode.connections.left = e
                endNode.connections.right = e
            } else if (endNode.pos.x > startNode.pos.x) { // right
                startNode.connections.right = e
                endNode.connections.left = e
            }
        }
        else {
            if (endNode.pos.y < startNode.pos.y) { // top
                startNode.connections.top = e
                endNode.connections.bottom = e
            } else if (endNode.pos.y > startNode.pos.y) { // bottom
                startNode.connections.bottom = e
                endNode.connections.top = e
            }
        }
    })
}
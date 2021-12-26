import { Node } from '../models/graph'

import priorityQueue from "./prioQueue"

const search = (nodes: Node[], start: Node, end: Node): Node[] => {
    const openList = priorityQueue<Node>()
    openList.put(start, 0)

    const closeList = {}
    closeList[start.id] = 0

    const prevNode = {}
    prevNode[start.id] = null

    while (openList.size() > 0) {
        const current = openList.pop()

        if (current == end) {
            break
        }

        current.edges.map(e => e.getOther(current)).forEach(neighbour => {
            if (closeList[neighbour.id]) return // checked already
            const newCost: number = closeList[current.id] + current.pos.dist(neighbour.pos)
            closeList[neighbour.id] = newCost
            prevNode[neighbour.id] = current
            openList.put(neighbour, newCost)
        });
    }

    const route = [end]
    try {
        let next = prevNode[end.id]
        route.push(next)

        while (next.id !== start.id) {
            next = prevNode[next.id]
            route.push(next)
        }
        return route.reverse()
    } catch {
        return []
    }

}

export default search
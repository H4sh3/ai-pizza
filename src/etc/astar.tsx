
// a start

import { NewNode } from "../models/graph"
import { Node } from "../modules/models"
import priorityQueue from "./prioQueue"

const search = (nodes: NewNode[], start: NewNode, end: NewNode): NewNode[] => {
    let x: NewNode[] = []

    const openList = priorityQueue<NewNode>()
    openList.put(start, 0)

    const closeList = {}
    closeList[start.id] = 0

    const prevNode = {}
    prevNode[start.id] = null

    const unknown = nodes.filter(n => n !== start)

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
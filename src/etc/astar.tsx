
// a start

import { Node } from "../modules/transformation"
import HashMap from "./hashmap"
import priorityQueue from "./prioQueue"

const search = (nodes: Node[], start: Node, end: Node): Node[] => {
    let x: Node[] = []

    const openList = priorityQueue<Node>()
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

        current.getNeightbours().forEach(neighbour => {
            //console.log({ neighbour })
            if (closeList[neighbour.id]) return // checked already
            const newCost: number = closeList[current.id] + current.pos.dist(neighbour.pos)
            closeList[neighbour.id] = newCost
            prevNode[neighbour.id] = current
            openList.put(neighbour, newCost)
        });
    }

    //const all = []
    //Object.keys(prevNode).forEach(k => {
    //    all.push(prevNode[k])
    //})
    //return all

    const route = [end]
    let next = prevNode[end.id]
    route.unshift(next)

    while (next.id !== start.id) {
        next = prevNode[next.id]
        route.unshift(next)
    }

    return route
}

export default search
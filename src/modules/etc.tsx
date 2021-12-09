import search from "../etc/astar"
import Agent, { Sensor, SensorSettings } from "./agent"
import { NODE_SIZE } from "./const"
import { checkLineIntersection, map } from "./math"
import { isVector, Line, Node, Vector } from "./models"

export const getCheckpoints = (path: Node[]): Line[] => {
    // generates checkpoints for a list of nodes
    // checkpoint direction depends on the following node
    // this way a route of checkpoints is generated that the agent follows
    const checkpoints: Line[] = []

    for (let i = 0; i < path.length - 1; i++) {
        const node = path[i]
        const nextNode = path[i + 1]
        Object.keys(node.connections).some(k => {
            if (node.connections[k] === undefined) return

            if (node.connections[k].startNode === nextNode || node.connections[k].endNode === nextNode) {
                checkpoints.push(getCheckpoint(node.pos, k))
                return true
            }
        })
    }
    return checkpoints
}

export const getCheckpoint = (pos, direction) => {
    if (direction === "top") {
        return new Line(pos.x - NODE_SIZE, pos.y - NODE_SIZE, pos.x + NODE_SIZE, pos.y - NODE_SIZE)
    }
    if (direction === "right") {
        return new Line(pos.x + NODE_SIZE, pos.y - NODE_SIZE, pos.x + NODE_SIZE, pos.y + NODE_SIZE)
    }
    if (direction === "left") {
        return new Line(pos.x - NODE_SIZE, pos.y - NODE_SIZE, pos.x - NODE_SIZE, pos.y + NODE_SIZE)
    }
    if (direction === "bottom") {
        return new Line(pos.x - NODE_SIZE, pos.y + NODE_SIZE, pos.x + NODE_SIZE, pos.y + NODE_SIZE)
    }
}

export function getSensorIntersectionsWith(agent: Agent, transformedSensors: Line[], otherObjects: Line[]) {
    const inputs = []
    const intersectionPoints = []
    transformedSensors.forEach(sensor => {
        let closest = Infinity
        let closestIntersectionPoint: boolean | Vector = false
        otherObjects.forEach(line => {
            const intersectionPoint = checkLineIntersection(sensor, line)
            if (isVector(intersectionPoint)) {
                if (agent.pos.dist(intersectionPoint) < closest) {
                    closestIntersectionPoint = intersectionPoint
                    closest = agent.pos.dist(intersectionPoint)
                }
            }
        })

        if (isVector(closestIntersectionPoint)) {
            intersectionPoints.push(new Line(agent.pos.x, agent.pos.y, closestIntersectionPoint.x, closestIntersectionPoint.y))
            inputs.push(map(closestIntersectionPoint.dist(agent.pos), 0, agent.settings.sensorSettings.len, 0, 1))
        } else {
            inputs.push(1)
        }
    })

    return [inputs, intersectionPoints]
}

export function transformSensor(s: Sensor, agent: Agent) {
    const current = s.pos.copy()
    current.rotate(s.rot + agent.dir.heading())
    current.add(agent.pos)
    return new Line(current.x, current.y, agent.pos.x, agent.pos.y)
}


export const getBody = (agent: Agent): Line[] => {
    return [new Line(agent.pos.x - 5, agent.pos.y, agent.pos.x + 5, agent.pos.y),
    new Line(agent.pos.x, agent.pos.y - 5, agent.pos.x, agent.pos.y + 5)]
}

export const agentsCollisions = (agent: Agent, roads: Line[], checkpoints: Line[]): boolean => {
    const body = getBody(agent)
    handleCollisions(agent, body, roads)
    return handleCheckpoints(agent, body, checkpoints)
}

export const handleCollisions = (agent: Agent, body: Line[], roads: Line[]) => {
    // check collision with roads
    body.forEach(part => {
        roads.forEach(wall => {
            if (isVector(checkLineIntersection(part, wall))) {
                agent.kill()
                //should kill the loop
                return
            }
        })
    })
}

export const handleCheckpoints = (agent: Agent, body: Line[], checkpoints: Line[]): boolean => {
    agent.tickSinceLastCP++
    let collWithLastCp = false
    body.forEach(part => {
        const targetCP = checkpoints[agent.reachedCheckpoints % checkpoints.length]
        if (isVector(checkLineIntersection(part, targetCP))) {
            agent.tickSinceLastCP = 0
            agent.reachedCheckpoints++
            if (!collWithLastCp) {
                collWithLastCp = agent.reachedCheckpoints === checkpoints.length
                return collWithLastCp
            }
        }
    })
    return collWithLastCp
}

export const directionOfNodes = (n1: Node, n2: Node): Vector => {
    let x = 0
    let y = 0
    if (n1.connections.left !== undefined && n1.connections.left.getOther(n1.id).id === n2.id) {
        x = -1
    } else if (n1.connections.right !== undefined && n1.connections.right.getOther(n1.id).id === n2.id) {
        x = 1
    } else if (n1.connections.top !== undefined && n1.connections.top.getOther(n1.id).id === n2.id) {
        y = -1
    } else if (n1.connections.bottom !== undefined && n1.connections.bottom.getOther(n1.id).id === n2.id) {
        y = 1
    }
    return new Vector(x, y)
}

export const getAllRoutesDict = (nodes: Node[]) => {
    const routeLengthDict = {}
    // calculate length between all nodes
    for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes.length; j++) {
            if (i == j) continue
            let path = search(nodes, nodes[i], nodes[j])
            if (routeLengthDict[path.length]) {
                routeLengthDict[path.length].push(path)
            } else {
                routeLengthDict[path.length] = [path]
            }
        }
    }

    const sorted: { l: number, routes: Node[][] }[] = []
    Object.keys(routeLengthDict).forEach(k => {
        sorted.push({ "l": +k, routes: routeLengthDict[k] })
    })

    sorted.sort((a, b) => a.l > b.l ? -1 : 0)

    return sorted;

}
import search from "../etc/astar"
import Agent, { Sensor, SensorSettings } from "./agent"
import { NODE_SIZE, scaleFactor } from "./const"
import { checkLineIntersection, map } from "../etc/math"
import Vector, { isVector } from "../models/vector"
import { Edge, Node } from "../models/graph"
import { Line, OldNode } from "./models"
import { check } from "prettier"
import { City } from "../models/city"

export const getCheckpointsOld = (path: OldNode[]): Line[] => {
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

export const getCheckpoints = (route: Node[], city: City) => {
    const checkpoints = []
    for (let i = 1; i < route.length; i++) {
        const n1 = route[i - 1]
        const n2 = route[i]

        const inter = city.getIntersection(n1)
        const line = inter.turns.find(t => t.node === n2).line
        checkpoints.push(line)
    }
    const inter = city.getIntersection(route[route.length - 1])
    route[route.length - 2]
    const line = inter.turns.find(t => t.node === route[route.length - 2]).line
    checkpoints.push(line)
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
    return [
        new Line(agent.pos.x - 5, agent.pos.y, agent.pos.x + 5, agent.pos.y),
        new Line(agent.pos.x, agent.pos.y - 5, agent.pos.x, agent.pos.y + 5)
    ]
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
    return n1.pos.copy().sub(n2.pos).normalize().rotate(180)
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


export const serializeGraph = (nodes: Node[], edges: Edge[]) => {
    let s = "[\n"
    nodes.forEach(n => {
        s += `{"id":"${n.id}" , "x":${n.pos.x} , "y":${n.pos.y}, "edges":[${n.edges.map(n => { return `"${n.id}"` })}]},`
    })
    s += `\n]`
    let e = "[\n"
    edges.forEach(n => {
        e += `{"id":"${n.id}" , "start":"${n.node1.id}" , "end":"${n.node2.id}" },`
    })
    e += `\n]`
}

export const deserialize = (nodesSer, edgesSer): { nodes: Node[], edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 1. create nodes with id and pos
    nodesSer.forEach(n => {
        const node = new Node(new Vector(n.x, n.y))
        node.id = n.id
        nodes.push(node)
    })

    // 2. create edges with nodes
    edgesSer.forEach(eSer => {
        const n1 = nodes.find(n => n.id === eSer.start)
        const n2 = nodes.find(n => n.id === eSer.end)
        const e = new Edge(n1, n2)
        e.id = eSer.id
        edges.push(e)
    })

    // 3. iterate over nodes and set edges on connections
    nodesSer.forEach(n => {
        const node = nodes.find(nx => nx.id === n.id)
        n.edges.forEach(eId => {
            const e = edges.find(e => e.id === eId)
            node.edges.push(e)
        })
    })
    return { nodes, edges }
}

export function shuffle<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

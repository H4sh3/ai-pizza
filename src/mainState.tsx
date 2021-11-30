import create from 'zustand';
import { combine } from 'zustand/middleware';
import produce from 'immer';
import { Edge, isVector, Line, Node, Vector } from './modules/models';
import Agent, { AgentSettings, Sensor } from './modules/agent';
import { checkLineIntersection, map } from './modules/math'
import { randInt } from './modules/mapgen';
import search from './etc/astar';
import { NODE_SIZE } from './modules/const';
import { randomInt } from 'crypto';

interface State {
    readonly nodes: Node[],
    readonly edges: Edge[],
    readonly agents: Agent[],
    readonly roads: Line[]
    readonly checkpoints: Line[],
    readonly intersections: Vector[]
}

export const useMainState = create(
    combine(
        {
            nodes: [],
            edges: [],
            agents: [],
            roads: [],
            checkpoints: [],
            intersections: []

        } as State,
        (set, get) => ({
            setNodes: (nodes: Node[]) => {
                set((state) => produce(state, draftState => {
                    draftState.nodes = nodes
                    draftState.roads = []
                    nodes.forEach(n => {
                        draftState.roads = [...draftState.roads, ...n.getLines()]
                    })
                }));
            },
            getNodes: () => {
                return get().nodes;
            },
            getIntersections: () => {
                return get().intersections;
            },
            getCheckpoints: () => {
                return get().checkpoints;
            },
            spawnAgent: () => {
                set((state) => produce(state, draftState => {

                    // generate route for agent
                    const { nodes } = state
                    let start = nodes[0]
                    let end = nodes[randInt(1, nodes.length)]
                    let path = search(nodes, start, end)
                    while (path.length === 0) {
                        start = nodes[randInt(1, nodes.length)]
                        end = nodes[randInt(1, nodes.length)]
                        if (start === end) continue
                        path = search(nodes, start, end)
                    }
                    const startNode = path[0]
                    const s2 = path[1]
                    let dirX = 0
                    let dirY = 0
                    if (startNode.connections.left !== undefined && startNode.connections.left.getOther(startNode.id).id === s2.id) {
                        dirX = -1
                    } else if (startNode.connections.right !== undefined && startNode.connections.right.getOther(startNode.id).id === s2.id) {
                        dirX = 1
                    } else if (startNode.connections.top !== undefined && startNode.connections.top.getOther(startNode.id).id === s2.id) {
                        dirY = -1
                    } else if (startNode.connections.bottom !== undefined && startNode.connections.bottom.getOther(startNode.id).id === s2.id) {
                        dirY = 1
                    }
                    draftState.checkpoints = getCheckpoints(path)

                    // add agent with route
                    const settings: AgentSettings = {
                        dirX,
                        dirY,
                        steerRange: 15,
                        velReduction: 1.25,
                        startPos: startNode.pos.copy(),
                        sensorSettings: {
                            num: 5,
                            len: 25,
                            fov: 120
                        }
                    }
                    const agent = new Agent(settings)
                    draftState.agents = [...draftState.agents, agent]
                }));
            },
            runGameLoop: () => {
                set((state) => produce(state, draftState => {
                    draftState.agents.filter(a => a.alive).forEach(a => {
                        const roadIntersections = getSensorIntersectionsWith(a, state.roads)
                        const checkpointIntersections = getSensorIntersectionsWith(a, state.checkpoints)
                        const inputs = [...roadIntersections, ...checkpointIntersections]
                        updateAgent(a, state.roads, state.checkpoints)
                        a.update(inputs)
                    })
                }));
            },
            getAgents: () => {
                return get().agents;
            },
        })
    )
);


const getBody = (agent: Agent): Line[] => {
    return [new Line(agent.pos.x - 5, agent.pos.y, agent.pos.x + 5, agent.pos.y),
    new Line(agent.pos.x, agent.pos.y - 5, agent.pos.x, agent.pos.y + 5)]
}

const updateAgent = (agent: Agent, roads: Line[], checkpoints: Line[]) => {
    const body = getBody(agent)
    handleCollisions(agent, body, roads)
    handleCheckpoints(agent, body, checkpoints)
}

const handleCollisions = (agent: Agent, body: Line[], roads: Line[]) => {
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

const handleCheckpoints = (agent: Agent, body: Line[], checkpoints: Line[]) => {
    body.forEach(part => {
        checkpoints.forEach((cp, index) => {
            if (isVector(checkLineIntersection(part, cp))) {
                if (agent.reachedCheckpoints % checkpoints.length == index) {
                    agent.reachedCheckpoints++
                    return
                }
            }
        })
    })
}

const getCheckpoints = (path: Node[]): Line[] => {
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

const getCheckpoint = (pos, direction) => {
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

function getSensorIntersectionsWith(agent: Agent, otherObjects: Line[]) {
    const inputs = []
    const intersectionPoints = []
    agent.sensors.forEach(sensor => {
        let closest = Infinity
        let closestIntersectionPoint: boolean | Vector = false
        otherObjects.forEach(line => {
            const sensorLine = transformSensor(sensor, agent)
            const intersectionPoint = checkLineIntersection(sensorLine, line)
            if (isVector(intersectionPoint)) {
                if (agent.pos.dist(intersectionPoint) < closest) {
                    closestIntersectionPoint = intersectionPoint
                    closest = agent.pos.dist(intersectionPoint)
                }
            }
        })

        if (isVector(closestIntersectionPoint)) {
            intersectionPoints.push(closestIntersectionPoint)
            inputs.push(map(closestIntersectionPoint.dist(agent.pos), 0, agent.settings.sensorSettings.len, 0, 1))
        } else {
            inputs.push(1)
        }
    })

    return inputs
}

function transformSensor(s: Sensor, agent: Agent) {
    const current = s.pos.copy()
    current.rotate(s.rot + agent.acc.heading())
    current.add(agent.pos)
    return new Line(current.x, current.y, agent.pos.x, agent.pos.y)
}
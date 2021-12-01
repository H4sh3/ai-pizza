import create from 'zustand';
import { combine } from 'zustand/middleware';
import produce from 'immer';
import { Edge, isVector, Line, Node, Vector } from './modules/models';
import Agent, { AgentSettings, Sensor } from './modules/agent';
import { checkLineIntersection, map } from './modules/math'
import { randInt } from './modules/mapgen';
import search from './etc/astar';
import { NODE_SIZE } from './modules/const';
import NeuralNetwork from './thirdparty/nn';

interface State {
    readonly nodes: Node[],
    readonly edges: Edge[],
    readonly agents: Agent[],
    readonly roads: Line[],
    readonly intersections: Vector[],
    readonly bestNeuralNet: NeuralNetwork,
    readonly mostCheckpoints: number,
    readonly running: boolean,
    readonly iteration: number,
    readonly popSize: number,
    readonly pretrain: boolean,
    readonly pretrainEpoch: number,
    readonly checkpoints: Line[] | undefined,
    readonly startPos: Vector
    readonly maxIter: number
    readonly epoch: number
}

export const useMainState = create(
    combine(
        {
            nodes: [],
            edges: [],
            agents: [],
            roads: [],
            checkpoints: [],
            intersections: [],
            bestNeuralNet: new NeuralNetwork(0, 0, 0),
            mostCheckpoints: -1,
            running: true,
            iteration: 0,
            maxIter: 1000,
            popSize: 20,
            pretrain: true,
            pretrainEpoch: 0,
            epoch: 0,
            startPos: new Vector(0, 0)
        } as State,
        (set, get) => ({
            setNodes: (nodes: Node[]) => {
                set((state) => produce(state, draftState => {
                    draftState.nodes = nodes
                    draftState.roads = []
                    const usedIds = []
                    nodes.forEach(n => {
                        draftState.roads = [...draftState.roads, ...n.getLines(usedIds)]
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
            enableFastTrain: () => {
                set((state) => produce(state, draftState => {
                    draftState.pretrainEpoch = 0
                    draftState.pretrain = true
                }))
            },
            spawnAgent: () => {
                set((state) => produce(state, draftState => {

                    // generate route for agent
                    const { nodes } = state
                    //const path = getRandomPath(nodes)
                    const p = [18, 17, 21, 16, 19, 20, 15, 11, 18]
                    let path = p.map(id => nodes.filter(n => n.id === id)[0])
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
                    const checkpoints = getCheckpoints(path)
                    if (draftState.checkpoints.length === 0) {
                        draftState.checkpoints = checkpoints
                        draftState.startPos = startNode.pos.copy()
                    }
                    const settings: AgentSettings = {
                        dirX,
                        dirY,
                        steerRange: 25,
                        velReduction: 1.25,
                        startPos: draftState.startPos.copy(),
                        sensorSettings: {
                            num: 7,
                            len: 75,
                            fov: 200
                        }
                    }
                    const agent = new Agent(settings)


                    draftState.agents = [...draftState.agents, agent]
                }));
            },
            runGameLoop: (context) => {
                set((state) => produce(state, draftState => {
                    const evaluate = () => {
                        // eval
                        draftState.iteration = 0
                        draftState.agents.sort((a, b) => a.reachedCheckpoints > b.reachedCheckpoints ? -1 : 0)

                        const mostCheckpoints = state.agents[0].reachedCheckpoints
                        console.log(mostCheckpoints)
                        if (mostCheckpoints > state.mostCheckpoints) {
                            draftState.pretrain = false
                            console.log(mostCheckpoints)
                            draftState.mostCheckpoints = mostCheckpoints
                            draftState.bestNeuralNet = state.agents[0].nn.copy()
                        }
                        // keep agent 0

                        if (draftState.epoch > 35 && state.mostCheckpoints < 3) {
                            draftState.agents.map(a => a.nn.mutate(1))
                            draftState.epoch = 0
                            console.log("create reset")
                        } else {
                            for (let i = 1; i < draftState.agents.length; i++) {
                                const x = draftState.bestNeuralNet.copy()
                                x.mutate(0.1)
                                draftState.agents[i].nn = x
                            }
                        }
                        draftState.agents.map(a => a.reset())

                        if (draftState.pretrainEpoch > 100) {
                            draftState.pretrain = false
                        } else {
                            draftState.pretrainEpoch++
                        }

                        draftState.epoch++
                    }

                    while (draftState.pretrain) {
                        const alive = state.agents.filter(a => a.alive).length

                        if (draftState.iteration < draftState.maxIter && alive > 0) {
                            // update agents
                            draftState.agents.filter(a => a.alive).forEach(a => {
                                const roadIntersections = getSensorIntersectionsWith(context, a, state.roads)
                                const checkpointIntersections = getSensorIntersectionsWith(context, a, state.checkpoints)
                                const inputs = [...roadIntersections[0]]//, ...checkpointIntersections[0]]
                                agentsCollisions(a, state.roads, state.checkpoints)
                                a.update(inputs)
                            })
                            draftState.iteration++
                        } else {
                            evaluate()
                        }
                    }

                    const alive = state.agents.filter(a => a.alive).length
                    draftState.intersections = []
                    if (draftState.iteration < draftState.maxIter && alive > 0) {
                        // update agents
                        draftState.agents.filter(a => a.alive).forEach(a => {

                            if (draftState.iteration > 15 && a.pos.dist(a.settings.startPos) < 25) a.kill()

                            const roadIntersections = getSensorIntersectionsWith(context, a, state.roads)
                            const checkpointIntersections = getSensorIntersectionsWith(context, a, state.checkpoints)
                            const inputs = [...roadIntersections[0]]//, ...checkpointIntersections[0]]
                            agentsCollisions(a, state.roads, state.checkpoints)
                            a.update(inputs)
                            draftState.intersections = [...draftState.intersections, ...roadIntersections[1], ...checkpointIntersections[1]]
                        })
                        draftState.iteration++
                    } else {
                        evaluate()
                    }

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

const agentsCollisions = (agent: Agent, roads: Line[], checkpoints: Line[]) => {
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
    agent.tickSinceLastCP++
    body.forEach(part => {
        const targetCP = checkpoints[agent.reachedCheckpoints % checkpoints.length]
        if (isVector(checkLineIntersection(part, targetCP))) {
            agent.tickSinceLastCP = 0
            agent.reachedCheckpoints++
            return
        }
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

function getSensorIntersectionsWith(context, agent: Agent, otherObjects: Line[]) {
    const inputs = []
    const intersectionPoints = []
    agent.sensors.forEach(sensor => {
        let closest = Infinity
        let closestIntersectionPoint: boolean | Vector = false
        otherObjects.filter(o => {
            return true//new Vector((o.p1.x + o.p2.x) / 2,(o.p1.y + o.p2.y) / 2).dist(agent.pos) < agent.settings.sensorSettings.len
        }).forEach(line => {
                const sensorLine = transformSensor(sensor, agent)
                context.beginPath();
                context.moveTo(sensorLine.p1.x, sensorLine.p1.y);
                context.lineTo(sensorLine.p2.x, sensorLine.p2.y);
                context.stroke();
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

    return [inputs, intersectionPoints]
}

function transformSensor(s: Sensor, agent: Agent) {
    const current = s.pos.copy()
    current.rotate(s.rot + agent.dir.heading())
    current.add(agent.pos)
    return new Line(current.x, current.y, agent.pos.x, agent.pos.y)
}

function getRandomPath(nodes: Node[]) {
    let start = nodes[0]
    let end = nodes[15]
    let path = search(nodes, start, end)
    while (path.length === 0) {
        start = nodes[randInt(1, nodes.length)]
        end = nodes[randInt(1, nodes.length)]
        if (start === end) continue
        path = search(nodes, start, end)
    }
    return path
}
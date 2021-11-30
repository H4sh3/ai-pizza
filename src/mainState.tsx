import create from 'zustand';
import { combine } from 'zustand/middleware';
import produce from 'immer';
import { Edge, Line, Node, Vector } from './modules/models';
import Agent, { AgentSettings } from './modules/agent';
import { checkLineIntersection } from './modules/math'

interface State {
    readonly nodes: Node[],
    readonly edges: Edge[],
    readonly agents: Agent[],
    readonly roads: Line[]
}

export const useMainState = create(
    combine(
        {
            nodes: [],
            edges: [],
            agents: [],
            roads: []
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
            spawnAgent: (pos: Vector) => {
                set((state) => produce(state, draftState => {
                    const settings: AgentSettings = {
                        dirX: 0,
                        dirY: 0,
                        steerRange: 15,
                        velReduction: 1.25,
                        startPos: pos.copy()
                    }
                    const agent = new Agent(settings)
                    draftState.agents = [...draftState.agents, agent]
                }));
            },
            runGameLoop: () => {
                set((state) => produce(state, draftState => {
                    draftState.agents.filter(a => a.alive).forEach(a => {
                        a.update(0)
                        updateAgent(a, state.roads)
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

const updateAgent = (agent: Agent, roads: Line[]) => {
    const body = getBody(agent)
    handleCollisions(agent, body, roads)
}


const handleCollisions = (agent: Agent, body: Line[], roads: Line[]) => {
    // check collision with roads
    body.forEach(part => {
        roads.forEach(wall => {
            if (checkLineIntersection(part, wall)) {
                agent.kill()
                //should kill the loop
                return
            }
        })
    })
}
import create from 'zustand';
import { combine } from 'zustand/middleware';
import produce from 'immer';
import { Edge, Node, Vector } from './modules/models';
import Agent, { AgentSettings } from './modules/agent';

interface State {
    readonly nodes: Node[],
    readonly edges: Edge[],
    readonly agents: Agent[],
}

export const useMainState = create(
    combine(
        {
            nodes: [],
            edges: [],
            agents: []
        } as State,
        (set, get) => ({
            setNodes: (nodes: Node[]) => {
                set((state) => produce(state, draftState => {
                    draftState.nodes = nodes
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
                    draftState.agents.forEach(a => {
                        a.update(0)
                    })
                }));
            },
            getAgents: () => {
                return get().agents;
            },
        })
    )
);

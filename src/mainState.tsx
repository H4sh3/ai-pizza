import create from 'zustand';
import { combine } from 'zustand/middleware';
import produce from 'immer';
import { Edge, Node } from './modules/models';

interface State {
    readonly nodes: Node[],
    readonly edges: Edge[],
}

export const useMainState = create(
    combine(
        {
            nodes: [],
            edges: []
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
        })
    )
);

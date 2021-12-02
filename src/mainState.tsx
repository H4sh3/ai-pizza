import create from 'zustand';
import { combine } from 'zustand/middleware';
import produce from 'immer';
import { Edge, Line, Node, Vector } from './modules/models';
import Agent from './modules/agent';
import NeuralNetwork from './thirdparty/nn';


interface State {
    readonly nodes: Node[],
    readonly edges: Edge[],
    readonly agents: Agent[],
    readonly roads: Line[],
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
            bestNeuralNet: new NeuralNetwork(0, 0, 0),
            mostCheckpoints: -1,
            running: true,
            iteration: 0,
            maxIter: 1000,
            popSize: 50,
            pretrain: true,
            pretrainEpoch: 0,
            epoch: 0,
            startPos: new Vector(0, 0),
            roadTree: []
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

                }));
            },
            getAgents: () => {
                return get().agents;
            },
        })
    )
);

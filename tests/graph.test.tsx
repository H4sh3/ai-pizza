import { complexConnect, connectNodes, NewEdge, NewNode } from "../src/models/graph";
import Vector from "../src/models/vector";

it('nodes and edges', () => {
    const n1 = new NewNode(new Vector(0, 0))
    const n2 = new NewNode(new Vector(100, 0))
    const n3 = new NewNode(new Vector(300, 0))

    const nodes: NewNode[] = [n1, n2, n3];

    const edges: NewEdge[] = [];
    const e1 = connectNodes(nodes, edges, n1, n2)
    const e2 = connectNodes(nodes, edges, n2, n3)

    expect(edges[0].node1).toBe(n1)
    expect(edges[0].node2).toBe(n2)
    expect(edges[1].node1).toBe(n2)
    expect(edges[1].node2).toBe(n3)

    const neighboursN2 = n2.getNeighbours()
    expect(neighboursN2.includes(n1)).toBeTruthy()
    expect(neighboursN2.includes(n3)).toBeTruthy()
});

it('intersection test', () => {
    const dist = 100
    const n1 = new NewNode(new Vector(-dist, 0))
    const n2 = new NewNode(new Vector(dist, 0))
    const n3 = new NewNode(new Vector(0, -dist))
    const n4 = new NewNode(new Vector(0, dist))
    const nodes: NewNode[] = [n1, n2, n3, n4];

    let edges: NewEdge[] = [];

    edges = complexConnect(nodes, edges, n1, n2)
    expect(nodes.length).toBe(4)
    expect(edges.length).toBe(1)

    // creates intersection
    edges = complexConnect(nodes, edges, n3, n4)
    expect(nodes.length).toBe(5)
    expect(edges.length).toBe(4)
});
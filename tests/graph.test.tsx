import { connectNodes, NewEdge, NewNode } from "../src/models/graph";
import Vector from "../src/models/vector";

it('nodes and edges', () => {
    const n1 = new NewNode(new Vector(0, 0))
    const n2 = new NewNode(new Vector(100, 0))
    const n3 = new NewNode(new Vector(300, 0))

    const e1 = connectNodes(n1, n2)
    const e2 = connectNodes(n2, n3)

    expect(e1.node1).toBe(n1)
    expect(e1.node2).toBe(n2)
    expect(e2.node1).toBe(n2)
    expect(e2.node2).toBe(n3)

    const neighboursN2 = n2.getNeighbours()
    expect(neighboursN2.includes(n1)).toBeTruthy()
    expect(neighboursN2.includes(n3)).toBeTruthy()
});
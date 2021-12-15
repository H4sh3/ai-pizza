import { radToDeg, randInt } from "../src/etc/math";
import { calculateCenter, getTurns, centerVector } from "../src/models/city";
import { complexConnect, NewEdge, NewNode } from "../src/models/graph";
import Vector from "../src/models/vector";
import { NODE_SIZE } from "../src/modules/const";

it('nodes and edges', () => {
    const v1 = new Vector(1, 1);
    const v2 = new Vector(1, -1);
    const v3 = new Vector(-1, 1);
    const v4 = new Vector(-1, -1);

    const center = calculateCenter([v1, v2, v3, v4])
    expect(center.x).toBe(0)
    expect(center.y).toBe(0)
});

it('add minimmum angle between vectors', () => {
    const center = new Vector(0, 0)
    const dist = NODE_SIZE * 8
    const n0 = new NewNode(center.copy().add(new Vector(-dist, dist / 2)));
    const n1 = new NewNode(center.copy().add(new Vector(-dist, 0)));
    const n2 = new NewNode(center.copy().add(new Vector(-dist, -dist / 2)));
    const n4 = new NewNode(center.copy().add(new Vector(dist, 0)));

    const nodes: NewNode[] = [n0, n1, n2, n4];
    const edges: NewEdge[] = [];

    complexConnect(nodes, edges, n0, n4)
    complexConnect(nodes, edges, n1, n4)
    complexConnect(nodes, edges, n2, n4)

    const turns = getTurns(n4)
    expect(turns.length).toBe(3)
})


it('angles between vector ', () => {
    const v1 = new Vector(1, 0).rotate(randInt(-180, 180))
    const v2 = new Vector(1, 0).rotate(randInt(-180, 180))
    const v3 = new Vector(1, 0).rotate(randInt(-180, 180))
    const v4 = new Vector(1, 0).rotate(randInt(-180, 180))
    const v5 = new Vector(1, 0).rotate(randInt(-180, 180))
    const v6 = new Vector(1, 0).rotate(randInt(-180, 180))

    centerVector([v1, v2, v3, v4, v5, v6])
})
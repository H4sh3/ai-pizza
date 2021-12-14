import { calculateCenter } from "../src/models/city";
import Vector from "../src/models/vector";

it('nodes and edges', () => {
    const v1 = new Vector(1, 1);
    const v2 = new Vector(1, -1);
    const v3 = new Vector(-1, 1);
    const v4 = new Vector(-1, -1);

    const center = calculateCenter([v1, v2, v3, v4])



});
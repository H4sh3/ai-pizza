import search from "../src/etc/astar";
import { segmentsMock } from "../src/modules/data";
import { loadData, Segment } from "../src/modules/models";
import { transformation } from "../src/modules/transformation";

it('transformation test', () => {
    const segments: Segment[] = loadData(segmentsMock)
    expect(segments.length === 50).toBeTruthy()

    const { nodes } = transformation(segments)

    const path = search(nodes, nodes[0], nodes[40])

    expect(path.length).toBe(14)

})
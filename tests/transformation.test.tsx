import { loadData, Segment } from '../src/modules/models'
import { segmentsMock } from '../src/modules/data'
import { Node, transformation } from '../src/modules/transformation';

it('transformation test', () => {
    const segments: Segment[] = loadData(segmentsMock)
    expect(segments.length === 35).toBeTruthy()

    const nodes: Node[] = transformation(segments)
    expect(nodes.length).toBe(35)

    expect(nodes.every(n => {
        return n.connections.left || n.connections.right || n.connections.bottom || n.connections.bottom
    }))
});
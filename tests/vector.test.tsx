import { Segment, Vector } from '../src/modules/models'
import { segmentsMock } from '../src/modules/data'

it('vector add', () => {
    const v1: Vector = new Vector(10, 0)
    const v2: Vector = new Vector(10, 0)
    v1.add(v2)

    expect(v1.x).toBe(20)
    expect(v1.y).toBe(0)
});
import { Segment, Vector } from '../src/modules/models'
import { segmentsMock } from '../src/modules/data'

it('vector add', () => {
    const v1: Vector = new Vector(10, 0)
    const v2: Vector = new Vector(10, 0)
    v1.add(v2)

    expect(v1.x).toBe(20)
    expect(v1.y).toBe(0)
});

it('vector sub', () => {
    const v1: Vector = new Vector(10, 0)
    const v2: Vector = new Vector(10, 10)
    v1.sub(v2)

    expect(v1.x).toBe(0)
    expect(v1.y).toBe(-10)
});

it('vector mult', () => {
    const v1: Vector = new Vector(5, 10)
    const scalar = 5
    v1.mult(scalar)

    expect(v1.x).toBe(25)
    expect(v1.y).toBe(50)
});

it('vector copy', () => {
    const v1: Vector = new Vector(5, 10)
    const v2: Vector = v1.copy()
    
    const scalar = 5
    v2.mult(scalar)

    expect(v1.x).toBe(5)
    expect(v1.y).toBe(10)

    expect(v2.x).toBe(25)
    expect(v2.y).toBe(50)
});
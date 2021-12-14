import Vector from "../src/models/vector";

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

it('vector division', () => {
    let v: Vector = new Vector(10, 10)
    const l1 = v.mag()

    v.div(2)
    const l2 = v.mag()
    expect(l1).toBe(l2 * 2)
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

it('vector rotate', () => {
    const v1: Vector = new Vector(10, 0)

    v1.rotate(90)
    expect(v1.x).toBeCloseTo(0)
    expect(v1.y).toBeCloseTo(10)


    v1.rotate(90)
    expect(v1.x).toBeCloseTo(-10)
    expect(v1.y).toBeCloseTo(0)

    v1.rotate(90)
    expect(v1.x).toBeCloseTo(0)
    expect(v1.y).toBeCloseTo(-10)

    v1.rotate(90)
    expect(v1.x).toBeCloseTo(10)
    expect(v1.y).toBeCloseTo(0)
});

it('vector normalize', () => {
    const v1: Vector = new Vector(10, 5)
    v1.normalize()
    expect(v1.mag()).toBeCloseTo(1)

    const v2: Vector = new Vector(-5, 20)
    v2.normalize()
    expect(v2.mag()).toBeCloseTo(1)
});


it('vector heading', () => {
    let v: Vector = new Vector(10, 0)
    expect(v.heading()).toBe(0)

    v = new Vector(0, -10)
    expect(v.heading()).toBe(-90)

    v = new Vector(-10, 0)
    expect(v.heading()).toBe(180)

    v = new Vector(0, 10)
    expect(v.heading()).toBe(90)
});


it('vector mag', () => {
    let v: Vector = new Vector(10, 10)
    expect(v.mag()).toBeCloseTo(14.14)

    v = new Vector(-10, 10)
    expect(v.mag()).toBeCloseTo(14.14)

    v = new Vector(10, -10)
    expect(v.mag()).toBeCloseTo(14.14)

    v = new Vector(-10, -10)
    expect(v.mag()).toBeCloseTo(14.14)
});


it('vector chain', () => {
    let v: Vector = new Vector(10, 10)
    v.mult(5).rotate(90).sub(new Vector(1, 2))

    expect(v.x).toBe(-51)
    expect(v.y).toBe(48)
});

it('heading etc', () => {
    let v: Vector = new Vector(0, 0)
    let v1: Vector = new Vector(5, 5)
    let v2: Vector = new Vector(-5, -5)

    expect(v1.copy().sub(v).heading()).toBeCloseTo(45)
    expect(v2.copy().sub(v).heading()).toBeCloseTo(-135)
});

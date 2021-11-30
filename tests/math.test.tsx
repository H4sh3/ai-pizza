import { map } from "../src/modules/math";

it('map value from one range to other range', () => {
    const v1 = 50 // between 0 and 100

    const v2 = map(v1, 0, 100, 0, 1000)
    expect(v2).toBe(500)
});

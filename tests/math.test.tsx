import { map } from "../src/modules/math";
import { randn_bm, randomGaussian } from "../src/thirdparty/nn";

it('map value from one range to other range', () => {
    const v1 = 50 // between 0 and 100

    const v2 = map(v1, 0, 100, 0, 1000)
    expect(v2).toBe(500)
});

it("should generate randomgaus", () => {
    let n = 0
    for (let i = 0; i < 100; i++) {
        n += randomGaussian() * 0.5
        n /= 2
    }
})
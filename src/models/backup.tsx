
export const spreadVectors = (vectors: Vector[]): Vector[] => {
    const centerV = new Vector(1, 0)
    vectors.sort((a, b) => a.heading() < b.heading() ? -1 : 0)
    const mh = vectors.reduce((acc, v) => acc + v.heading(), 0) / vectors.length
    centerV.rotate(mh)
    vectors.sort((a, b) => a.heading() < b.heading() ? -1 : 0)
    // console.log(vectors.map(v => v.heading()))
    // angle between neighbour

    const minAngle = 25
    let spread = minAngleBetweenVectors(vectors, minAngle)
    let max = 100
    while (!spread && max > 0) {
        max--
        for (let i = 1; i < Math.round(vectors.length / 2); i++) {
            const v1 = vectors[i]
            const v2 = vectors[i - 1]
            if (isAngleToSmall(v1, v2, minAngle)) {
                v1.rotate(-minAngle)
                v2.rotate(minAngle)
                break
            }
        }

        for (let i = vectors.length - 1; i >= Math.round(vectors.length / 2); i--) {
            const v1 = vectors[i]
            const v2 = vectors[i - 1]
            if (isAngleToSmall(v1, v2, minAngle)) {
                v1.rotate(minAngle)
                v2.rotate(-minAngle)
                break
            }
        }
        vectors.sort((a, b) => a.heading() < b.heading() ? -1 : 0)
        spread = minAngleBetweenVectors(vectors, minAngle)
    }
    return vectors
}

const minAngleBetweenVectors = (vectors: Vector[], minAngle: number) => {
    for (let i = 1; i < vectors.length; i++) {
        const v1 = vectors[i]
        const v2 = vectors[i - 1]
        if (isAngleToSmall(v1, v2, minAngle)) {
            return false
        }
    }
    return true
}

const isAngleToSmall = (v1: Vector, v2: Vector, minAngle: number) => {
    const d = v1.heading() - v2.heading()
    return Math.abs(d) < minAngle
}
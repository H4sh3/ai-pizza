
export function radToDeg(radians) {
    var pi = Math.PI;
    return radians * (180 / pi);
}

export function degToRad(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}

export function map(v, s1, e1, s2, e2) {
    return (v - s1) / (e1 - s1) * (e2 - s2) + s2;
}
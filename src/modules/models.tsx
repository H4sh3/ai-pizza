export interface Position {
    x: number,
    y: number
}

export interface SegmentJson {
    id: number,
    start: Position,
    end: Position,
    forward: number[],
    backward: number[]
}

export interface Segment {
    id: number,
    start: Position,
    end: Position,
    forward: Segment[],
    backward: Segment[]
}

export const loadData = (input: SegmentJson[]): Segment[] => {
    const segments = new Map<number, Segment>();
    input.forEach(s => {
        segments.set(s.id, {
            id: s.id,
            start: s.start,
            end: s.end,
            forward: [],
            backward: [],
        })
    })

    input.forEach(s => {
        const segment = segments.get(s.id)
        segment.forward = s.forward.map(f => segments.get(segments.get(f).id))
        segment.backward = s.backward.map(f => segments.get(segments.get(f).id))
    })

    let tmp: Segment[] = []
    segments.forEach((s, k) => {
        tmp.push(s)
    })

    let minX = 0
    let minY = 0

    tmp.forEach(s => {
        if (s.start.x < minX) {
            minX = s.start.x
        }
        if (s.end.x < minX) {
            minX = s.start.x
        }
        if (s.start.y < minY) {
            minY = s.start.y
        }
        if (s.end.y < minY) {
            minY = s.start.y
        }
    })

    minX = Math.abs(minX)
    minY = Math.abs(minY)

    tmp.forEach(s => {
        s.start.x += minX
        s.start.y += minY
        s.end.x += minX
        s.end.y += minY
    })

    const faktor = 0.3
    tmp.forEach(s => {
        s.start.x *= faktor
        s.start.y *= faktor
        s.end.x *= faktor
        s.end.y *= faktor
        s.start.x += 100
        s.start.y += 100
        s.end.x += 100
        s.end.y += 100

        s.start.x = Math.round(s.start.x)
        s.start.y = Math.round(s.start.y)
        s.end.x = Math.round(s.end.x)
        s.end.y = Math.round(s.end.y)
    })

    const deletedIds = []
    tmp.forEach(s => {
        if (s.start.x != s.end.x) {
            if (s.start.y != s.end.y) {
                deletedIds.push(s.id)
            }
        }
    })

    tmp = tmp.filter(s => !deletedIds.includes(s.id))
    tmp.forEach(s => {
        s.forward = s.forward.filter(id => !deletedIds.includes(id))
        s.backward = s.backward.filter(id => !deletedIds.includes(id))
    })


    return tmp
}
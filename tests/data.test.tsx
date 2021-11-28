import { loadData, Segment } from '../src/modules/models'
import { segmentsMock } from '../src/modules/data'

it('First test', () => {
    const x = loadData(segmentsMock)
    expect(x.length).toBe(50)
});

it('reach all with forward', () => {
    const x = loadData(segmentsMock)
    let elements = x.filter(y => y.id === 0)
    expect(elements[0].id === 0).toBeTruthy()
    expect(elements.length).toBe(1)

    let cnt = 0
    let checkedIds = []
    while (elements.length > 0) {
        const el = elements[0]
        checkedIds.push(el.id)
        el.forward.filter(e => !checkedIds.includes(e.id)).map(e => {
            elements.push(e)
        })
        el.backward.filter(e => !checkedIds.includes(e.id)).map(e => {
            elements.push(e)
        })
        elements = elements.filter(e => e.id !== el.id)
        cnt += 1
    }
    expect(cnt).toBe(35)
});

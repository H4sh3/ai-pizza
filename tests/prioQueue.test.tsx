import priorityQueue from "../src/etc/prioQueue"

it('transformation test', () => {
    const queue = priorityQueue()
    const a = "a"
    const b = "b"
    const c = "c"
    const d = "d"

    queue.insert(a,4)
    queue.insert(b,1)
    queue.insert(c,100)
    queue.insert(d,0.1)

    expect(queue.size()).toBe(4)
    expect(queue.pop()).toBe(c)
    expect(queue.pop()).toBe(a)
    expect(queue.pop()).toBe(b)
    expect(queue.pop()).toBe(d)
})
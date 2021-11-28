import priorityQueue from "../src/etc/prioQueue"

it('transformation test', () => {
    const queue = priorityQueue()
    const a = "a"
    const b = "b"
    const c = "c"
    const d = "d"

    queue.put(a,4)
    queue.put(b,1)
    queue.put(c,100)
    queue.put(d,0.1)

    expect(queue.size()).toBe(4)
    expect(queue.pop()).toBe(c)
    expect(queue.pop()).toBe(a)
    expect(queue.pop()).toBe(b)
    expect(queue.pop()).toBe(d)
})
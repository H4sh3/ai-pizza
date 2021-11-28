function priorityQueue<T>() {
    let data: [number, T][] = []

    return {

        put: (i: T, p: number) => {
            data.push([p, i])
            data = data.sort((a, b) => a[0] < b[0] ? 1 : -1)
        },

        isEmpty: () => data.length == 0,

        peek: () => data.length == 0 ? null : data[0][1],

        pop: () => data.length == 0 ? null : data.pop()[1],

        size: () => data.length
    }
}

export default priorityQueue
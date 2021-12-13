import generateTrainings, { generateRandomTrainingsMap } from "../src/modules/maps/trainingsGeneration";
import deser from "../src/modules/maps/scquareCity"
import { getAllRoutesDict } from "../src/modules/etc";
import { Node } from "../src/modules/models";


it('should generate trainings map', () => {
    const n = 25
    const m = generateTrainings(n)
    expect(m.nodes.length).toBe(n)
});

it('should generate a random trainings map', () => {
    const n = 50
    const m = generateRandomTrainingsMap(n)
    expect(m.nodes.length).toBe(n)
});

it('should give us all long routes with a certain start node', () => {
    const { edges, nodes } = deser;
    const allRoutes = getAllRoutesDict(nodes)

    expect(allRoutes.length).toBe(16)

    let allLongRoutes: Node[][] = []
    for (let i = 0; i < 10; i++) {
        allLongRoutes = [...allLongRoutes, ...allRoutes[i].routes]
    }
});
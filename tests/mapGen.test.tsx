import generateTrainings, { generateRandomTrainingsMap } from "../src/modules/maps/trainingsGeneration";

it('should generate trainings map', () => {
    const n = 25
    const m = generateTrainings(n)
    expect(m.length).toBe(n)
});

it('should generate a random trainings map', () => {
    const n = 50
    const m = generateRandomTrainingsMap(n)
    expect(m.length).toBe(n)
});
import { deserialize } from "../../components/MapEditor"

const nodes = [
    {
        "id": 0, "x": 370, "y": 41.111111111111114, "connections": {
            "left": 11,
            "right": 28,
            "top": -1,
            "bottom": 12,
        }
    }, {
        "id": 1, "x": 41.111111111111114, "y": 41.111111111111114, "connections": {
            "left": -1,
            "right": 8,
            "top": -1,
            "bottom": 7,
        }
    }, {
        "id": 2, "x": 698.8888888888889, "y": 41.111111111111114, "connections": {
            "left": 31,
            "right": -1,
            "top": -1,
            "bottom": 32,
        }
    }, {
        "id": 3, "x": 698.8888888888889, "y": 698.8888888888889, "connections": {
            "left": 80,
            "right": -1,
            "top": 79,
            "bottom": -1,
        }
    }, {
        "id": 4, "x": 41.111111111111114, "y": 698.8888888888889, "connections": {
            "left": -1,
            "right": 59,
            "top": 60,
            "bottom": -1,
        }
    }, {
        "id": 5, "x": 41.111111111111114, "y": 370, "connections": {
            "left": -1,
            "right": 3,
            "top": 4,
            "bottom": 63,
        }
    }, {
        "id": 6, "x": 370, "y": 370, "connections": {
            "left": 0,
            "right": 39,
            "top": 15,
            "bottom": 52,
        }
    }, {
        "id": 7, "x": 698.8888888888889, "y": 370, "connections": {
            "left": 36,
            "right": -1,
            "top": 35,
            "bottom": 76,
        }
    }, {
        "id": 8, "x": 370, "y": 698.8888888888889, "connections": {
            "left": 56,
            "right": 83,
            "top": 55,
            "bottom": -1,
        }
    }, {
        "id": 9, "x": 370, "y": 287.7777777777778, "connections": {
            "left": -1,
            "right": -1,
            "top": 14,
            "bottom": 15,
        }
    }, {
        "id": 10, "x": 370, "y": 205.55555555555557, "connections": {
            "left": -1,
            "right": -1,
            "top": 13,
            "bottom": 14,
        }
    }, {
        "id": 11, "x": 370, "y": 123.33333333333334, "connections": {
            "left": -1,
            "right": -1,
            "top": 12,
            "bottom": 13,
        }
    }, {
        "id": 12, "x": 287.7777777777778, "y": 370, "connections": {
            "left": 1,
            "right": 0,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 13, "x": 205.55555555555557, "y": 370, "connections": {
            "left": 2,
            "right": 1,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 14, "x": 123.33333333333334, "y": 370, "connections": {
            "left": 3,
            "right": 2,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 15, "x": 41.111111111111114, "y": 287.7777777777778, "connections": {
            "left": -1,
            "right": 16,
            "top": 5,
            "bottom": 4,
        }
    }, {
        "id": 16, "x": 41.111111111111114, "y": 205.55555555555557, "connections": {
            "left": -1,
            "right": 22,
            "top": 6,
            "bottom": 5,
        }
    }, {
        "id": 17, "x": 41.111111111111114, "y": 123.33333333333334, "connections": {
            "left": -1,
            "right": 26,
            "top": 7,
            "bottom": 6,
        }
    }, {
        "id": 18, "x": 123.33333333333334, "y": 41.111111111111114, "connections": {
            "left": 8,
            "right": 9,
            "top": -1,
            "bottom": 27,
        }
    }, {
        "id": 19, "x": 205.55555555555557, "y": 41.111111111111114, "connections": {
            "left": 9,
            "right": 10,
            "top": -1,
            "bottom": 25,
        }
    }, {
        "id": 20, "x": 287.7777777777778, "y": 41.111111111111114, "connections": {
            "left": 10,
            "right": 11,
            "top": -1,
            "bottom": 21,
        }
    }, {
        "id": 21, "x": 287.7777777777778, "y": 123.33333333333334, "connections": {
            "left": -1,
            "right": -1,
            "top": 21,
            "bottom": 20,
        }
    }, {
        "id": 22, "x": 205.55555555555557, "y": 123.33333333333334, "connections": {
            "left": -1,
            "right": -1,
            "top": 25,
            "bottom": 24,
        }
    }, {
        "id": 23, "x": 123.33333333333334, "y": 123.33333333333334, "connections": {
            "left": 26,
            "right": -1,
            "top": 27,
            "bottom": -1,
        }
    }, {
        "id": 24, "x": 123.33333333333334, "y": 205.55555555555557, "connections": {
            "left": 22,
            "right": 23,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 25, "x": 205.55555555555557, "y": 205.55555555555557, "connections": {
            "left": 23,
            "right": -1,
            "top": 24,
            "bottom": -1,
        }
    }, {
        "id": 26, "x": 287.7777777777778, "y": 205.55555555555557, "connections": {
            "left": -1,
            "right": -1,
            "top": 20,
            "bottom": 19,
        }
    }, {
        "id": 27, "x": 287.7777777777778, "y": 287.7777777777778, "connections": {
            "left": 18,
            "right": -1,
            "top": 19,
            "bottom": -1,
        }
    }, {
        "id": 28, "x": 205.55555555555557, "y": 287.7777777777778, "connections": {
            "left": 17,
            "right": 18,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 29, "x": 123.33333333333334, "y": 287.7777777777778, "connections": {
            "left": 16,
            "right": 17,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 30, "x": 452.2222222222223, "y": 41.111111111111114, "connections": {
            "left": 28,
            "right": 29,
            "top": -1,
            "bottom": 40,
        }
    }, {
        "id": 31, "x": 534.4444444444445, "y": 41.111111111111114, "connections": {
            "left": 29,
            "right": 30,
            "top": -1,
            "bottom": 49,
        }
    }, {
        "id": 32, "x": 616.6666666666667, "y": 41.111111111111114, "connections": {
            "left": 30,
            "right": 31,
            "top": -1,
            "bottom": 50,
        }
    }, {
        "id": 33, "x": 698.8888888888889, "y": 123.33333333333334, "connections": {
            "left": 51,
            "right": -1,
            "top": 32,
            "bottom": 33,
        }
    }, {
        "id": 34, "x": 698.8888888888889, "y": 205.55555555555557, "connections": {
            "left": 46,
            "right": -1,
            "top": 33,
            "bottom": 34,
        }
    }, {
        "id": 35, "x": 698.8888888888889, "y": 287.7777777777778, "connections": {
            "left": 45,
            "right": -1,
            "top": 34,
            "bottom": 35,
        }
    }, {
        "id": 36, "x": 616.6666666666667, "y": 370, "connections": {
            "left": 37,
            "right": 36,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 37, "x": 534.4444444444445, "y": 370, "connections": {
            "left": 38,
            "right": 37,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 38, "x": 452.2222222222223, "y": 370, "connections": {
            "left": 39,
            "right": 38,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 39, "x": 452.2222222222223, "y": 287.7777777777778, "connections": {
            "left": -1,
            "right": 43,
            "top": 42,
            "bottom": -1,
        }
    }, {
        "id": 40, "x": 452.2222222222223, "y": 205.55555555555557, "connections": {
            "left": -1,
            "right": -1,
            "top": 41,
            "bottom": 42,
        }
    }, {
        "id": 41, "x": 452.2222222222223, "y": 123.33333333333334, "connections": {
            "left": -1,
            "right": -1,
            "top": 40,
            "bottom": 41,
        }
    }, {
        "id": 42, "x": 534.4444444444445, "y": 123.33333333333334, "connections": {
            "left": -1,
            "right": -1,
            "top": 49,
            "bottom": 48,
        }
    }, {
        "id": 43, "x": 616.6666666666667, "y": 123.33333333333334, "connections": {
            "left": -1,
            "right": 51,
            "top": 50,
            "bottom": -1,
        }
    }, {
        "id": 44, "x": 616.6666666666667, "y": 205.55555555555557, "connections": {
            "left": 47,
            "right": 46,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 45, "x": 616.6666666666667, "y": 287.7777777777778, "connections": {
            "left": 44,
            "right": 45,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 46, "x": 534.4444444444445, "y": 287.7777777777778, "connections": {
            "left": 43,
            "right": 44,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 47, "x": 534.4444444444445, "y": 205.55555555555557, "connections": {
            "left": -1,
            "right": 47,
            "top": 48,
            "bottom": -1,
        }
    }, {
        "id": 48, "x": 41.111111111111114, "y": 452.2222222222223, "connections": {
            "left": -1,
            "right": 64,
            "top": 63,
            "bottom": 62,
        }
    }, {
        "id": 49, "x": 41.111111111111114, "y": 534.4444444444445, "connections": {
            "left": -1,
            "right": 73,
            "top": 62,
            "bottom": 61,
        }
    }, {
        "id": 50, "x": 41.111111111111114, "y": 616.6666666666667, "connections": {
            "left": -1,
            "right": 75,
            "top": 61,
            "bottom": 60,
        }
    }, {
        "id": 51, "x": 123.33333333333334, "y": 698.8888888888889, "connections": {
            "left": 59,
            "right": 58,
            "top": 74,
            "bottom": -1,
        }
    }, {
        "id": 52, "x": 205.55555555555557, "y": 698.8888888888889, "connections": {
            "left": 58,
            "right": 57,
            "top": 70,
            "bottom": -1,
        }
    }, {
        "id": 53, "x": 287.7777777777778, "y": 698.8888888888889, "connections": {
            "left": 57,
            "right": 56,
            "top": 69,
            "bottom": -1,
        }
    }, {
        "id": 54, "x": 370, "y": 616.6666666666667, "connections": {
            "left": -1,
            "right": -1,
            "top": 54,
            "bottom": 55,
        }
    }, {
        "id": 55, "x": 370, "y": 534.4444444444445, "connections": {
            "left": -1,
            "right": -1,
            "top": 53,
            "bottom": 54,
        }
    }, {
        "id": 56, "x": 370, "y": 452.2222222222223, "connections": {
            "left": -1,
            "right": -1,
            "top": 52,
            "bottom": 53,
        }
    }, {
        "id": 57, "x": 123.33333333333334, "y": 452.2222222222223, "connections": {
            "left": 64,
            "right": 65,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 58, "x": 205.55555555555557, "y": 452.2222222222223, "connections": {
            "left": 65,
            "right": 66,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 59, "x": 287.7777777777778, "y": 452.2222222222223, "connections": {
            "left": 66,
            "right": -1,
            "top": -1,
            "bottom": 67,
        }
    }, {
        "id": 60, "x": 287.7777777777778, "y": 534.4444444444445, "connections": {
            "left": -1,
            "right": -1,
            "top": 67,
            "bottom": 68,
        }
    }, {
        "id": 61, "x": 287.7777777777778, "y": 616.6666666666667, "connections": {
            "left": -1,
            "right": -1,
            "top": 68,
            "bottom": 69,
        }
    }, {
        "id": 62, "x": 205.55555555555557, "y": 616.6666666666667, "connections": {
            "left": -1,
            "right": -1,
            "top": 71,
            "bottom": 70,
        }
    }, {
        "id": 63, "x": 123.33333333333334, "y": 616.6666666666667, "connections": {
            "left": 75,
            "right": -1,
            "top": -1,
            "bottom": 74,
        }
    }, {
        "id": 64, "x": 123.33333333333334, "y": 534.4444444444445, "connections": {
            "left": 73,
            "right": 72,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 65, "x": 205.55555555555557, "y": 534.4444444444445, "connections": {
            "left": 72,
            "right": -1,
            "top": -1,
            "bottom": 71,
        }
    }, {
        "id": 66, "x": 698.8888888888889, "y": 616.6666666666667, "connections": {
            "left": 95,
            "right": -1,
            "top": 78,
            "bottom": 79,
        }
    }, {
        "id": 67, "x": 698.8888888888889, "y": 534.4444444444445, "connections": {
            "left": 90,
            "right": -1,
            "top": 77,
            "bottom": 78,
        }
    }, {
        "id": 68, "x": 698.8888888888889, "y": 452.2222222222223, "connections": {
            "left": 89,
            "right": -1,
            "top": 76,
            "bottom": 77,
        }
    }, {
        "id": 69, "x": 616.6666666666667, "y": 698.8888888888889, "connections": {
            "left": 81,
            "right": 80,
            "top": 94,
            "bottom": -1,
        }
    }, {
        "id": 70, "x": 534.4444444444445, "y": 698.8888888888889, "connections": {
            "left": 82,
            "right": 81,
            "top": 93,
            "bottom": -1,
        }
    }, {
        "id": 71, "x": 452.2222222222223, "y": 698.8888888888889, "connections": {
            "left": 83,
            "right": 82,
            "top": 84,
            "bottom": -1,
        }
    }, {
        "id": 72, "x": 452.2222222222223, "y": 616.6666666666667, "connections": {
            "left": -1,
            "right": -1,
            "top": 85,
            "bottom": 84,
        }
    }, {
        "id": 73, "x": 534.4444444444445, "y": 616.6666666666667, "connections": {
            "left": -1,
            "right": -1,
            "top": 92,
            "bottom": 93,
        }
    }, {
        "id": 74, "x": 616.6666666666667, "y": 616.6666666666667, "connections": {
            "left": -1,
            "right": 95,
            "top": -1,
            "bottom": 94,
        }
    }, {
        "id": 75, "x": 616.6666666666667, "y": 534.4444444444445, "connections": {
            "left": 91,
            "right": 90,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 76, "x": 534.4444444444445, "y": 534.4444444444445, "connections": {
            "left": -1,
            "right": 91,
            "top": -1,
            "bottom": 92,
        }
    }, {
        "id": 77, "x": 452.2222222222223, "y": 534.4444444444445, "connections": {
            "left": -1,
            "right": -1,
            "top": 86,
            "bottom": 85,
        }
    }, {
        "id": 78, "x": 452.2222222222223, "y": 452.2222222222223, "connections": {
            "left": -1,
            "right": 87,
            "top": -1,
            "bottom": 86,
        }
    }, {
        "id": 79, "x": 534.4444444444445, "y": 452.2222222222223, "connections": {
            "left": 87,
            "right": 88,
            "top": -1,
            "bottom": -1,
        }
    }, {
        "id": 80, "x": 616.6666666666667, "y": 452.2222222222223, "connections": {
            "left": 88,
            "right": 89,
            "top": -1,
            "bottom": -1,
        }
    },
]
const edges = [
    { "id": 0, "start": 6, "end": 12 }, { "id": 1, "start": 13, "end": 12 }, { "id": 2, "start": 13, "end": 14 }, { "id": 3, "start": 14, "end": 5 }, { "id": 4, "start": 5, "end": 15 }, { "id": 5, "start": 15, "end": 16 }, { "id": 6, "start": 16, "end": 17 }, { "id": 7, "start": 17, "end": 1 }, { "id": 8, "start": 1, "end": 18 }, { "id": 9, "start": 18, "end": 19 }, { "id": 10, "start": 19, "end": 20 }, { "id": 11, "start": 20, "end": 0 }, { "id": 12, "start": 0, "end": 11 }, { "id": 13, "start": 11, "end": 10 }, { "id": 14, "start": 10, "end": 9 }, { "id": 15, "start": 9, "end": 6 }, { "id": 16, "start": 15, "end": 29 }, { "id": 17, "start": 29, "end": 28 }, { "id": 18, "start": 28, "end": 27 }, { "id": 19, "start": 27, "end": 26 }, { "id": 20, "start": 26, "end": 21 }, { "id": 21, "start": 21, "end": 20 }, { "id": 22, "start": 16, "end": 24 }, { "id": 23, "start": 24, "end": 25 }, { "id": 24, "start": 25, "end": 22 }, { "id": 25, "start": 22, "end": 19 }, { "id": 26, "start": 17, "end": 23 }, { "id": 27, "start": 23, "end": 18 }, { "id": 28, "start": 0, "end": 30 }, { "id": 29, "start": 30, "end": 31 }, { "id": 30, "start": 31, "end": 32 }, { "id": 31, "start": 32, "end": 2 }, { "id": 32, "start": 2, "end": 33 }, { "id": 33, "start": 33, "end": 34 }, { "id": 34, "start": 34, "end": 35 }, { "id": 35, "start": 35, "end": 7 }, { "id": 36, "start": 7, "end": 36 }, { "id": 37, "start": 36, "end": 37 }, { "id": 38, "start": 37, "end": 38 }, { "id": 39, "start": 38, "end": 6 }, { "id": 40, "start": 30, "end": 41 }, { "id": 41, "start": 41, "end": 40 }, { "id": 42, "start": 40, "end": 39 }, { "id": 43, "start": 39, "end": 46 }, { "id": 44, "start": 46, "end": 45 }, { "id": 45, "start": 45, "end": 35 }, { "id": 46, "start": 34, "end": 44 }, { "id": 47, "start": 44, "end": 47 }, { "id": 48, "start": 47, "end": 42 }, { "id": 49, "start": 42, "end": 31 }, { "id": 50, "start": 32, "end": 43 }, { "id": 51, "start": 43, "end": 33 }, { "id": 52, "start": 6, "end": 56 }, { "id": 53, "start": 56, "end": 55 }, { "id": 54, "start": 55, "end": 54 }, { "id": 55, "start": 54, "end": 8 }, { "id": 56, "start": 8, "end": 53 }, { "id": 57, "start": 53, "end": 52 }, { "id": 58, "start": 52, "end": 51 }, { "id": 59, "start": 51, "end": 4 }, { "id": 60, "start": 4, "end": 50 }, { "id": 61, "start": 50, "end": 49 }, { "id": 62, "start": 49, "end": 48 }, { "id": 63, "start": 48, "end": 5 }, { "id": 64, "start": 48, "end": 57 }, { "id": 65, "start": 57, "end": 58 }, { "id": 66, "start": 58, "end": 59 }, { "id": 67, "start": 59, "end": 60 }, { "id": 68, "start": 60, "end": 61 }, { "id": 69, "start": 61, "end": 53 }, { "id": 70, "start": 52, "end": 62 }, { "id": 71, "start": 62, "end": 65 }, { "id": 72, "start": 65, "end": 64 }, { "id": 73, "start": 64, "end": 49 }, { "id": 74, "start": 51, "end": 63 }, { "id": 75, "start": 63, "end": 50 }, { "id": 76, "start": 7, "end": 68 }, { "id": 77, "start": 68, "end": 67 }, { "id": 78, "start": 67, "end": 66 }, { "id": 79, "start": 66, "end": 3 }, { "id": 80, "start": 3, "end": 69 }, { "id": 81, "start": 69, "end": 70 }, { "id": 82, "start": 70, "end": 71 }, { "id": 83, "start": 8, "end": 71 }, { "id": 84, "start": 71, "end": 72 }, { "id": 85, "start": 72, "end": 77 }, { "id": 86, "start": 77, "end": 78 }, { "id": 87, "start": 78, "end": 79 }, { "id": 88, "start": 79, "end": 80 }, { "id": 89, "start": 80, "end": 68 }, { "id": 90, "start": 67, "end": 75 }, { "id": 91, "start": 75, "end": 76 }, { "id": 92, "start": 76, "end": 73 }, { "id": 93, "start": 73, "end": 70 }, { "id": 94, "start": 69, "end": 74 }, { "id": 95, "start": 74, "end": 66 },
]

const deser = deserialize(nodes, edges)

export default deser
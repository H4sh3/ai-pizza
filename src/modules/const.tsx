export const NODE_SIZE = 20

// export const WIDTH = 1600
// export const HEIGHT = 900
export const HEIGHT = window.innerHeight * 0.75
export const WIDTH = HEIGHT
export const scaleFactor = (HEIGHT / 800) / 4

export const SCORE_WIDTH = 240
export const SCORE_HEIGHT = 80

export const allowedNeighbours = 10
export const nodeSelectionRange = NODE_SIZE * 2;
export const GAME_DURATION = 60 * 30

export const LAYER_CONFIG = {
    input: 18,
    hidden: 10,
    output: 2
}
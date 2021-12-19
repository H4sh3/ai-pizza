import { useEffect, useRef, useState } from "react"
import { HEIGHT, nodeSelectionRange, NODE_SIZE, WIDTH } from "../modules/const"
import { Edge, Node, Vector } from "../modules/models"
import { renderLines, renderNodes } from "../modules/render"
import { addEdge } from "../modules/maps/trainingsEnv"
import Agent from "../modules/agent"

const state = {
    nodes: [] as Node[],
    edges: [] as Edge[],
    nodeMode: true,
    gridCursor: {
        x: 0,
        y: 0,
    },
    res: NODE_SIZE,
    selectedNode: undefined,
    grid: []
}

const dotsX = Math.floor(WIDTH / (NODE_SIZE * 2))
const dotsY = Math.floor(HEIGHT / (NODE_SIZE * 2))
for (let x = 1; x < dotsX; x++) {
    for (let y = 1; y < dotsY; y++) {
        state.grid.push({ x: x * (WIDTH / dotsX), y: y * (HEIGHT / dotsY) })
    }
}

const borderGrayAndP = "border-2 border-gray-300 p-2"
const MapEditor: React.FC = () => {
    const [renderUi, setRenderUi] = useState(0)

    const props = {
        width: WIDTH,
        height: HEIGHT
    }

    const RERENDER = () => {
        setRenderUi(renderUi + 1)
    }

    const canvasRef = useRef(null)

    const onmousemove = (e) => {
        state.gridCursor.x = Math.round(e.clientX / (WIDTH / dotsX)) * (WIDTH / dotsX)
        state.gridCursor.y = Math.round(e.clientY / (HEIGHT / dotsY)) * (HEIGHT / dotsY)
    }

    const onmousedown = () => {
        if (state.nodeMode) {
            state.nodes.push(new Node(state.nodes.length, state.gridCursor.x, state.gridCursor.y))
        } else {
            const node = getNodeAtCursor()
            if (state.selectedNode === undefined) {
                state.selectedNode = node
            } else {
                const e = addEdge(state.selectedNode, node)
                state.edges.push(e)
                state.edges.map((e, i) => e.id = i)
                state.selectedNode = undefined
            }
        }
    }


    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        let lastTime
        let frameId
        const frame = time => {
            const timeDelta = time - lastTime
            frameId = requestAnimationFrame(frame)
            if (timeDelta < 1000 / 30) return
            context.fillStyle = "rgba(160, 160, 160,10)";
            context.fillRect(0, 0, WIDTH, HEIGHT)

            lastTime = time

            // grid cursor 
            context.beginPath();
            context.arc(state.gridCursor.x, state.gridCursor.y, 5, 0, 2 * Math.PI);
            context.stroke();
            context.fill();
            context.closePath()

            drawGrid(context)

            const highlightedNode: Node = getNodeAtCursor()
            renderNodes(state.nodes, context, "rgba(0,200,0,0.4)", highlightedNode)

            const usedIds = []
            const lines = state.nodes.reduce((acc, n) => { return [...acc, ...n.getLines(usedIds)] }, [])
            renderLines(lines, context, "#000000")
        }

        requestAnimationFrame(frame)
        return () => cancelAnimationFrame(frameId)
    }, [])



    return <div className="flex flex-row gap-2 select-none p-2">
        <div onMouseMove={onmousemove}
            onMouseDown={onmousedown}
        >
            <canvas ref={canvasRef} {...props} />
        </div>
        <div className="flex flex-col items-center gap-2">
            <Button
                onClick={
                    () => {
                        state.nodeMode = !state.nodeMode
                        RERENDER()
                    }
                }>
                {state.nodeMode ? "Node mode on" : "Edge mode on"}
            </Button>
            <Button
                onClick={
                    () => {
                        state.nodes.pop()
                        RERENDER()
                    }
                }>
                Delete last node
            </Button>
            <Button
                onClick={
                    () => {
                        serialize()
                    }
                }>
                Serialize!
            </Button>

        </div>
    </div >
}

const getEdgeIds = (node: Node) => {
    const left = node.connections.left === undefined ? -1 : node.connections.left.id
    const right = node.connections.right === undefined ? -1 : node.connections.right.id
    const top = node.connections.top === undefined ? -1 : node.connections.top.id
    const bottom = node.connections.bottom === undefined ? -1 : node.connections.bottom.id

    return `{
        "left":${left},
        "right":${right},
        "top":${top},
        "bottom":${bottom},
    }`
}

const getNodeAtCursor = () => {
    return state.nodes.find(n => n.pos.copy().add(new Vector(NODE_SIZE / 2, NODE_SIZE / 2)).dist(new Vector(state.gridCursor.x, state.gridCursor.y)) < nodeSelectionRange)
}

const drawGrid = (context) => {
    state.grid.forEach(point => {
        context.beginPath()
        context.strokeStyle = "#000000"
        context.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        context.stroke();
        context.fill();
        context.closePath()
    })
}





interface ButtonProps {
    onClick: () => void
    disabled?: boolean
}

const Button: React.FC<ButtonProps> = ({ onClick, children, disabled = false }) => {
    return <div className={`${disabled ? "cursor-not-allowed bg-gray-200" : "cursor-pointer hover:bg-green-300 border-green-500"} text-center px-2 py-1 select-none bg-white rounded-lg border-2  `}
        onClick={() => {
            if (disabled) return
            onClick()
        }}>
        {children}
    </div>
}

export default MapEditor;
import { useEffect, useRef, useState } from "react"
import { HEIGHT, nodeSelectionRange, NODE_SIZE, WIDTH } from "../modules/const"
import { renderIntersections, renderLines, renderNodes, renderPoint, renderTurns } from "../modules/render"
import { complexConnect, NewEdge, NewNode } from "../models/graph"
import Vector from "../models/vector"
import { City } from "../models/city"

const state = {
    nodes: [] as NewNode[],
    edges: [] as NewEdge[],
    nodeMode: false,
    gridCursor: {
        x: 0,
        y: 0,
    },
    mouseCursor: {
        x: 0,
        y: 0,
    },
    res: NODE_SIZE,
    selectedNode: undefined,
    grid: [],
    intersections: [],
    city: new City(),
    vectors: []
}

const dotsX = Math.floor(WIDTH / (NODE_SIZE * 2))
const dotsY = Math.floor(HEIGHT / (NODE_SIZE * 2))
for (let x = 1; x < dotsX; x++) {
    for (let y = 1; y < dotsY; y++) {
        state.grid.push({ x: x * (WIDTH / dotsX), y: y * (HEIGHT / dotsY) })
    }
}

const center = new Vector(WIDTH / 2, HEIGHT / 2);

const step = NODE_SIZE * 3
const n1 = new NewNode(center.copy().add(new Vector(0, 0)));
state.nodes.push(n1)

const radius = 6
const nodes = 13
const stepSize = 360 / nodes

let prev = new NewNode(center.copy().add(new Vector(step * radius, 0).rotate(0 * stepSize)));
state.nodes.push(prev)
complexConnect(state.nodes, state.edges, prev, n1)

for (let i = 1; i < nodes; i++) {
    const newNode = new NewNode(center.copy().add(new Vector(step * radius, 0).rotate(i * stepSize)));
    state.nodes.push(newNode)
    complexConnect(state.nodes, state.edges, newNode, n1)
    complexConnect(state.nodes, state.edges, prev, newNode)
    prev = newNode
}

complexConnect(state.nodes, state.edges, state.nodes[1], state.nodes[state.nodes.length - 1])


const nodeCnt = {}
state.nodes.forEach(n1 => {
    state.nodes.forEach(n2 => {
        // console.log("conect!")
        if (nodeCnt[n2.id] == undefined || nodeCnt[n2.id] < 2) {
            // complexConnect(state.nodes, state.edges, n1, n2)
            if (n1.id in nodeCnt) {
                nodeCnt[n1.id] = 1
            } else {
                nodeCnt[n1.id] += 1
            }
            if (n2.id in nodeCnt) {
                nodeCnt[n2.id] = 1
            } else {
                nodeCnt[n2.id] += 1
            }
        }
    })
})

state.nodes.forEach((n, i) => {
    // console.log(i)
    state.city.addIntersection(n)
})
state.city.addRoads()

const GraphEditor: React.FC = () => {
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
        state.gridCursor.x = Math.round((e.clientX) / (WIDTH / dotsX)) * (WIDTH / dotsX)
        state.gridCursor.y = Math.round((e.clientY) / (HEIGHT / dotsY)) * (HEIGHT / dotsY)
        state.mouseCursor.x = e.clientX
        state.mouseCursor.y = e.clientY
    }

    const onmousedown = () => {
        if (state.nodeMode) {
            state.nodes.push(new NewNode(new Vector(state.mouseCursor.x, state.mouseCursor.y)))
        } else {
            const node = getNodeAtCursor()
            if (node === undefined) return
            if (state.selectedNode === undefined) {
                state.selectedNode = node
            } else {
                state.edges = complexConnect(state.nodes, state.edges, state.selectedNode, node)
                state.city = new City()
                state.nodes.forEach(n => {
                    if (n.edges.length > 0) {
                        state.city.addIntersection(n)
                    }
                })
                state.city.addRoads()
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
            lastTime = time
            background(context)

            renderNodes(state.nodes, context, "#BBBBBB", getNodeAtCursor())
            renderIntersections(state.city.intersections, context, "#BBBBBB", getNodeAtCursor())

            state.city.intersections.forEach(intersection => {
                renderLines(intersection.borders, context, "#0000FF")
            })

            renderLines(state.city.roads.reduce((acc, r) => {
                acc.push(r.line1)
                acc.push(r.line2)
                return acc
            }, []), context, "#0000FF")

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
        </div>
    </div >
}

const getNodeAtCursor = () => {
    return state.nodes.find(n => n.pos.copy().dist(new Vector(state.mouseCursor.x, state.mouseCursor.y)) < nodeSelectionRange)
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

const background = (context) => {
    context.fillStyle = "rgba(160, 160, 160,10)";
    context.fillRect(0, 0, WIDTH, HEIGHT)
}

export default GraphEditor;
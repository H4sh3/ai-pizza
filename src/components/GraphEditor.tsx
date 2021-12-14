import { useEffect, useRef, useState } from "react"
import { HEIGHT, nodeSelectionRange, NODE_SIZE, WIDTH } from "../modules/const"
import { renderLines, renderNodes, renderPoint } from "../modules/render"
import { complexConnect, connectNodes, NewEdge, NewNode } from "../models/graph"
import Vector from "../models/vector"
import { randInt } from "../etc/math"
import { Intersection } from "../models/city"

const state = {
    nodes: [] as NewNode[],
    edges: [] as NewEdge[],
    nodeMode: false,
    gridCursor: {
        x: 0,
        y: 0,
    },
    res: NODE_SIZE,
    selectedNode: undefined,
    grid: [],
    intersections: []
}

const dotsX = Math.floor(WIDTH / (NODE_SIZE * 2))
const dotsY = Math.floor(HEIGHT / (NODE_SIZE * 2))
for (let x = 1; x < dotsX; x++) {
    for (let y = 1; y < dotsY; y++) {
        state.grid.push({ x: x * (WIDTH / dotsX), y: y * (HEIGHT / dotsY) })
    }
}

const center = new Vector(WIDTH / 2, HEIGHT / 2);

const dist = NODE_SIZE * 8

const n0 = new NewNode(center.copy().add(new Vector(-dist, -dist)));
const n5 = new NewNode(center.copy().add(new Vector(-dist * 1.5, -dist * 1.5)));

const n1 = new NewNode(center.copy().add(new Vector(dist, -dist)));
const n4 = new NewNode(center.copy().add(new Vector(dist * 1.5, -dist * 1.5)));

const n2 = new NewNode(center.copy().add(new Vector(0, 0)));
const n3 = new NewNode(center.copy().add(new Vector(0, dist)));
const n6 = new NewNode(center.copy().add(new Vector(0, -dist * 3)));


state.nodes.push(n0)
state.nodes.push(n1)
state.nodes.push(n2)
state.nodes.push(n3)
state.nodes.push(n4)
state.nodes.push(n5)
state.nodes.push(n6)


connectNodes(state.nodes, state.edges, n5, n6)
connectNodes(state.nodes, state.edges, n4, n6)

connectNodes(state.nodes, state.edges, n0, n2)
connectNodes(state.nodes, state.edges, n0, n5)

connectNodes(state.nodes, state.edges, n1, n2)
connectNodes(state.nodes, state.edges, n1, n4)

connectNodes(state.nodes, state.edges, n2, n3)
connectNodes(state.nodes, state.edges, n5, n4)

console.log("0")
state.intersections.push(new Intersection(n0))
console.log("1")
state.intersections.push(new Intersection(n1))
console.log("2")
state.intersections.push(new Intersection(n2))
console.log("3")
state.intersections.push(new Intersection(n3))
console.log("4")
state.intersections.push(new Intersection(n4))
console.log("5")
state.intersections.push(new Intersection(n5))
console.log("6")
state.intersections.push(new Intersection(n6))

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
    }

    const onmousedown = () => {
        if (state.nodeMode) {
            state.nodes.push(new NewNode(new Vector(state.gridCursor.x, state.gridCursor.y)))
        } else {
            const node = getNodeAtCursor()
            if (node === undefined) return
            if (state.selectedNode === undefined) {
                state.selectedNode = node
            } else {
                state.edges = complexConnect(state.nodes, state.edges, node, state.selectedNode)
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

            context.fillStyle = "rgba(250, 250, 0,10)";
            context.fillRect(state.gridCursor.x, state.gridCursor.y, 3, 3)

            lastTime = time

            // grid cursor 
            context.beginPath();
            context.arc(state.gridCursor.x, state.gridCursor.y, 5, 0, 2 * Math.PI);
            context.stroke();
            context.fill();
            context.closePath()

            drawGrid(context)

            const highlightedNode: NewNode = getNodeAtCursor()

            //const lines = state.edges.map(e => getLine(e))
            state.intersections.forEach(intersection => {
                intersection.directions.forEach(d => {
                    renderPoint(intersection.node.pos.copy().sub(d.pos), context, "#FFFFFF")
                })
            })

            state.intersections.forEach(intersection => {
                Object.keys(intersection.turning).forEach(k => {
                    // Todo fix this
                    //renderLines([intersection.turning[k]], context, "#0000FF")
                })
            })

            state.intersections.forEach(intersection => {
                renderLines(intersection.borders, context, "#000000")
            })

            renderNodes(state.nodes, context, "rgba(0,200,0,0.4)", highlightedNode)
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
                        const other = state.nodes[randInt(0, state.nodes.length - 1)]
                        const n = new NewNode(new Vector(randInt(0, WIDTH), randInt(0, HEIGHT)))
                        if (state.nodes.find(x => x.pos.dist(n.pos) < NODE_SIZE * 2)) {
                            return
                        }
                        state.nodes.push(n)
                        state.edges = complexConnect(state.nodes, state.edges, n, other)
                        RERENDER()
                    }
                }>
                WOW!
            </Button>

        </div>
    </div >
}

const getNodeAtCursor = () => {
    return state.nodes.find(n => n.pos.copy().dist(new Vector(state.gridCursor.x, state.gridCursor.y)) < nodeSelectionRange)
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

export default GraphEditor;
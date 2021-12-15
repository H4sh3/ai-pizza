import { useEffect, useRef, useState } from "react"
import { HEIGHT, nodeSelectionRange, NODE_SIZE, WIDTH } from "../modules/const"
import { renderIntersections, renderLines, renderNodes } from "../modules/render"
import { complexConnect, Edge, Node } from "../models/graph"
import Vector from "../models/vector"
import { City } from "../models/city"
import { randInt } from "../etc/math"

const state = {
    nodes: [] as Node[],
    edges: [] as Edge[],
    nodeMode: false,
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

export const createRoundMap = (): { nodes: Node[], edges: Edge[] } => {
    const edges: Edge[] = [];
    const nodes: Node[] = [];
    const center = new Vector(WIDTH / 2, HEIGHT / 2);

    const step = NODE_SIZE * 3
    const n1 = new Node(center.copy().add(new Vector(0, 0)));
    nodes.push(n1)

    const radius = 5
    const numNodes = 6
    const stepSize = 360 / numNodes

    let prev = new Node(center.copy().add(new Vector(step * radius, 0).rotate(0 * stepSize)));
    nodes.push(prev)
    complexConnect(nodes, state.edges, prev, n1)

    for (let i = 1; i < numNodes; i++) {
        const newNode = new Node(center.copy().add(new Vector(step * radius, 0).rotate(i * stepSize)));
        nodes.push(newNode)
        complexConnect(nodes, state.edges, newNode, n1)
        complexConnect(nodes, state.edges, prev, newNode)
        prev = newNode
    }

    complexConnect(nodes, edges, nodes[1], nodes[nodes.length - 1])
    return { nodes, edges }
}

state.nodes = []//createRoundMap().nodes
for (let i = 0; i < 10; i++) {
    state.nodes.push(new Node(new Vector(randInt(NODE_SIZE, WIDTH - NODE_SIZE), randInt(NODE_SIZE, HEIGHT - NODE_SIZE))))
}

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
        state.mouseCursor.x = e.clientX
        state.mouseCursor.y = e.clientY
    }

    const onmousedown = () => {
        if (state.nodeMode) {
            state.nodes.push(new Node(new Vector(state.mouseCursor.x, state.mouseCursor.y)))
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

            //renderLines(state.city.getTurnLines(), context, "#00FF00")
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
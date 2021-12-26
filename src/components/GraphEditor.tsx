import { useEffect, useRef, useState } from "react"
import { HEIGHT, nodeSelectionRange, NODE_SIZE, WIDTH } from "../modules/const"
import { renderIntersections, renderLines, renderNodes, renderPoint, renderTurns, scaleFactor } from "../modules/render"
import { complexConnect, Edge, Node } from "../models/graph"
import Vector from "../models/vector"
import { City } from "../models/city"
import { serializeGraph } from "../modules/etc"
import { IntersectionsMap } from "../modules/maps/training/trainingsMaps"
import { randInt } from "../etc/math"

const state = {
    nodes: [] as Node[],
    edges: [] as Edge[],
    nodeMode: true,
    mouseCursor: {
        x: 0,
        y: 0,
    },
    res: NODE_SIZE,
    selectedNode: undefined,
    grid: [],
    intersections: [],
    city: new City([], []),
    vectors: []
}

export const createRoundMap = (): { nodes: Node[], edges: Edge[] } => {
    let edges: Edge[] = [];
    const nodes: Node[] = [];
    const center = new Vector(WIDTH / 2, HEIGHT / 2);

    const step = NODE_SIZE * 3
    const n1 = new Node(center.copy().add(new Vector(0, 0)));
    nodes.push(n1)

    const radius = 5
    const numNodes = 18
    const stepSize = 360 / numNodes

    let prev = new Node(center.copy().add(new Vector(step * radius, 0).rotate(0 * stepSize)));
    nodes.push(prev)
    edges = complexConnect(nodes, state.edges, prev, n1)

    for (let i = 1; i < numNodes; i++) {
        const newNode = new Node(center.copy().add(new Vector(step * radius, 0).rotate(i * stepSize)));
        nodes.push(newNode)
        if (i % 2 == 0 || i % 3 == 0) {
            edges = complexConnect(nodes, state.edges, newNode, n1)
            edges = complexConnect(nodes, state.edges, prev, newNode)
        }
        prev = newNode
    }

    edges = complexConnect(nodes, edges, nodes[1], nodes[nodes.length - 1])
    return { nodes, edges }
}

export const createRandomMap = () => {
    const nodes = []
    let edges = []
    for (let i = 0; i < 20; i++) {
        const p = new Vector(randInt(NODE_SIZE, (WIDTH * 2) - NODE_SIZE), randInt(NODE_SIZE, (HEIGHT * 2) - NODE_SIZE))
        if (nodes.filter(n => n.pos.dist(p) < 150).length === 0) {
            nodes.push(new Node(p))
        }
    }

    for (let i = 0; i < 25; i++) {
        let n = nodes[randInt(0, nodes.length - 1)]

        if (n.getNeighbours().length > 3) continue

        let closest = nodes
            .filter(o => o !== n)
            .filter(o => !n.getNeighbours().includes(o))
            .sort((a, b) => a.pos.dist(n.pos) < b.pos.dist(n.pos) ? -1 : 0)[0]
        edges = complexConnect(nodes, edges, n, closest)
    }

    return { nodes, edges }
}

const randomCircleNodes = () => {
    const cn = new Node(new Vector(WIDTH / 2, HEIGHT / 2))
    state.nodes.push(cn)

    for (let i = 0; i < 10; i++) {
        let v = new Vector(200, 0)
        v.add(cn.pos)
        while (state.nodes.find(n => n.pos.dist(v) < 50)) {
            v.sub(cn.pos).rotate(randInt(0, 360)).add(cn.pos)
        }
        const n = new Node(v)
        state.nodes.push(n)
        state.edges = complexConnect(state.nodes, state.edges, n, cn)
    }

    state.city = new City(state.nodes, state.edges)
}


state.nodes = []
state.edges = []

const center = new Vector(WIDTH / 2, HEIGHT / 2)

/* state.nodes.push(new Node(center.copy().add(new Vector(-100, 0))))
state.nodes.push(new Node(center.copy().add(new Vector(300, 50))))
state.nodes.push(new Node(center.copy().add(new Vector(300, -50))))

state.nodes.push(new Node(center.copy().add(new Vector(-200, 0))))

state.edges = complexConnect(state.nodes, state.edges, state.nodes[0], state.nodes[1])
state.edges = complexConnect(state.nodes, state.edges, state.nodes[0], state.nodes[2])
state.edges = complexConnect(state.nodes, state.edges, state.nodes[0], state.nodes[3])
 */

const initNewRandomMap = () => {
    const { nodes, edges } = createRandomMap()
    state.nodes = nodes
    state.edges = edges
    state.city = new City(state.nodes, state.edges)
}

initNewRandomMap()
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
        var rect = canvasRef.current.getBoundingClientRect();
        state.mouseCursor.x = e.clientX - rect.left
        state.mouseCursor.y = e.clientY - rect.top
    }

    const onmousedown = () => {
        if (state.nodeMode) {
            state.nodes.push(new Node(new Vector(state.mouseCursor.x / scaleFactor, state.mouseCursor.y / scaleFactor)))
        } else {
            const node = getNodeAtCursor()
            if (node === undefined) return
            if (state.selectedNode === undefined) {
                state.selectedNode = node
            } else {
                state.edges = complexConnect(state.nodes, state.edges, state.selectedNode, node)

                state.city = new City(state.nodes, state.edges)

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

            renderPoint(new Vector(state.mouseCursor.x, state.mouseCursor.y), context, "#ffff00")

            state.city.intersections.forEach(intersection => {
                renderLines(intersection.borders, context, "#0000FF")
            })

            //renderLines(state.edges.map(e => e.line), context, "#ff0000")
            renderTurns(state.city.intersections, context, "#ff0000")

            state.city.intersections.forEach(i => {
                i.turns.filter(t => t.centerDot).forEach(t => {
                    renderPoint(t.centerDot, context, "#00ff00")
                })
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
            <Button
                onClick={
                    () => {
                        serializeGraph(state.nodes, state.edges)
                    }
                }>
                Serialize
            </Button>
            <Button
                onClick={
                    () => {
                        initNewRandomMap()
                        RERENDER()
                    }
                }>
                initNewRandomMap
            </Button>
        </div>
    </div >
}

const getNodeAtCursor = () => {
    return state.nodes.find(n => n.pos.copy().dist(new Vector(state.mouseCursor.x / scaleFactor, state.mouseCursor.y / scaleFactor)) < nodeSelectionRange)
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
    color?: string
}

export const Button: React.FC<ButtonProps> = ({ onClick, children, disabled = false, color = "green" }) => {
    return <div className={`${disabled ? "cursor-not-allowed bg-gray-200" : `cursor-pointer hover:bg-${color}-300 border-${color}-500`} text-center px-2 py-1 select-none bg-white rounded-lg border-2  `}
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
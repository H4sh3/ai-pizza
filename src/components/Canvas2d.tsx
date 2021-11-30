import { useEffect, useRef, useState } from "react"
import { HEIGHT, NODE_SIZE, WIDTH } from "../modules/const"
import { segmentsMock420 } from "../modules/data"
import { Node, Line, Edge, Vector } from "../modules/models"
import { transformation, loadData } from "../modules/transformation"
import search from "../etc/astar"
import mapgen, { randInt } from "../modules/mapgen"
import { randomInt } from "crypto"


const Canvas2d: React.FC = () => {
    const props = {
        width: WIDTH,
        height: HEIGHT
    }
    const canvasRef = useRef(null)

    const [nodes, setNodes] = useState<Node[]>([])
    const [edges, setEdges] = useState<Edge[]>([])

    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        context.fillStyle = "#AAAA99"
        context.fillRect(0, 0, WIDTH, HEIGHT)

        const { nodes, edges } = mapgen()
        setNodes(nodes)
        setEdges(edges)

        const start = nodes[0]
        const end = nodes[randInt(1, nodes.length)]

        const path = search(nodes, start, end)

        const checkpoints = getCheckpoints(path)

        drawCheckpoints(checkpoints, context)
    }, [])

    useEffect(() => {
        // background        
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        drawNodes(nodes, context)
        drawStreets(nodes, context)

        // drawEdges(nodes, context)
        // drawEdgeEdges(edges, context)
    }, [nodes, edges])

    return <canvas ref={canvasRef} {...props} />
}

const drawEdgeEdges = (edges: Edge[], context) => {
    edges.forEach(n => {
        context.beginPath();
        context.moveTo(n.startNode.pos.x, n.startNode.pos.y);
        context.lineTo(n.endNode.pos.x, n.endNode.pos.y);
        context.stroke();
    })
}

const drawEdges = (nodes: Node[], context) => {
    nodes.forEach(n => {
        n.getNeightbours().forEach(other => {
            context.beginPath();
            context.moveTo(n.pos.x, n.pos.y);
            context.lineTo(other.pos.x, other.pos.y);
            context.stroke();
        })
    })
}

const drawStreets = (nodes: Node[], context) => {
    context.strokeStyle = '#000000'
    let lines = []
    nodes.forEach(n => {
        lines = [...lines, ...n.getLines()]
    })
    lines.forEach(l => {
        context.beginPath();
        context.moveTo(l.p1.x, l.p1.y);
        context.lineTo(l.p2.x, l.p2.y);
        context.stroke();
    })
}

const drawCheckpoints = (checkpoints: Line[], context) => {
    checkpoints.forEach(l => {
        context.strokeStyle = '#00FF00'
        context.beginPath();
        context.moveTo(l.p1.x, l.p1.y);
        context.lineTo(l.p2.x, l.p2.y);
        context.stroke();
    })
}

const drawNodes = (nodes: Node[], context) => {
    nodes.forEach(n => {
        context.fillStyle = n.color
        context.fillRect(n.pos.x - NODE_SIZE, n.pos.y - NODE_SIZE, NODE_SIZE * 2, NODE_SIZE * 2)
        context.fillStyle = "#000000"
        context.font = "30px Arial";
        //context.fillText(n.id, n.pos.x, n.pos.y);
    })
}

const nodesJson = (lines: Line[]) => {
    let s = '[\n'
    lines.forEach(l => {
        s += `new Line(${l.p1.x},${l.p1.y},${l.p2.x},${l.p2.y}),\n`
    })
    s += ']'
    console.log(s)
}

const checkpointsJson = (checkpoints: Line[]) => {
    let c = '[\n'
    checkpoints.forEach(l => {
        c += `new Line(${l.p1.x},${l.p1.y},${l.p2.x},${l.p2.y}),\n`
    })
    c += ']'
    console.log(c)
}

const getCheckpoints = (path: Node[]): Line[] => {
    const checkpoints: Line[] = []

    for (let i = 0; i < path.length - 1; i++) {
        const node = path[i]
        const nextNode = path[i + 1]
        Object.keys(node.connections).some(k => {
            if (node.connections[k] === undefined) return

            if (node.connections[k].startNode === nextNode || node.connections[k].endNode === nextNode) {
                checkpoints.push(getCheckpoint(node.pos, k))
                return true
            }
        })
    }
    return checkpoints
}

const getCheckpoint = (pos, direction) => {
    if (direction === "top") {
        return new Line(pos.x - NODE_SIZE, pos.y - NODE_SIZE, pos.x + NODE_SIZE, pos.y - NODE_SIZE)
    }
    if (direction === "right") {
        return new Line(pos.x + NODE_SIZE, pos.y - NODE_SIZE, pos.x + NODE_SIZE, pos.y + NODE_SIZE)
    }
    if (direction === "left") {
        return new Line(pos.x - NODE_SIZE, pos.y - NODE_SIZE, pos.x - NODE_SIZE, pos.y + NODE_SIZE)
    }
    if (direction === "bottom") {
        return new Line(pos.x - NODE_SIZE, pos.y + NODE_SIZE, pos.x + NODE_SIZE, pos.y + NODE_SIZE)
    }
}

export default Canvas2d;
import { useEffect, useRef, useState } from "react"
import { HEIGHT, NODE_SIZE, WIDTH } from "../modules/const"
import { Node, Line, Edge, Vector } from "../modules/models"
import search from "../etc/astar"
import mapgen, { randInt } from "../modules/mapgen"
import { randomInt } from "crypto"
import { useMainState } from "../mainState"
import { request } from "https"
import Agent from "../modules/agent"


const Canvas2d: React.FC = () => {
    const props = {
        width: WIDTH,
        height: HEIGHT
    }
    const canvasRef = useRef(null)

    const { getNodes, setNodes, spawnAgent, runGameLoop, getAgents } = useMainState()

    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')



        const { nodes } = mapgen()
        setNodes(nodes)

        spawnAgent(nodes[0].pos.copy())

        const start = nodes[0]
        const end = nodes[randInt(1, nodes.length)]

        const path = search(nodes, start, end)

        const checkpoints = getCheckpoints(path)

        drawCheckpoints(checkpoints, context)
    }, [])

    const [frameTime, setFrameTime] = useState()
    useEffect(() => {
        let frameId
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        const frame = time => {
            setFrameTime(time)
            frameId = requestAnimationFrame(frame)

            context.fillStyle = "#AAAA99"
            context.fillRect(0, 0, WIDTH, HEIGHT)
    
            const n = getNodes()
            renderNodes(n, context)
            renderStreets(n, context)
            renderAgents(getAgents(), context)
            runGameLoop()
        }

        requestAnimationFrame(frame)
        return () => cancelAnimationFrame(frameId)
    }, [])

    return <div>
        <canvas ref={canvasRef} {...props} />
    </div>
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

const renderStreets = (nodes: Node[], context) => {
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

const renderNodes = (nodes: Node[], context) => {
    nodes.forEach(n => {
        context.fillStyle = n.color
        context.fillRect(n.pos.x - NODE_SIZE, n.pos.y - NODE_SIZE, NODE_SIZE * 2, NODE_SIZE * 2)
        context.fillStyle = "#000000"
        context.font = "30px Arial";
        //context.fillText(n.id, n.pos.x, n.pos.y);
    })
}


const renderAgents = (agents: Agent[], context) => {
    agents.forEach(a => {
        context.fillStyle = "#00FFFF"
        context.fillRect(a.pos.x, a.pos.y, NODE_SIZE * 2, NODE_SIZE * 0.5)
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
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

    const { getNodes, getCheckpoints, setNodes, getIntersections, runGameLoop, getAgents, spawnAgent } = useMainState()

    useEffect(() => {
        const { nodes } = mapgen()
        setNodes(nodes)
        spawnAgent()
    }, [])

    const [frameTime, setFrameTime] = useState()
    useEffect(() => {
        let frameId
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        let lastTime
        const frame = time => {
            setFrameTime(time)
            frameId = requestAnimationFrame(frame)

            const timeDelta = time - lastTime
            if (timeDelta < 1000 / 60) return
            lastTime = time

            context.fillStyle = "#AAAA99"
            context.fillRect(0, 0, WIDTH, HEIGHT)

            const n = getNodes()
            renderNodes(n, context)
            renderStreets(n, context)
            renderCheckpoints(getCheckpoints(), context)
            renderAgents(getAgents(), context)
            renderSensorIntersections(getIntersections(), context)
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

const renderCheckpoints = (checkpoints: Line[], context) => {
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
        context.fillText(n.id, n.pos.x, n.pos.y);
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


const renderSensorIntersections = (intersections: Vector[], context) => {
    intersections.forEach(i => {
        context.fillStyle = "#FF0000"
        context.fillRect(i.x, i.y, NODE_SIZE * 2, NODE_SIZE * 2)
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



export default Canvas2d;
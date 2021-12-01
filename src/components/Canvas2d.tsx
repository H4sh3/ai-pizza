import { useEffect, useRef, useState } from "react"
import { HEIGHT, NODE_SIZE, WIDTH } from "../modules/const"
import { Node, Line, Edge, Vector } from "../modules/models"
import getTrainingsEnv from '../modules/trainingsEnv'
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

    const { getNodes, setNodes, getIntersections, enableFastTrain, runGameLoop, getAgents, spawnAgent, getCheckpoints } = useMainState()

    useEffect(() => {
        //const { nodes } = mapgen()
        const { nodes } = getTrainingsEnv()
        setNodes(nodes)
        for (let i = 0; i < 25; i++) {
            spawnAgent()
        }
    }, [])

    const [frameTime, setFrameTime] = useState()
    useEffect(() => {
        let frameId
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        let lastTime
        const frame = time => {
            const timeDelta = time - lastTime
            frameId = requestAnimationFrame(frame)
            //if (timeDelta < 1000 / 60) return
            lastTime = time

            context.fillStyle = "#AAAA99"
            context.fillRect(0, 0, WIDTH, HEIGHT)

            const n = getNodes()
            renderNodes(n, context)
            renderStreets(n, context)
            renderAgents(getAgents(), context)
            renderCheckpoints(getCheckpoints(), context)
            renderSensorIntersections(getIntersections(), context)
            runGameLoop(context)
        }

        requestAnimationFrame(frame)
        return () => cancelAnimationFrame(frameId)
    }, [])

    return <div>
        <canvas ref={canvasRef} {...props} />
        <button onClick={enableFastTrain}>fast!</button>
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
    const usedEdgeIds = []
    nodes.forEach(n => {
        lines = [...lines, ...n.getLines(usedEdgeIds)]
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
        context.fillText(n.id, n.pos.x - (NODE_SIZE) + 2, n.pos.y + NODE_SIZE / 2);
    })
}


const renderAgents = (agents: Agent[], context) => {
    agents.forEach(a => {
        if (a.alive) {
            context.fillStyle = "#00FFFF"
        } else {
            context.fillStyle = "#FF0000"
        }
        const s = NODE_SIZE * 0.5
        context.fillRect(a.pos.x - (s / 2), a.pos.y - (s / 2), s, s)
        context.fillStyle = "#000000"
        context.font = "30px Arial";
        //context.fillText(n.id, n.pos.x, n.pos.y);
    })
}


const renderSensorIntersections = (intersections: Vector[], context) => {
    intersections.forEach(i => {
        context.fillStyle = "#FF0000"
        context.fillRect(i.x, i.y, 5, 5)
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
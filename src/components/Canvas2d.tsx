import { useEffect, useRef, useState } from "react"
import { HEIGHT, NODE_SIZE, WIDTH } from "../modules/const"
import { Node, Line, Vector } from "../modules/models"
import Agent from "../modules/agent"
import Gym from "../modules/gym"
import { degToRad } from "../modules/math"

const gym = new Gym(WIDTH, HEIGHT)

const Canvas2d: React.FC = () => {
    const props = {
        width: WIDTH,
        height: HEIGHT
    }

    const canvasRef = useRef(null)
    const [iter, setIter] = useState(0)

    let showIntersections = false
    let showSensors = false


    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        let lastTime
        let frameId
        const frame = time => {
            const timeDelta = time - lastTime
            frameId = requestAnimationFrame(frame)
            if (timeDelta < 1000 / 60) return
            context.fillStyle = "rgb(120, 120, 120)";
            context.fillRect(0, 0, WIDTH, HEIGHT)

            lastTime = time

            //renderNodes(gym.nodes, context)
            renderLines(gym.roads, context, "#FFFFFF")
            //renderLines(gym.checkpoints, context, "#00FF00")
            if (showSensors) {
                renderLines(gym.sensorVisual, context, "#0000FF")
            }
            renderAgents(gym.agents, context)

            if (showIntersections) {
                renderIntersections(gym.intersections, context)
            }

            gym.step()
        }

        requestAnimationFrame(frame)
        return () => cancelAnimationFrame(frameId)
    }, [])

    return <div>
        <canvas ref={canvasRef} {...props} />
        <button onClick={() => {
            gym.pretrain = true
            gym.pretrainEpoch = 0
        }}>fast!</button>
        <button onClick={() => {
            console.log(gym.agents[0].nn.serialize())
        }}>save</button>
        {iter}
        <button onClick={() => {
            showSensors = !showSensors
        }}>sensors</button>
        <button onClick={() => {
            showIntersections = !showIntersections
        }
        }>intersections</button>
    </div>
}

const renderLines = (lines: Line[], context, color) => {
    context.strokeStyle = color
    lines.forEach((l, i) => {
        context.beginPath();
        context.moveTo(l.p1.x, l.p1.y);
        context.lineTo(l.p2.x, l.p2.y);
        context.stroke();
        //context.fillText(i, (l.p1.x + l.p2.x) / 2, (l.p1.y + l.p2.y) / 2);
    })
}

const renderNodes = (nodes: Node[], context) => {
    nodes.forEach(n => {
        context.fillStyle = n.color
        context.fillRect(n.pos.x - NODE_SIZE, n.pos.y - NODE_SIZE, NODE_SIZE * 2, NODE_SIZE * 2)
        context.fillStyle = "#000000"
        context.font = "30px Arial";
        //context.fillText(n.id, n.pos.x - (NODE_SIZE) + 2, n.pos.y + NODE_SIZE / 2);
    })
}

const renderAgents = (agents: Agent[], context) => {
    agents.filter(a => a.alive).forEach(a => {
        context.save()
        if (a.alive) {
            context.fillStyle = "rgb(255, 255, 0)";
        } else {
            context.fillStyle = "#FF0000"
        }
        const s = NODE_SIZE * 0.5
        const aX = a.pos.x
        const aY = a.pos.y
        context.translate(aX, aY)
        context.rotate(degToRad(a.acc.heading()))
        context.fillRect(- (s / 2), - (s / 2), s * 1.5, s)
        context.fillStyle = "#000000"
        context.font = "30px Arial";
        context.restore()
        //context.fillText(n.id, n.pos.x, n.pos.y);
    })
}

const renderIntersections = (intersections: Vector[], context) => {
    intersections.forEach(i => {
        context.fillStyle = "#FF0000"
        context.fillRect(i.x, i.y, 5, 5)
        context.fillStyle = "#000000"
        context.font = "30px Arial";
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
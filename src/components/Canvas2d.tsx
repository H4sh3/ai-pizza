import { useEffect, useRef, useState } from "react"
import { HEIGHT, NODE_SIZE, WIDTH } from "../modules/const"
import { Node, Line, Vector } from "../modules/models"
import { useMainState } from "../mainState"
import Agent from "../modules/agent"
import Gym from "../modules/gym"

const gym = new Gym(WIDTH, HEIGHT)

const Canvas2d: React.FC = () => {
    const props = {
        width: WIDTH,
        height: HEIGHT
    }

    const canvasRef = useRef(null)
    const [iter, setIter] = useState(0)


    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        let lastTime
        let frameId
        const frame = time => {
            const timeDelta = time - lastTime
            frameId = requestAnimationFrame(frame)
            //if (timeDelta < 1000 / 60) return
            lastTime = time

            context.fillStyle = "#AAAA99"
            context.fillRect(0, 0, WIDTH, HEIGHT)

            renderNodes(gym.nodes, context)
            gym.roadTree.forEach(t => {
                renderLines(t.elements, context, "#FFFFFF")
            })
            renderLines(gym.checkpoints, context, "#00FF00")
            renderLines(gym.sensorVisual, context, "#0000FF")
            renderAgents(gym.agents, context)
            renderIntersections(gym.intersections, context)
            gym.step()
            setIter(gym.iteration)
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
        {iter}
    </div>
}

const renderLines = (lines: Line[], context, color) => {
    context.strokeStyle = color
    lines.forEach(l => {
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
            context.fillStyle = "#FFFF00"
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
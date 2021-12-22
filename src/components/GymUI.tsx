import { useEffect, useRef, useState } from "react"
import { HEIGHT, WIDTH } from "../modules/const"
import { Line } from "../modules/models"
import Gym from "../modules/gym"
import { renderLines, renderAgents, renderIntersections } from "../modules/render"
import { Button } from "./GraphEditor"


const gym = new Gym(WIDTH, HEIGHT)

const GymUI: React.FC = () => {
    const props = {
        width: WIDTH,
        height: HEIGHT
    }

    const canvasRef = useRef(null)
    const [iter, setIter] = useState("0")

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
            setIter(timeDelta.toFixed(2))
            if (timeDelta < 1000 / 60) return
            context.fillStyle = "rgb(140, 140, 140)";
            context.fillRect(0, 0, WIDTH, HEIGHT)

            lastTime = time
            renderLines(gym.roads, context, "#FFFFFF")
            renderLines(gym.checkpoints, context, "#00FF00")
            renderLines(gym.intersections, context, "#00FF00")
            if (showSensors) {
                renderLines(gym.sensorVisual, context, "#0000FF")
            }
            renderAgents(gym.agents, context)

            gym.step()
        }

        requestAnimationFrame(frame)
        return () => cancelAnimationFrame(frameId)
    }, [])

    return <div>
        <canvas ref={canvasRef} {...props} />
        <div className="flex flex-row gap-2 items-center justify-center p-2">
            <Button onClick={() => {
                gym.pretrain = true
                gym.pretrainEpoch = 0
            }}>fast!</Button>
            <Button onClick={() => {
                console.log(gym.agents[0].nn.serialize())
            }}>save</Button>
            {iter}
            <Button onClick={() => {
                showSensors = !showSensors
            }}>sensors</Button>
            <Button onClick={() => {
                showIntersections = !showIntersections
            }
            }>intersections</Button>
            <div className="p-2">
                {`${gym.pretrainEpoch} / ${gym.pretrainEpochs}`}
            </div>
            |
            <div className="p-2">
                {`${gym.agents.length} / ${gym.settings.popSize}`}
            </div>
        </div>
    </div>
}


const nodesJson = (lines: Line[]) => {
    let s = '[\n'
    lines.forEach(l => {
        s += `new Line(${l.p1.x}, ${l.p1.y}, ${l.p2.x}, ${l.p2.y}), \n`
    })
    s += ']'
    console.log(s)
}

const checkpointsJson = (checkpoints: Line[]) => {
    let c = '[\n'
    checkpoints.forEach(l => {
        c += `new Line(${l.p1.x}, ${l.p1.y}, ${l.p2.x}, ${l.p2.y}), \n`
    })
    c += ']'
    console.log(c)
}



export default GymUI;
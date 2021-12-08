import { useEffect, useRef, useState } from "react"
import { HEIGHT, WIDTH } from "../modules/const"
import { Line } from "../modules/models"
import Agent from "../modules/agent"
import Gym from "../modules/gym"
import { renderLines, renderAgents, renderIntersections } from "../modules/render"


const gym = new Gym(WIDTH, HEIGHT)

const Canvas2d: React.FC = () => {
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
            //renderNodes(gym.nodes, context)
            renderLines(gym.roads, context, "#FFFFFF")
            //const usedIds = []
            //renderLines(gym.agents[0].route.map(n => n.getLines(usedIds)).reduce((acc, x) => { return acc.concat(x) }, []), context, "#00FF00")
            /* 
                        gym.agents.forEach(a => {
                            renderLines(getRouteLines(a), context, "#00FF00")
                        }) */

            if (showSensors) {
                renderLines(gym.sensorVisual, context, "#0000FF")
            }
            renderAgents(gym.agents, context)

            // renderCrashed(gym.crashed, context)

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

const getRouteLines = (agent: Agent) => {
    const lines = {}
    agent.route.map(n => {
        n.getEdges().map(e => {
            if (lines[e.id]) {
                lines[e.id].cnt += 1
            } else {
                lines[e.id] = { cnt: 1, e }
            }
        })
    })
    const arr = Object.keys(lines).map(k => { return lines[k] })
    return arr.filter(e => e.cnt === 2).map(cntObject => cntObject.e.getLine())
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



export default Canvas2d;
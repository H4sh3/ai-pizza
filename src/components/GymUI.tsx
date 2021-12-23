import { useEffect, useRef, useState } from "react"
import { HEIGHT, WIDTH } from "../modules/const"
import { Line } from "../modules/models"
import Gym from "../modules/gym"
import { renderLines, renderAgents, renderIntersections } from "../modules/render"
import { Button } from "./GraphEditor"
import { City } from "../models/city"
import Game from "../modules/game"
import NeuralNetwork from "../thirdparty/nn"
import { randInt } from "../etc/math"


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

    return <div className="flex flex-col gap-2 items-center">
        <div className="flex flex-row gap-2 items-center">
            <div>
                <canvas ref={canvasRef} {...props} />
            </div>
            <NeuralNetworkStore neuralNetworkLocation={gym.bestNeuralNet} />
        </div>
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

interface NeuralNetworkStoreProps {
    neuralNetworkLocation: NeuralNetwork
}

const NeuralNetworkStore = ({ neuralNetworkLocation }) => {
    const [storageItems, setStorageItems] = useState(Object.keys(localStorage))
    return <div className="flex flex-row gap-2">
        <div className="grid grid-cols-1 gap-2 items-center justify-center">
            {
                storageItems.map((item, i) => {
                    return <div className="border-2 flex flex-row gap-2 justify-around items-center" key={i}>
                        {`model: ${item}`}
                        <Button color="green" onClick={() => {
                            neuralNetworkLocation = NeuralNetwork.deserialize(localStorage.getItem(item))
                        }}>load</Button>
                        <Button color="orange" onClick={() => {
                            neuralNetworkLocation = NeuralNetwork.deserialize(localStorage.getItem(item))
                            localStorage.setItem(item, neuralNetworkLocation.serialize())
                        }}>overwrite</Button>
                        <Button color="red" onClick={() => {
                            localStorage.removeItem(item)
                            setStorageItems(storageItems.filter(s => s !== item))
                        }}>delete</Button>
                    </div>
                })
            }
            <Button onClick={() => {
                const key = `${randInt(0, 100)}-${randInt(0, 100)}-${randInt(0, 100)}`
                setStorageItems([...storageItems, key])
                localStorage.setItem(key, neuralNetworkLocation.serialize())
            }
            }>save new model</Button>
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
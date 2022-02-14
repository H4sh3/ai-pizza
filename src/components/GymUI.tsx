import React, { useEffect, useRef, useState } from "react"
import { HEIGHT, LAYER_CONFIG, WIDTH } from "../modules/const"
import { Line } from "../modules/models"
import Gym from "../modules/gym"
import { renderLines, renderAgents, renderIntersections, renderText } from "../modules/render"
import { Button } from "./GraphEditor"
import { City } from "../models/city"
import Game from "../modules/game"
import NeuralNetwork from "../thirdparty/nn"
import { randInt } from "../etc/math"
import { BigIntersectionsMap, IntersectionsMap, SpiderWebMap, StraightMap, ZigZagMap } from "../modules/maps/training/trainingsMaps"
import BigCity from "../modules/maps/bigCity"


let gym = new Gym(WIDTH, HEIGHT, IntersectionsMap)

const GymUI: React.FC = () => {
    const props = {
        width: WIDTH,
        height: HEIGHT
    }

    const canvasRef = useRef(null)
    const [iter, setIter] = useState("0")
    const [highscore, setHighscore] = useState(0)

    gym.setHighscore = setHighscore

    let showIntersections = false


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
            context.fillStyle = "rgb(180, 180, 180)";
            context.fillRect(0, 0, WIDTH, HEIGHT)

            lastTime = time
            renderLines(gym.roads, context, "#000000")
            renderLines(gym.checkpoints, context, "#00FF00")
            renderLines(gym.intersections, context, "#00FF00")
            renderLines(gym.sensorVisual, context, "#0000FF")
            renderAgents(gym.agents, context)
            renderText(`${gym.iteration} / ${gym.maxIter}`, 150, 20, context, "#000000")
            renderText(`Agents alive: ${gym.agents.filter(a => a.alive).length} / ${gym.settings.popSize + 1}`, 150, 40, context, "#000000")
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
            <Button onClick={() => {
                showIntersections = !showIntersections
            }
            }>intersections</Button>
            <div className="p-2">
                {`${gym.pretrainEpoch} / ${gym.pretrainEpochs}`}
            </div>
            <div className="p-2">
                {`TD: ${iter}`}
            </div>
            |
            <div className="p-2">
                {`${gym.agents.length} / ${gym.settings.popSize}`}
            </div>
            <div>
                Highscore: {highscore}
            </div>
            <Button color="red" onClick={() => {
                gym.bestNeuralNet = new NeuralNetwork(LAYER_CONFIG.input, LAYER_CONFIG.hidden, LAYER_CONFIG.output)
                gym.addAgents()
            }
            }>fresh model</Button>
        </div>
        <div className="flex flex-row gap-2 items-center justify-center p-2">
            <Button onClick={() => {
                gym = new Gym(WIDTH, HEIGHT, StraightMap)
                gym.setHighscore = setHighscore
                setHighscore(0)
            }}>Straight</Button>
            <Button onClick={() => {
                gym = new Gym(WIDTH, HEIGHT, ZigZagMap)
                gym.setHighscore = setHighscore
                setHighscore(0)
            }}>Zigzag</Button>
            <Button onClick={() => {
                gym = new Gym(WIDTH, HEIGHT, IntersectionsMap)
                gym.setHighscore = setHighscore
                setHighscore(0)
            }}>Intersections</Button>
            <Button onClick={() => {
                gym = new Gym(WIDTH, HEIGHT, SpiderWebMap)
                gym.setHighscore = setHighscore
                setHighscore(0)
            }}>SpiderWebMap</Button>
            <Button onClick={() => {
                gym = new Gym(WIDTH, HEIGHT, BigIntersectionsMap)
                gym.setHighscore = setHighscore
                setHighscore(0)
            }}>BigIntersectionsMap</Button>
            <Button onClick={() => {
                gym = new Gym(WIDTH, HEIGHT, BigCity)
                gym.setHighscore = setHighscore
                setHighscore(0)
            }}>BigCity</Button>

        </div>
        <div className="flex flex-row gap-2 items-center justify-center p-2">
            <Button onClick={() => {
                gym.toggleTrainigsParameter()
            }}>toggleTrainigsParameter {gym.trainingsParameter}</Button>
            <Button onClick={() => {
                gym.maxIter += 500
            }}>maxIter +500</Button>
            <Button onClick={() => {
                if (gym.maxIter >= 500) {
                    gym.maxIter -= 500
                }
            }}>maxIter -500</Button>

        </div>
    </div>
}

interface NeuralNetworkStoreProps {
    neuralNetworkLocation: NeuralNetwork
    loadHandler?: (key: string) => void
}

export const NeuralNetworkStore: React.FC<NeuralNetworkStoreProps> = ({ neuralNetworkLocation, loadHandler = () => { } }) => {
    const [storageItems, setStorageItems] = useState(Object.keys(localStorage))
    return <div className="flex flex-row gap-2">
        <div className="grid grid-cols-1 gap-2 items-center justify-center">
            {
                storageItems.map((item, i) => {
                    return <div className="border-2 flex flex-row gap-2 justify-around items-center p-1" key={i}>
                        {`model: ${item}`}
                        <Button color="green" onClick={() => {
                            loadHandler(item)
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
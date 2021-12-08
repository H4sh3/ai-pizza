import { useEffect, useRef, useState } from "react"
import { HEIGHT, NODE_SIZE, WIDTH } from "../modules/const"
import { Node, Line, Vector } from "../modules/models"
import Agent from "../modules/agent"
import { renderLines, renderAgents, renderIntersections, renderNodes, renderStations } from "../modules/render"
import Game from "../modules/game"


const game = new Game(WIDTH, HEIGHT)

const nodeSelectionRange = NODE_SIZE * 1.2;

const GameUI: React.FC = () => {
    const [renderUi, setRenderUi] = useState(false)

    const props = {
        width: WIDTH,
        height: HEIGHT
    }

    const RERENDER = () => {
        setRenderUi(!renderUi)
    }

    const canvasRef = useRef(null)

    const onmousemove = (e) => {
        game.mouse.x = e.clientX
        game.mouse.y = e.clientY
    }

    const onmousedown = () => {
        if (!game.gameState.firstNodePicked) {
            // user is picking first node
            const pickedNode: Node = game.nodes.find(n => n.pos.dist(new Vector(game.mouse.x, game.mouse.y)) < nodeSelectionRange)
            if (pickedNode === undefined) return

            game.gameState.stations.push(pickedNode)
            game.gameState.firstNodePicked = true
            game.spawnAgent(pickedNode)
            game.addTasks(pickedNode, 3)
            console.log(game.tasks)
            RERENDER()
        }
    }


    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        let lastTime
        let frameId
        const frame = time => {
            const timeDelta = time - lastTime
            frameId = requestAnimationFrame(frame)
            if (timeDelta < 1000 / 60) return
            context.fillStyle = "rgba(160, 160, 160,10)";
            context.fillRect(0, 0, WIDTH, HEIGHT)

            lastTime = time


            if (!game.gameState.firstNodePicked) {
                const highlightedNode: Node = game.nodes.find(n => n.pos.dist(new Vector(game.mouse.x, game.mouse.y)) < nodeSelectionRange)
                renderNodes(game.nodes.filter(n => n.getNeightbours().length <= 2), context, "rgba(0,200,0,70)", highlightedNode)
            }

            if (game.gameState.stations.length > 0) {
                renderStations(game.gameState.stations, context)
            }

            renderLines(game.roads, context, "#FFFFFF")
            renderAgents(game.agents, context)
            if (game.gameState.running) {
                game.step()
            }
        }

        requestAnimationFrame(frame)
        return () => cancelAnimationFrame(frameId)
    }, [])

    return <div className="flex flex-row border-2 border-black-500">
        <div onMouseMove={onmousemove}
            onMouseDown={onmousedown}
        >
            <canvas style={{ "border": "1px solid #000000" }} ref={canvasRef} {...props} />
        </div>
        {game.agents.length}
        <div className="p-5 flex flex-col items-center justify-center gap-2">
            {game.gameState.firstNodePicked ?
                <div className="flex flex-col gap-2">
                    {
                        game.tasks.map((t, i) => {
                            return <div className={`px-2 py-1 cursor-pointer border-2 ${t.active ? "border-green-300" : "border-gray-100"} rounded-lg`}
                                onClick={() => {
                                    game.activateTask(t)
                                    RERENDER()
                                }}
                                key={i}>{t.end.id}
                            </div>
                        })
                    }
                </div>
                :
                <Task
                    title={"1.) Pick your first station!"}
                    text={"Start by placing your first station. This is from where your agents will start to deliver pizza!"}
                />
            }
        </div>
    </div>
}

interface TaskProps {
    title: string
    text: string
}

const Task: React.FC<TaskProps> = ({ text, title }) => {
    return <div className="flex flex-col text-center p-2 bg-gray-300 border-green-500 border-2 rounded-xl gap-2">
        <div className="font-bold text-xl text-gray-700">
            {title}
        </div>
        <div className="p-2 bg-white rounded-xl">
            {text}
        </div>
    </div>
}

interface ButtonProps {
    onClick: () => void
}

const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
    return <div className="text-center px-2 py-1 select-none border-green-500 bg-white rounded-lg border-2 hover:bg-green-300 cursor-pointer" onClick={onClick}>
        {children}
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



export default GameUI;
import { useEffect, useRef, useState } from "react"
import { HEIGHT, NODE_SIZE, WIDTH } from "../modules/const"
import { Node, Line, Vector } from "../modules/models"
import Agent from "../modules/agent"
import { renderLines, renderAgents, renderIntersections, renderNodes, renderStations, renderPizzaDespawns } from "../modules/render"
import Game from "../modules/game"


const game = new Game(WIDTH, HEIGHT)

const nodeSelectionRange = NODE_SIZE * 1.2;

const prices = {
    taskSheduler: 200,
    agent: 1000,
}

const allowedNeighbours = 1

export interface PizzaDespawn {
    pos: Vector,
    scaleF: number
}

const GameUI: React.FC = () => {
    const [renderUi, setRenderUi] = useState(0)

    const props = {
        width: WIDTH,
        height: HEIGHT
    }

    const RERENDER = () => {
        setRenderUi(renderUi + 1)
    }

    game.rerender = () => {
        RERENDER()
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
            if (pickedNode.getNeightbours().length > allowedNeighbours) return

            game.gameState.stations.push(pickedNode)
            game.gameState.firstNodePicked = true
            game.spawnAgent(pickedNode)
            game.addTasks(pickedNode, 3)
            game.gameState.running = true
            game.rerender()
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

            renderAgents(game.agents, context)
            if (!game.gameState.firstNodePicked) {
                const highlightedNode: Node = game.nodes.find(n => n.pos.dist(new Vector(game.mouse.x, game.mouse.y)) < nodeSelectionRange)
                renderNodes(game.nodes.filter(n => n.getNeightbours().length <= allowedNeighbours), context, "rgba(0,200,0,70)", highlightedNode)
            }

            if (game.gameState.stations.length > 0) {
                renderStations(game.gameState.stations, context)
            }

            if (game.tasks.length > 0) {
                renderNodes(game.tasks.filter(t => !t.active).map(t => t.end), context, "rgba(100,100,100,0.2)")
                renderNodes(game.tasks.filter(t => !t.deliverd && t.active).map(t => t.end), context, "rgba(0,200,0,0.4)")
            }

            renderPizzaDespawns(game.pizzaDespawns, context)

            renderLines(game.roads, context, "#FFFFFF")
            if (game.gameState.running) {
                game.step()
            }
        }

        requestAnimationFrame(frame)
        return () => cancelAnimationFrame(frameId)
    }, [])

    const openTasks = game.tasks.filter(t => !t.active)
    const activeTasks = game.tasks.filter(t => t.active)

    const borderGrayAndP = "border-2 border-gray-300 p-2"

    return <div className="flex flex-row border-2 border-black-500 select-none">
        <div onMouseMove={onmousemove}
            onMouseDown={onmousedown}
            className="p-2"
        >
            <canvas style={{ "border": "1px solid #000000" }} ref={canvasRef} {...props} />
        </div>
        <div className="p-5 flex flex-col gap-2">
            {game.gameState.firstNodePicked ?
                <div className="flex flex-col gap-2">
                    <div className={borderGrayAndP}>
                        <div className="flex flex-row justify-between gap-2">
                            <div>
                                {`Points: ${game.gameState.points}`}
                            </div>
                            <div>
                                {`Money: ${game.gameState.money}$`}
                            </div>
                        </div>
                    </div>
                    <div className={borderGrayAndP}>
                        <div className="flex flex-row text-center items-center justify-around gap-2">
                            <div className="flex flex-col gap-2 items-center">
                                <img className="w-12 h-12" id="pizza" src="pizza.png" />
                                <div>
                                    {game.gameState.delivered}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 items-center">
                                <div>
                                    Agents:
                                </div>
                                <div>
                                    {game.agents.length}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={borderGrayAndP}>
                        <div className="flex flex-col gap-2">
                            <div className="underline text-center">Shop</div>
                            {
                                game.gameState.autoTaskAssign ? <></>
                                    :
                                    <Button
                                        disabled={game.gameState.money < prices.taskSheduler}
                                        onClick={
                                            () => {
                                                game.gameState.money -= prices.taskSheduler
                                                game.gameState.autoTaskAssign = true
                                            }
                                        }>{`Task sheduler - ${prices.taskSheduler}$`}</Button>
                            }
                            <Button
                                disabled={game.gameState.money < prices.agent}
                                onClick={
                                    () => {
                                        game.gameState.money -= prices.agent
                                        game.spawnAgent(game.gameState.stations[0])
                                    }
                                }>{`Agent - ${prices.agent}$`}</Button>
                        </div>
                    </div>
                    <div className="h-full">
                        <div className="flex flex-row gap-2">
                            <TaskCol>
                                <div className="underline">
                                    Open tasks
                                </div>
                                {
                                    openTasks.map((t, i) => {
                                        const disabled = game.agents.filter(a => a.routes.length === 0).length === 0
                                        return <div className={`${disabled ? 'bg-gray-200 cursor-not-allowed' : 'bg-white cursor-pointer'} text-center px-2 py-1 border-2 ${t.active ? "border-green-300" : "border-gray-100"} rounded-lg`}
                                            onClick={() => {
                                                if (disabled) return
                                                game.activateTask(t)
                                                RERENDER()
                                            }}
                                            key={i}>
                                            {`Delivery to Nr. ${t.end.id}`}
                                        </div>
                                    })
                                }
                            </TaskCol>
                            <TaskCol>
                                <div className="underline">
                                    Active tasks
                                </div>
                                {
                                    activeTasks.map((t, i) => {
                                        return <div className={`bg-white cursor-default text-center px-2 py-1 border-2 ${t.active ? "border-green-300" : "border-gray-100"} rounded-lg`}
                                            key={i}>
                                            {`Delivering to Nr. ${t.end.id}`}
                                        </div>
                                    })
                                }
                            </TaskCol>
                        </div>
                    </div>

                </div>
                :
                <Task
                    title={"1.) Pick your first station!"}
                >
                    <div className="">
                        <div>
                            As the CEO of AI-Pizza Corp your only goal is to deliver as many pizzas as possible.
                        </div>
                        <div>
                            Don't worry you wont have to deliver them yourself, its the future and self driving Pizza-delivery-agents exist already.
                        </div>
                        <div>
                            Start by placing your first station, this is where your agents will spawn.
                        </div>
                    </div>
                </Task>

            }
        </div>
    </div >
}



const TaskCol: React.FC = ({ children }) => {
    return <div className="flex flex-col gap-2 p-2 border-2 border-gray-300">
        {children}
    </div>
}

interface TaskProps {
    title: string
}

const Task: React.FC<TaskProps> = ({ title, children }) => {
    return <div className="flex flex-col p-2 bg-gray-300 border-green-500 border-2 rounded-xl gap-2">
        <div className="text-center font-bold text-xl text-gray-700">
            {title}
        </div>
        <div className="p-2 bg-white rounded-xl">
            {children}
        </div>
    </div>
}

interface ButtonProps {
    onClick: () => void
    disabled?: boolean
}

const Button: React.FC<ButtonProps> = ({ onClick, children, disabled = false }) => {
    return <div className={`${disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-green-300 border-green-500"} text-center px-2 py-1 select-none bg-white rounded-lg border-2  `}
        onClick={() => {
            if (disabled) return
            onClick()
        }}>
        {children}
    </div>
}

const getRouteLines = (agent: Agent) => {
    const lines = {}
    agent.routes.map(route => {
        route.nodes.map(n => {
            n.getEdges().map(e => {
                if (lines[e.id]) {
                    lines[e.id].cnt += 1
                } else {
                    lines[e.id] = { cnt: 1, e }
                }
            })
        })
    })
    const arr = Object.keys(lines).map(k => { return lines[k] })
    return arr.filter(e => e.cnt === 2).map(cntObject => cntObject.e.getLine())
}

export default GameUI;
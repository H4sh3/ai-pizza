import { useEffect, useRef, useState } from "react"
import { allowedNeighbours, HEIGHT, nodeSelectionRange, NODE_SIZE, WIDTH } from "../modules/const"
import { Node, Vector } from "../modules/models"
import Agent from "../modules/agent"
import { renderLines, renderAgents, renderNodes, renderStations, renderPizzaAnimations, renderProfitTexts } from "../modules/render"
import Game from "../modules/game"

const game = new Game(WIDTH, HEIGHT)


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
        game.mouseClicked()
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

            if (game.gameState.running && game.startTime === 0) {
                game.startTime = time
            }
            game.currTime = time

            //renderLines(game.intersections, context, "#000000")
            renderAgents(game.agents, context)
            // used when the user picks first station
            if (game.gameState.pickingFirstNode) {
                const highlightedNode: Node = game.nodes.find(n => n.pos.copy().add(new Vector(NODE_SIZE / 2, NODE_SIZE / 2)).dist(new Vector(game.mouse.x, game.mouse.y)) < nodeSelectionRange)
                renderNodes(game.nodes.filter(n => n.getNeightbours().length <= allowedNeighbours), context, "rgba(0,200,0,70)", highlightedNode)
            }

            if (game.edgeBuild.active) {
                if (game.edgeBuild.startNode === undefined) {
                    const highlightedNode: Node = game.nodes.find(n => n.pos.copy().add(new Vector(NODE_SIZE / 2, NODE_SIZE / 2)).dist(new Vector(game.mouse.x, game.mouse.y)) < nodeSelectionRange)
                    renderNodes(game.nodes.filter(n => n.getNeightbours().length < 4), context, "rgba(0,200,0,70)", highlightedNode)
                } else {
                    const highlightedNode: Node = game.nodes.find(n => n.pos.copy().add(new Vector(NODE_SIZE / 2, NODE_SIZE / 2)).dist(new Vector(game.mouse.x, game.mouse.y)) < nodeSelectionRange)
                    const nodesWithRightDist = game.nodes.filter(n => n.pos.dist(game.edgeBuild.startNode.pos) === NODE_SIZE * 3)
                    const notANeighbour = nodesWithRightDist.filter(n => !game.edgeBuild.startNode.getNeightbours().includes(n))
                    renderNodes(notANeighbour, context, "rgba(0,200,0,70)", highlightedNode)
                }
            }

            if (game.gameState.stations.length > 0) {
                renderStations(game.gameState.stations, context)
            }

            renderNodes(game.tasks.filter(t => !t.deliverd && t.active).map(t => t.end), context, "rgba(0,200,0,0.4)")

            renderPizzaAnimations(game.pizzaAnimation, context)
            renderProfitTexts(game.scrollingTexts, context)

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
    const { prices } = game;

    const borderGrayAndP = "border-2 border-gray-300 p-2"

    return <div className="flex flex-row border-2 border-black-500 select-none">
        <div onMouseMove={onmousemove}
            onMouseDown={onmousedown}
            className="p-2"
        >
            <canvas style={{ "border": "1px solid #000000" }} ref={canvasRef} {...props} />
        </div>
        <div className="p-5 flex flex-col gap-2">
            {game.gameState.pickingFirstNode ?
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
                :
                <div className="flex flex-col gap-2">
                    <div className={borderGrayAndP}>
                        {`Time left: ${300 - Math.floor((game.currTime - game.startTime) / 1000)}`}
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
                            <Button
                                disabled={game.gameState.money < prices.agent}
                                onClick={
                                    () => {
                                        game.gameState.money -= prices.agent
                                        game.gameState.numAgents++
                                        game.rerender()
                                    }
                                }>
                                {`Agent - ${prices.agent}$`}
                            </Button>
                            <Button
                                disabled={game.gameState.money < prices.addEdge}
                                onClick={
                                    () => {
                                        game.gameState.money -= prices.addEdge
                                        game.edgeBuild.active = true
                                        game.rerender()
                                    }
                                }>
                                {`Add edge - ${prices.addEdge}$`}
                            </Button>
                        </div>
                    </div>
                    {
                        game.gameState.autoTaskAssign ? <></>
                            :
                            <Button
                                disabled={game.gameState.money < prices.taskSheduler}
                                onClick={
                                    () => {
                                        game.gameState.money -= prices.taskSheduler
                                        game.gameState.autoTaskAssign = true
                                        game.gameState.running = true
                                        game.rerender()
                                    }
                                }>
                                Start
                            </Button>
                    }
                </div>
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
    return <div className={`${disabled ? "cursor-not-allowed bg-gray-200 text-gray-100" : "cursor-pointer hover:bg-green-300 border-green-500"} text-center px-2 py-1 select-none bg-white rounded-lg border-2  `}
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
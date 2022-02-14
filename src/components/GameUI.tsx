import { useEffect, useRef, useState } from "react"
import { allowedNeighbours, GAME_DURATION, HEIGHT, nodeSelectionRange, NODE_SIZE, scaleFactor, SCORE_HEIGHT, SCORE_WIDTH, WIDTH } from "../modules/const"
import { Line } from "../modules/models"
import { renderLines, renderAgents, renderNodes, renderStations, renderPizzaAnimations, renderProfitTexts, renderCrashed } from "../modules/render"
import Game from "../modules/game"
import { map } from "../etc/math"
import Vector from "../models/vector"
import { Node } from "../models/graph"
import { NeuralNetworkStore } from "./GymUI"

const game = new Game(WIDTH, HEIGHT)
const mouse = {
    x: 0,
    y: 0
}

let drawBg = true
let extendedView = false
let frameTime = {
    i: 0,
    sum: 0
}

const borderGrayAndP = "border-2 border-gray-300"
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
        var rect = canvasRef.current.getBoundingClientRect();
        mouse.x = e.clientX - rect.left
        mouse.y = e.clientY - rect.top
    }

    const onmousedown = () => {
        game.mouseClicked(mouse.x, mouse.y)
    }

    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        const bgImage = new Image();
        bgImage.src = "city1.png"; // can also be a remote URL e.g. http://

        let lastTime
        let frameId
        const frame = time => {
            const timeDelta = time - lastTime
            frameId = requestAnimationFrame(frame)
            if (timeDelta < 1000 / 60) return
            frameTime.i++
            frameTime.sum += timeDelta
            lastTime = time
            game.updateTime(time)

            if (drawBg) {
                context.globalAlpha = 0.05;
                context.drawImage(bgImage, 0, 0, HEIGHT, HEIGHT);
                context.globalAlpha = 1;
            }

            if (extendedView) {
                renderLines(game.roads, context, "#0000FF")
                renderLines(game.intersections, context, "#FF0000", false)
                renderNodes(game.agents.filter(a => a.task && a.task.target).map(a => a.task.target), context, "#00CC00")
            }

            if (game.gameState.stations.length > 0) {
                renderStations(game.gameState.stations, context)
            }

            if (game.gameState.pickingFirstNode) {
                const highlightedNode: Node = game.nodes.find(n => n.pos.copy().mult(scaleFactor).add(new Vector(NODE_SIZE / 2, NODE_SIZE / 2)).dist(new Vector(mouse.x, mouse.y)) < nodeSelectionRange)
                renderNodes(game.nodes.filter(n => n.getNeighbours().length <= allowedNeighbours), context, "rgba(0,200,0,70)", highlightedNode)
            }

            if (game.shop.edgeBuild.active) {
                if (game.shop.edgeBuild.startNode === undefined) {
                    const highlightedNode: Node = game.nodes.find(n => n.pos.copy().add(new Vector(NODE_SIZE / 2, NODE_SIZE / 2)).dist(new Vector(mouse.x, mouse.y)) < nodeSelectionRange)
                    renderNodes(game.nodes.filter(n => n.getNeighbours().length < 4), context, "rgba(0,200,0,70)", highlightedNode)
                }
                renderNodes(game.shop.edgeBuild.validSecondNodes, context, "#00FFFF")
            }


            renderAgents(game.agents, context)

            if (game.gameState.running) {
                renderPizzaAnimations(game.pizzaAnimation, context)
                renderProfitTexts(game.scrollingTexts, context)
                game.step()
            }

            if (extendedView) {
                renderCrashed(game.deathAnimations, context)
            }

            /*             if (game.agents.length > 0) {
                            if (game.agents[0].task !== undefined) {
                                renderLines(game.agents[0].task.borders, context, "#0000FF")
                            }
                        } */
        }

        requestAnimationFrame(frame)
        return () => cancelAnimationFrame(frameId)
    }, [])



    return <div className="flex flex-col">

        <div className="flex flex-row border-2 shadow select-none">
            <div onMouseMove={onmousemove}
                onMouseDown={onmousedown}
                className="p-2"
            >
                <canvas style={{ "border": "1px solid #000000" }} ref={canvasRef} {...props} />
            </div>
            <div className="p-5 flex flex-col gap-2">
                {game.gameState.pickingFirstNode ?
                    <IntroMessage />
                    :
                    <div className="flex flex-col gap-2">
                        <ScoreBoard game={game} />
                        <Store game={game} />
                        <AgentsStats game={game} />
                        {
                            game.gameState.running ? <></>
                                :
                                game.gameState.delivered === 0 ?
                                    <Button
                                        onClick={
                                            () => {
                                                game.gameState.running = true
                                                game.rerender()
                                            }
                                        }>
                                        Start
                                    </Button>
                                    :
                                    <></>
                        }
                        {
                            !game.gameState.running && game.gameState.delivered > 0 ?
                                <Button
                                    onClick={
                                        () => {
                                            game.init()
                                            game.rerender()
                                        }
                                    }>
                                    Restart
                                </Button> :
                                <></>
                        }
                        {frameTime.sum}
                    </div>
                }
            </div>
        </div >
        <NeuralNetworkStore neuralNetworkLocation={game.neuralNet} loadHandler={(key: string) => { game.loadModel(key) }} />
        <Button
            onClick={
                () => {
                    drawBg = !drawBg
                }
            }>
            Toggle draw bg
        </Button> :
    </div>
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
    return <div className={`${disabled ? "cursor-not-allowed bg-gray-200" : "cursor-pointer hover:bg-green-300 border-green-500"} text-center px-2 py-1 select-none bg-white rounded-lg border-2  `}
        onClick={() => {
            if (disabled) return
            onClick()
        }}>
        {children}
    </div>
}

const IntroMessage: React.FC = () => {
    return <Task
        title={"1.) Pick your first station!"}
    >
        <div className="">
            <div>
                As the CEO of AI-Pizza Corp your only goal is to deliver as many pizzas as possible.
            </div>
            <div>
                Don't worry you wont have to deliver them yourself, its the future and self driving Pizza-delivery-agents exist already.
            </div>
            <div className="pt-5 font-bold">
                Start by placing your first station, this is where your agents will spawn.
            </div>
        </div>
    </Task>
}

const ShopeExplanation: React.FC = () => {
    return <Task
        title={"1.) Buy some upgrades and start the game!"}
    >
        <div className="">
            <div>
                There are a few things you can to to maximize your score!
            </div>
            <div>
                1. Buy more delivery agents.
            </div>
            <div>
                2. Remove wall to reduce the agents travel time.
            </div>
            <div>
                3. Enhance the agents speed.
            </div>
        </div>
    </Task>
}

interface UsesGame {
    game: Game
}

export const Store: React.FC<UsesGame> = ({ game }) => {
    const { gameState } = game;
    const { prices } = game.shop;
    return <div className={`shadow rounded-lg bg-gray-100`}>
        <div className="flex flex-col gap-2">
            <div className="text-xl rounded-t-lg font-bold text-center bg-orange-500 text-white py-1">
                Shop
            </div>
            <div className="text-xl bg-white py-1">
                <div className="text-center">
                    {`Budget: ${game.gameState.money}$`}
                </div>
            </div>
            <div className="flex flex-col gap-2 p-2">
                <div className="flex flex-row gap-2">
                    <Button
                        disabled={gameState.money < prices.agent}
                        onClick={() => { game.buyAgent() }}>
                        {`+1 Agent - ${prices.agent}$`}
                    </Button>
                    <Button
                        onClick={() => { game.toggleAutoBuy() }}>
                        {game.gameState.autoBuyAgents ? "auto buy on" : "auto buy off"}
                    </Button>
                </div>
                <Button
                    disabled={gameState.money < prices.addEdge}
                    onClick={() => { game.buyEdge() }}>
                    {`Remove wall - ${prices.addEdge}$`}
                </Button>
                <Button
                    disabled={gameState.money < prices.speed || gameState.speedLevel === 3} // max level atm
                    onClick={() => { game.buySpeed() }}>
                    {`Agent speed ${gameState.speedLevel + 1} - ${gameState.speedLevel === 3 ? 'MAX' : `${prices.speed}$`}`}
                </Button>
            </div>
        </div>
    </div>
}

const ScoreBoard: React.FC<UsesGame> = ({ game }) => {
    return <div className={`shadow rounded-lg bg-gray-100`}>
        <div className="text-xl text-center bg-blue-500 text-white font-bold rounded-t-lg">
            <div className="flex flex-col items-center">
                <div>
                    Delivered
                </div>
            </div>
        </div>
        <div className="flex flex-col items-center border-b border-gray-500">
            <img className="w-12 h-12" id="pizza" src="pizza.png" />
            <div>
                {game.gameState.delivered}
            </div>
        </div>
        <div className="flex flex-col gap-2 items-center p-2">
            <div>
                {`Time left: ${GAME_DURATION - Math.floor((game.currTime - game.startTime) / 1000)}s`}
            </div>
        </div>
    </div>
}


const AgentsStats: React.FC<UsesGame> = ({ game }) => {
    return <div className={borderGrayAndP}>
        <div className="flex flex-row text-center items-center justify-around gap-2">
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
}

export default GameUI;
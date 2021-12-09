import { useEffect, useRef, useState } from "react"
import { allowedNeighbours, HEIGHT, nodeSelectionRange, NODE_SIZE, WIDTH } from "../modules/const"
import { Edge, Node, Vector } from "../modules/models"
import Agent from "../modules/agent"
import { renderLines, renderAgents, renderNodes, renderStations, renderPizzaAnimations, renderProfitTexts } from "../modules/render"
import Game from "../modules/game"

const state = {
    nodes: [] as Node[],
    edges: [] as Edge[],
    nodeMode: true,
    gridCursor: {
        x: 0,
        y: 0,
    },
    res: NODE_SIZE
}

const borderGrayAndP = "border-2 border-gray-300 p-2"
const MapEditor: React.FC = () => {
    const [renderUi, setRenderUi] = useState(0)

    const props = {
        width: WIDTH,
        height: HEIGHT
    }

    const RERENDER = () => {
        setRenderUi(renderUi + 1)
    }

    const canvasRef = useRef(null)

    const onmousemove = (e) => {
        state.gridCursor.x = Math.round((e.clientX - 15) / state.res) * state.res
        state.gridCursor.y = Math.round((e.clientY - 15) / state.res) * state.res
    }

    const onmousedown = () => {
        // game.mouseClicked(mouse.x, mouse.y)
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

            // grid cursor 
            context.beginPath();
            context.arc(state.gridCursor.x, state.gridCursor.y, 5, 0, 2 * Math.PI);
            context.stroke();
            context.fill();

            renderNodes(state.nodes, context, "rgba(0,200,0,0.4)")
            const usedIds = []
            const lines = state.nodes.reduce((acc, n) => { return [...acc, ...n.getLines(usedIds)] }, [])
            renderLines(lines, context, "#000000")
        }

        requestAnimationFrame(frame)
        return () => cancelAnimationFrame(frameId)
    }, [])



    return <div className="flex flex-row border-2 border-black-500 select-none">
        <div onMouseMove={onmousemove}
            onMouseDown={onmousedown}
            className="p-2"
        >
            <canvas style={{ "border": "1px solid #000000" }} ref={canvasRef} {...props} />
        </div>
        <Button
            onClick={
                () => {
                    state.nodeMode = !state.nodeMode
                    RERENDER()
                }
            }>
            {state.nodeMode ? "Node mode on" : "Edge mode on"}
        </Button>
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
    return <div className={`${disabled ? "cursor-not-allowed bg-gray-200" : "cursor-pointer hover:bg-green-300 border-green-500"} text-center px-2 py-1 select-none bg-white rounded-lg border-2  `}
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
    const { prices, gameState } = game;
    return <div className={borderGrayAndP}>
        <div className="flex flex-col gap-2">
            <div className="underline text-center">Shop</div>
            <div className="text-center">
                {`Money: ${game.gameState.money}$`}
            </div>
            <Button
                disabled={gameState.money < prices.agent}
                onClick={() => { game.buyAgent() }}>
                {`+1 Agent - ${prices.agent}$`}
            </Button>
            <Button
                disabled={gameState.money < prices.addEdge}
                onClick={() => { game.buyEdge() }}>
                {`Remove wall - ${prices.addEdge}$`}
            </Button>
            <Button
                disabled={gameState.money < prices.speed || gameState.speedLevel === 3} // max level atm
                onClick={() => { game.buySpeed() }}>
                {`Agent speed - ${gameState.speedLevel === 3 ? 'MAX' : `${prices.speed}$`}`}
            </Button>
        </div>
    </div>
}

const ScoreBoard: React.FC<UsesGame> = ({ game }) => {
    return <div className={`rounded-t-lg border-gray-200 border-2`}>
        <div className="text-xl text-center bg-blue-500 text-white font-bold rounded-t-lg">
            {`Score: ${game.gameState.points}`}
        </div>
        <div className="flex flex-col gap-2 items-center p-2">
            <div>
                {`Time left: ${300 - Math.floor((game.currTime - game.startTime) / 1000)}s`}
            </div>
        </div>
    </div>
}

export default MapEditor;
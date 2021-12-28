import { useEffect, useState } from "react"
import { GAME_DURATION, HEIGHT, WIDTH } from "../modules/const"
import Game from "../modules/game"
import { degToRad, map } from "../etc/math"
import { NeuralNetworkStore } from "./GymUI"
import * as THREE from "three";


const game = new Game(WIDTH, HEIGHT)

const mouse = {
    x: 0,
    y: 0
}

const renderObjects = {
    nodes: [],
    agents: [],
    deathAnimations: []
}

let drawBg = true

const borderGrayAndP = "border-2 border-gray-300"
const GameUI3d: React.FC = () => {
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

    const onmousedown = () => {
        game.mouseClicked(mouse.x, mouse.y)
    }


    useEffect(() => {
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000);
        var renderer = new THREE.WebGLRenderer();
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        renderer.setSize(WIDTH, HEIGHT);
        document.getElementById("renderArea").appendChild(renderer.domElement);
        var geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        var agentGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.3);
        var materialG = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        var materialR = new THREE.MeshStandardMaterial({ color: 0xFF0000 });


        var camera_pivot = new THREE.Object3D()
        camera_pivot.position.set(0, 0, 0)

        const light = new THREE.DirectionalLight(0xffffff, 1, 100); // soft white light
        light.castShadow = true;
        light.position.set(0, 1, 0);
        light.shadow.mapSize.width = 512; // default
        light.shadow.mapSize.height = 512; // default
        light.shadow.camera.near = 0.5; // default
        light.shadow.camera.far = 500; // default

        scene.add(light);

        // camera.position.z = 2
        camera.position.set(-4, 4, 0)
        camera.lookAt(camera_pivot.position);

        const newNode = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 10), new THREE.MeshStandardMaterial({ color: 0xaaaaaa }));
        newNode.position.set(0, -0.55, 0)
        newNode.castShadow = true;
        newNode.receiveShadow = true;
        scene.add(newNode)

        // const helper = new THREE.CameraHelper(light.shadow.camera);
        // scene.add(helper);

        var animate = function () {
            requestAnimationFrame(animate);
            const xyrange = 3

            // check if enough objects exist for nodes
            while (renderObjects.nodes.length < game.nodes.length) {
                const newNode = new THREE.Mesh(geometry, materialG);
                scene.add(newNode)
                newNode.castShadow = true;
                renderObjects.nodes.push(newNode)
            }

            for (let i = 0; i < game.nodes.length; i++) {
                const n = game.nodes[i]
                renderObjects.nodes[i].position.set(map(n.pos.x, 0, WIDTH * 2, -xyrange, xyrange), -0.090, map(n.pos.y, 0, HEIGHT * 2, -xyrange, xyrange))
            }

            // check if enough objects exist for agents
            while (renderObjects.agents.length < game.agents.length) {
                const newNode = new THREE.Mesh(agentGeometry, materialR);
                scene.add(newNode)
                newNode.castShadow = true;
                renderObjects.agents.push(newNode)
            }

            for (let i = 0; i < game.agents.length; i++) {
                const a = game.agents[i]
                renderObjects.agents[i].position.set(map(a.pos.x, 0, WIDTH * 2, -xyrange, xyrange), 0.05, map(a.pos.y, 0, HEIGHT * 2, -xyrange, xyrange))
                renderObjects.agents[i].rotation.y = -degToRad(a.dir.heading() + 90)
            }

            // check if enough objects exist for agents
            while (renderObjects.deathAnimations.length < game.deathAnimations.length) {
                const newNode = new THREE.Mesh(agentGeometry, materialR);
                scene.add(newNode)
                newNode.castShadow = true;
                renderObjects.deathAnimations.push(newNode)
            }

            for (let i = 0; i < game.deathAnimations.length; i++) {
                const a = game.deathAnimations[i]
                renderObjects.deathAnimations[i].position.set(map(a.pos.x, 0, WIDTH * 2, -xyrange, xyrange), a.z, map(a.pos.y, 0, HEIGHT * 2, -xyrange, xyrange))
                renderObjects.deathAnimations[i].rotation.y = -degToRad(a.dir.heading() + 90)
                a.z -= 0.001
            }

            game.deathAnimations = game.deathAnimations.filter(dA => dA.z > -1)

            renderer.render(scene, camera);
            game.step()
        };
        animate();

    }, [])



    return <div className="flex flex-col">

        <div className="flex flex-row border-2 shadow select-none">
            <div id="renderArea"></div>
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
                    </div>
                }
            </div>
        </div >
        <NeuralNetworkStore neuralNetworkLocation={game.neuralNet} />
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

export default GameUI3d;
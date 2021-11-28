import { useEffect, useRef } from "react"
import { NODE_SIZE } from "../modules/const"
import { segmentsMock, segmentsMock1 } from "../modules/data"
import { loadData } from "../modules/models"
import { transformation } from "../modules/transformation"
import search from "../etc/astar"

const Canvas2d: React.FC = () => {
    const props = {
        width: 4000,
        height: 4000
    }
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        // background
        context.fillStyle = '#BBBBBB'
        context.fillRect(0, 0, context.canvas.width, context.canvas.height)

        const segments = loadData(segmentsMock1)
        const { nodes, edges } = transformation(segments)
        //nodes.filter(n => n.id === 0)[0].id = -1

        const start = nodes[100]
        const end = nodes[0]

        const path = search(nodes, start, end)


        const pathIds = path.map(n => n.id)

        nodes.forEach(n => {
            if (pathIds.includes(n.id)) {
                context.fillStyle = "#0000FF"
            } else {
                context.fillStyle = "#AAAAAA"
            }
            context.fillRect(n.pos.x - NODE_SIZE, n.pos.y - NODE_SIZE, NODE_SIZE * 2, NODE_SIZE * 2)
            context.fillStyle = "#000000"
            context.font = "30px Arial";
            context.fillText(n.id, n.pos.x, n.pos.y);
        })

        let lines = []
        nodes.forEach(n => {
            lines = [...lines, ...n.getLines()]
        })
        lines.forEach(l => {
            context.beginPath();
            context.moveTo(l.p1.x, l.p1.y);
            context.lineTo(l.p2.x, l.p2.y);
            context.stroke();
        })
        // let s = '[\n'
        // lines.forEach(l => {
        //     s += `new Line(${l.p1.x},${l.p1.y},${l.p2.x},${l.p2.y}),\n`
        // })
        // s += ']'
    }, [])

    return <canvas ref={canvasRef} {...props} />
}

export default Canvas2d;
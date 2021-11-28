import { useEffect, useRef } from "react"
import { segmentsMock, segmentsMock1 } from "../modules/data"
import { loadData } from "../modules/models"
import { transformation } from "../modules/transformation"

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
        const t = transformation(segments)

        const nodeSize = 15
        t.nodes.forEach(n => {
            context.fillStyle = "#AAAAAA"
            context.fillRect(n.pos.x - nodeSize, n.pos.y - nodeSize, nodeSize * 2, nodeSize * 2)
            context.fillStyle = "#FFFFFF"
            context.font = "30px Arial";
            context.fillText(n.id, n.pos.x, n.pos.y);
        })
        /*         t.edges.forEach(e => {
                    context.beginPath();
                    context.moveTo(e.startNode.pos.x, e.startNode.pos.y);
                    context.lineTo(e.endNode.pos.x, e.endNode.pos.y);
                    context.stroke();
                }) */
        t.nodes.forEach(n => {
            if(n.id === 60){
                console.log(n)
            }
            Object.keys(n.connections).forEach(k => {
                if (n.connections[k] === undefined) return
                context.beginPath();
                context.moveTo(n.pos.x, n.pos.y);
                context.lineTo(n.connections[k].pos.x, n.connections[k].pos.y);
                context.stroke();
            })
        })
    }, [])

    return <canvas ref={canvasRef} {...props} />
}

export default Canvas2d;
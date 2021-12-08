import Agent from "./agent";
import { NODE_SIZE } from "./const";
import { degToRad } from "./math";
import { Node, Line, Vector } from "./models";

export const renderLines = (lines: Line[], context, color) => {
    context.strokeStyle = color
    lines.forEach((l, i) => {
        context.beginPath();
        context.moveTo(l.p1.x, l.p1.y);
        context.lineTo(l.p2.x, l.p2.y);
        context.stroke();
        //context.fillText(i, (l.p1.x + l.p2.x) / 2, (l.p1.y + l.p2.y) / 2);
    })
}

export const renderNodes = (nodes: Node[], context, color: string, highlightedNode: Node) => {
    nodes.forEach(n => {
        if (n === highlightedNode) {
            context.fillStyle = "#00FF00"
        } else {
            context.fillStyle = color
        }
        context.fillRect(n.pos.x - NODE_SIZE, n.pos.y - NODE_SIZE, NODE_SIZE * 2, NODE_SIZE * 2)
    })
}

export const renderStations = (nodes: Node[], context) => {
    nodes.forEach(n => {
        context.fillStyle = "rgb(255,255,0)"
        context.fillRect(n.pos.x - NODE_SIZE, n.pos.y - NODE_SIZE, NODE_SIZE * 2, NODE_SIZE * 2)
        context.fill();
    })
}

export const renderAgents = (agents: Agent[], context) => {
    agents.filter(a => a.alive).forEach(a => {
        context.save()
        if (a.highlighted) {
            context.fillStyle = `rgba(${a.color.r}, ${a.color.g}, ${a.color.b},100)`;
        } else {
            context.fillStyle = `rgba(255,255,255,50)`;
        }
        const s = NODE_SIZE * 0.5
        const aX = a.pos.x
        const aY = a.pos.y
        context.translate(aX, aY)
        context.rotate(degToRad(a.dir.heading()))
        context.fillRect(- (s / 2), - (s / 2), s * 1.5, s)
        context.fillStyle = "#000000"
        context.font = "30px Arial";
        context.restore()
        //context.fillText(n.id, n.pos.x, n.pos.y);
    })
}


export const renderCrashed = (crashed: Agent[], context) => {
    crashed.forEach(a => {
        context.save()
        context.fillStyle = "#FF0000"
        const s = NODE_SIZE * 0.5
        const aX = a.pos.x
        const aY = a.pos.y
        context.translate(aX, aY)
        context.rotate(degToRad(a.dir.heading()))
        context.fillRect(- (s / 2), - (s / 2), s * 1.5, s)
        context.fillStyle = "#000000"
        context.font = "30px Arial";
        context.restore()
        //context.fillText(n.id, n.pos.x, n.pos.y);
    })
}


export const renderIntersections = (intersections: Vector[], context) => {
    intersections.forEach(i => {
        context.fillStyle = "#FF0000"
        context.fillRect(i.x, i.y, 5, 5)
        context.fillStyle = "#000000"
        context.font = "30px Arial";
    })
}
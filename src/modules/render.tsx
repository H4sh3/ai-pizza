import { DespawnAnimation } from "./models";
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

export const renderNodes = (nodes: Node[], context, color: string, highlightedNode: Node | undefined = undefined) => {
    nodes.forEach(n => {
        if (n === highlightedNode) {
            context.fillStyle = "#00FF00"
            context.strokeStyle = "#00FF00"
        } else {
            context.fillStyle = color
            context.strokeStyle = color
        }
        context.beginPath();
        context.arc(n.pos.x, n.pos.y, NODE_SIZE / 2, 0, 2 * Math.PI);
        context.stroke();
        context.fill();
        //context.fillRect(n.pos.x - NODE_SIZE, n.pos.y - NODE_SIZE, NODE_SIZE * 2, NODE_SIZE * 2)
    })
}

export const renderStations = (nodes: Node[], context) => {
    nodes.forEach(n => {
        context.fillStyle = "rgb(255,255,0)"
        context.fillRect(n.pos.x - NODE_SIZE, n.pos.y - NODE_SIZE, NODE_SIZE * 2, NODE_SIZE * 2)
        context.fill();
    })
}

const s = NODE_SIZE * 0.5
export const renderAgents = (agents: Agent[], context) => {
    agents.filter(a => a.alive).forEach(a => {
        context.save()
        if (a.highlighted) {
            context.fillStyle = `rgba(${a.color.r}, ${a.color.g}, ${a.color.b},100)`;
        } else {
            context.fillStyle = `rgba(255,255,255,50)`;
        }
        const aX = a.pos.x
        const aY = a.pos.y
        context.translate(aX, aY)
        context.rotate(degToRad(a.dir.heading()))
        //context.fillRect(- (s / 2), - (s / 2), s * 2, s)
        if (a.routes[0] && !a.routes[0].isEnd) {
            var img = document.getElementById("pizza");
            context.drawImage(img, - (s / 2), - (s / 2), NODE_SIZE, NODE_SIZE);
            // context.drawImage(img, a.pos.x - s, a.pos.y - s, NODE_SIZE, NODE_SIZE);
        }
        context.restore()

    })
}


export const renderPizzaAnimations = (despawns: DespawnAnimation[], context) => {
    despawns.forEach(d => {
        var img = document.getElementById("pizza");
        context.drawImage(img, d.pos.x - s, d.pos.y - s, NODE_SIZE * d.factor, NODE_SIZE * d.factor);
        d.factor -= 0.01
    })
}

export const renderProfitTexts = (despawns: DespawnAnimation[], context) => {
    despawns.forEach(d => {
        context.fillStyle = "#00EE00"
        context.font = "22px Comic Bold";
        context.fillText(`${d.value}$`, d.pos.x, d.pos.y);
        d.pos.y -= 1
        d.factor -= 0.02
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
        context.restore()
    })
}


export const renderIntersections = (intersections: Vector[], context) => {
    intersections.forEach(i => {
        context.fillStyle = "#FF0000"
        context.fillRect(i.x, i.y, 5, 5)
    })
}
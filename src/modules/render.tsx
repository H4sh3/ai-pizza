import { DespawnAnimation, Line, OldNode } from "./models";
import Agent from "./agent";
import { NODE_SIZE, scaleFactor } from "./const";
import { degToRad } from "../etc/math";
import Vector from "../models/vector";
import { Node } from "../models/graph";
import { Intersection, } from "../models/city";
import { isLabeledStatement } from "typescript";
import { DeathAnimation } from "./game";

export const renderLines = (lines: Line[], context, color, withArc: boolean = false) => {
    context.strokeStyle = color
    lines.forEach((l, i) => {
        context.beginPath();
        context.moveTo(l.p1.x * scaleFactor, l.p1.y * scaleFactor);
        context.lineTo(l.p2.x * scaleFactor, l.p2.y * scaleFactor);
        if (withArc) {
            context.arc(l.p2.x, l.p2.y, 5, 0, 2 * Math.PI);
        }
        context.stroke();

        context.fillStyle = "#000000"
        context.font = "22px Comic Bold";
        //context.fillText(i, (l.p1.x + l.p2.x) / 2, (l.p1.y + l.p2.y) / 2);
    })
}

export const renderTurns = (intersections, context, color) => {
    context.strokeStyle = color

    const turns = intersections.reduce((acc, i) => {
        return acc.concat(i.turns)
    }, [])
    turns.forEach((t, i) => {
        const l = t.line
        context.beginPath();
        context.moveTo(l.p1.x * scaleFactor, l.p1.y * scaleFactor);
        context.lineTo(l.p2.x * scaleFactor, l.p2.y * scaleFactor);

        context.stroke();

        context.fillStyle = "#000000"
        context.font = "22px Comic Bold";
        //context.fillText(i, (l.p1.x + l.p2.x) / 2, (l.p1.y + l.p2.y) / 2);
    })
}

export const renderNodes = (nodes: Node[] | OldNode[], context, color: string, highlightedNode: Node | OldNode | undefined = undefined) => {
    nodes.forEach((n, i) => {
        if (n === highlightedNode) {
            context.fillStyle = "#00FF00"
            context.strokeStyle = "#00FF00"
        } else {
            context.fillStyle = color
            context.strokeStyle = color
        }
        context.beginPath();
        context.arc(n.pos.x * scaleFactor, n.pos.y * scaleFactor, NODE_SIZE / 2, 0, 2 * Math.PI);
        context.stroke();
        context.fill();


        context.fillStyle = "#000000"
        context.strokeStyle = "#000000"
        context.font = "22px Comic Bold";
        // context.fillText(i, n.pos.x, n.pos.y);
    })
}


export const renderIntersections = (intersections: Intersection[], context, color: string, highlightedNode: Node | OldNode | undefined = undefined) => {
    intersections.forEach((n, i) => {

        context.fillStyle = color
        context.strokeStyle = color

        context.beginPath();
        context.arc(n.node.pos.x * scaleFactor, n.node.pos.y * scaleFactor, NODE_SIZE / 2, 0, 2 * Math.PI);
        context.stroke();
        context.fill();
    })
}

export const renderPoint = (v: Vector, context, color: string) => {
    context.fillStyle = color
    context.strokeStyle = color
    context.beginPath();
    context.arc(v.x, v.y, NODE_SIZE / 5, 0, 2 * Math.PI);
    context.stroke();
    context.fill();
}


export const renderStations = (nodes: Node[], context) => {
    const size = NODE_SIZE * 2.5 * scaleFactor
    nodes.forEach(n => {
        context.fillStyle = "rgb(255,255,0)"
        context.strokeStyle = "rgb(255,255,0)"
        //context.fillRect((n.pos.x * scaleFactor) - (size * .5), (n.pos.y * scaleFactor) - (size * .5), size, size)

        context.beginPath();
        context.arc(n.pos.x * scaleFactor, n.pos.y * scaleFactor, size, 0, 2 * Math.PI)
        context.stroke();
        context.fill();
    })
}

const agentSize = NODE_SIZE * scaleFactor



export const renderText = (v, x, y, context, color) => {
    context.fillStyle = color
    context.font = "22px Comic Bold";
    context.fillText(v, x, y);
}


export const renderPizzaAnimations = (despawns: DespawnAnimation[], context) => {
    despawns.forEach(d => {
        var img = document.getElementById("pizza");
        context.drawImage(img, (d.pos.x * scaleFactor) - agentSize, (d.pos.y * scaleFactor) - agentSize, NODE_SIZE * d.factor, NODE_SIZE * d.factor);
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

export const renderAgents = (agents: Agent[], context) => {
    agents.filter(a => a.alive).forEach(a => {
        context.save()
        if (a.highlighted) {
            context.fillStyle = `rgba(255,0,0,100)`;
        } else {
            context.fillStyle = `rgba(255,255,255,50)`;
        }
        const aX = a.pos.x
        const aY = a.pos.y
        context.translate(aX * scaleFactor, aY * scaleFactor)
        context.rotate(degToRad(a.dir.heading()))
        context.fillRect(-agentSize, -agentSize / 2, agentSize * 2, agentSize)
        context.restore()
    })
}

export const renderCrashed = (crashed: DeathAnimation[], context) => {
    crashed.forEach(a => {
        context.save()
        context.fillStyle = "#FF0000"
        const aX = a.pos.x
        const aY = a.pos.y
        context.translate(aX * scaleFactor, aY * scaleFactor)
        context.rotate(degToRad(a.dir.heading()))
        context.fillRect(-agentSize, -agentSize / 2, agentSize * 2, agentSize)
        context.restore()
    })
}
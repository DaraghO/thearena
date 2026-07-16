// render.js
// All drawing. No Firestore. game.js calls these.

/* ---------- RIG REGISTRY ----------
   Add a card: write a rig fn, register by id. Rig returns an SVG <g>,
   local box 100 wide, feet at y=118. States: pose walk attack die idle. */

function knightRig(team, state){
    return `
    <g class="rig knight team-${team} state-${state}">
        <ellipse class="shadow" cx="50" cy="116" rx="27" ry="7"/>
        <g class="legs">
            <rect class="leg leg-l" x="34" y="78" width="12" height="34" rx="5"/>
            <rect class="leg leg-r" x="54" y="78" width="12" height="34" rx="5"/>
        </g>
        <g class="body">
            <g class="arm arm-l"><rect class="limb" x="20" y="50" width="11" height="30" rx="5"/></g>
            <rect class="torso" x="30" y="46" width="40" height="40" rx="10"/>
            <polygon class="emblem" points="50,54 58,66 50,78 42,66"/>
            <g class="arm arm-r">
                <rect class="limb" x="68" y="50" width="11" height="30" rx="5"/>
                <g class="sword">
                    <rect class="blade" x="70" y="8" width="7" height="44" rx="3"/>
                    <rect class="guard" x="64" y="48" width="19" height="6" rx="3"/>
                </g>
            </g>
            <g class="head">
                <rect class="helmet" x="36" y="18" width="28" height="30" rx="11"/>
                <rect class="visor" x="40" y="32" width="20" height="6" rx="3"/>
                <rect class="plume" x="47" y="8" width="6" height="13" rx="3"/>
            </g>
        </g>
    </g>`;
}

function fallbackRig(team, state){
    return `
    <g class="rig pawn team-${team} state-${state}">
        <ellipse class="shadow" cx="50" cy="116" rx="24" ry="6"/>
        <g class="body">
            <rect class="torso" x="30" y="52" width="40" height="46" rx="14"/>
            <circle class="helmet" cx="50" cy="38" r="18"/>
            <text class="pawn-q" x="50" y="45" text-anchor="middle">?</text>
        </g>
    </g>`;
}

const RIGS = { knight: knightRig };

function rigMarkup(cardId, team, state){
    return (RIGS[cardId] || fallbackRig)(team, state);
}

/* ---------- BOARD GEOMETRY ---------- */
const LANE_X = { lane1:110, lane2:200, lane3:290 };
const Y_NEAR = 440, Y_FAR = 180;
const TOWER_MAX = { king:3000, other:1000 };

// x is the canonical lane coord (0 = player1 tower, 1 = player2 tower).
// Each client shows itself at the bottom, so player2 flips the axis.
function displayX(x, self){ return self === "player1" ? x : 1 - x; }

function placedTroop(troop, self){
    const dx = displayX(troop.x, self);
    const y = Y_NEAR - (Y_NEAR - Y_FAR) * dx;
    const scale = 0.5 + 0.22 * (1 - dx);
    const team = troop.owner === self ? "you" : "enemy";
    const px = LANE_X[troop.lane] - 50 * scale;
    const py = y - 118 * scale;
    return `<g transform="translate(${px.toFixed(1)},${py.toFixed(1)}) scale(${scale.toFixed(3)})">${rigMarkup(troop.cardId, team, troop.state)}</g>`;
}

function hpColor(r){ return r > 0.5 ? "#5cd08a" : r > 0.25 ? "#ffc23c" : "#ef5a3c"; }

function tower(cx, baseY, w, h, team, king, ratio){
    const x = cx - w/2, y = baseY - h;
    const dx = w*0.24, dy = h*0.26;
    const front = `${x},${y} ${x+w},${y} ${x+w},${baseY} ${x},${baseY}`;
    const top   = `${x},${y} ${x+w},${y} ${x+w+dx},${y-dy} ${x+dx},${y-dy}`;
    const side  = `${x+w},${y} ${x+w+dx},${y-dy} ${x+w+dx},${baseY-dy} ${x+w},${baseY}`;
    const base = `var(--${team})`, light = `var(--${team}-light)`, dark = `var(--${team}-dark)`;
    let crenel = "";
    if(king){
        const cw = w/5;
        for(let i=0;i<3;i++){
            const bx = x + dx + i*2*cw + cw*0.4;
            crenel += `<polygon points="${bx},${y-dy} ${bx+cw},${y-dy} ${bx+cw+dx*0.5},${y-dy-dy*0.5} ${bx+dx*0.5},${y-dy-dy*0.5}" fill="${light}" stroke="var(--ink)" stroke-width="2"/>`;
        }
    }
    const r = Math.max(0, Math.min(1, ratio));
    const bw = w+dx, bx = x, by = y-dy-12;
    const hp = `<rect x="${bx}" y="${by}" width="${bw}" height="5" rx="2.5" fill="#00000055"/>
                <rect x="${bx}" y="${by}" width="${(bw*r).toFixed(1)}" height="5" rx="2.5" fill="${hpColor(r)}"/>`;
    return `<g class="tower">
        <polygon points="${side}" fill="${dark}" stroke="var(--ink)" stroke-width="2.5"/>
        <polygon points="${top}" fill="${light}" stroke="var(--ink)" stroke-width="2.5"/>
        <polygon points="${front}" fill="${base}" stroke="var(--ink)" stroke-width="2.5"/>
        ${crenel}${hp}</g>`;
}

// bottom row = self, top row = opponent
export function renderBoard(towers, troops, self){
    const board = document.getElementById("board");
    if(!board) return;
    const opp = self === "player1" ? "player2" : "player1";
    const me = towers[self], you = towers[opp];

    const field = `
        <polygon points="60,70 340,70 380,520 20,520" fill="var(--sand)" stroke="var(--rim)" stroke-width="4"/>
        <polygon points="60,70 340,70 380,520 20,520" fill="none" stroke="var(--sand-edge)" stroke-width="2" opacity=".6"/>`;
    const lanes = `
        <line x1="153" y1="70" x2="140" y2="520" stroke="var(--sand-line)" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>
        <line x1="247" y1="70" x2="260" y2="520" stroke="var(--sand-line)" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>
        <line x1="20" y1="295" x2="380" y2="295" stroke="var(--sand-line)" stroke-width="2" opacity=".4"/>`;

    const enemyTowers =
        tower(200, 96, 44, 34, "enemy", true,  you.king  / TOWER_MAX.king) +
        tower(110,150, 40, 30, "enemy", false, you.left  / TOWER_MAX.other) +
        tower(200,150, 40, 30, "enemy", false, you.middle/ TOWER_MAX.other) +
        tower(290,150, 40, 30, "enemy", false, you.right / TOWER_MAX.other);
    const youTowers =
        tower(105,470, 50, 38, "you", false, me.left  / TOWER_MAX.other) +
        tower(200,470, 50, 38, "you", false, me.middle/ TOWER_MAX.other) +
        tower(295,470, 50, 38, "you", false, me.right / TOWER_MAX.other) +
        tower(200,516, 56, 44, "you", true,  me.king  / TOWER_MAX.king);

    const troopMarkup = troops.map(t => placedTroop(t, self)).join("");
    board.innerHTML = field + lanes + enemyTowers + youTowers + troopMarkup;
}

export function drawTopbar(game, self){
    const opp = self === "player1" ? "player2" : "player1";
    const yg = document.getElementById("youGold");
    const og = document.getElementById("oppGold");
    const mi = document.getElementById("matchInfo");
    if(yg) yg.textContent = game[self].gold;
    if(og) og.textContent = game[opp].gold;
    if(mi) mi.textContent = "Turn " + game.turn;
}

export function drawHand(room, self, onSelect){
    const g = room.game;
    const wrap = document.getElementById("cards");
    if(!wrap) return;
    const hand = g[self].hand || [];
    const chosen = g[self].selectedCard;
    wrap.innerHTML = "";
    hand.forEach((card, i) => {
        const el = document.createElement("button");
        el.className = "game-card" + (chosen === card.id ? " selected" : "");
        el.innerHTML = `
            <span class="cost"><span class="coin"></span>${card.cost}</span>
            <span class="rarity ${card.rarity}"></span>
            <svg class="portrait" viewBox="0 0 100 120">${rigMarkup(card.id,"you","pose")}</svg>
            <span class="cname">${card.name}</span>`;
        el.onclick = () => onSelect(card.id, i);
        wrap.appendChild(el);
    });
}

export function setSelectedLane(lane){
    document.querySelectorAll(".lane-btn").forEach(b =>
        b.classList.toggle("selected", b.dataset.lane === lane));
}

export function setPhaseTag(text){
    const el = document.getElementById("phaseTag");
    if(el) el.textContent = text;
}

export function setPhaseTime(n){
    const el = document.getElementById("phaseTime");
    if(el) el.textContent = n;
}

export function showResult(youWon){
    const el = document.getElementById("result");
    if(!el) return;
    el.querySelector(".result-text").textContent = youWon ? "Victory" : "Defeat";
    el.classList.toggle("win", youWon);
    el.classList.remove("hidden");
}
export function hideResult(){
    const el = document.getElementById("result");
    if(el) el.classList.add("hidden");
}

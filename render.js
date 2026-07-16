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

function displayX(x, self){ return self === "player1" ? x : 1 - x; }
function clamp01(v){ return Math.max(0, Math.min(1, v)); }
function hpColor(r){ return r > 0.5 ? "#5cd08a" : r > 0.25 ? "#ffc23c" : "#ef5a3c"; }

function placeTroop(lane, x, self){
    const dx = displayX(x, self);
    const y = Y_NEAR - (Y_NEAR - Y_FAR) * dx;
    const sc = 0.5 + 0.22 * (1 - dx);
    return { tx: LANE_X[lane] - 50*sc, ty: y - 118*sc, sc };
}

const HP_W = 36, HP_X = 32, HP_Y = -4, HP_H = 5;
function troopHpBar(ratio){
    const r = clamp01(ratio == null ? 1 : ratio);
    return `<rect x="${HP_X}" y="${HP_Y}" width="${HP_W}" height="${HP_H}" rx="2.5" fill="#00000066"/>
            <rect class="hpfill" x="${HP_X}" y="${HP_Y}" width="${(HP_W*r).toFixed(1)}" height="${HP_H}" rx="2.5" fill="${hpColor(r)}"/>`;
}
function updateHp(el, ratio){
    const f = el.querySelector(".hpfill");
    if(!f) return;
    const r = clamp01(ratio == null ? 1 : ratio);
    f.setAttribute("width", (HP_W*r).toFixed(1));
    f.setAttribute("fill", hpColor(r));
}

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
    const r = clamp01(ratio);
    const bw = w+dx, bx = x, by = y-dy-12;
    const hp = `<rect x="${bx}" y="${by}" width="${bw}" height="5" rx="2.5" fill="#00000055"/>
                <rect x="${bx}" y="${by}" width="${(bw*r).toFixed(1)}" height="5" rx="2.5" fill="${hpColor(r)}"/>`;
    return `<g class="tower">
        <polygon points="${side}" fill="${dark}" stroke="var(--ink)" stroke-width="2.5"/>
        <polygon points="${top}" fill="${light}" stroke="var(--ink)" stroke-width="2.5"/>
        <polygon points="${front}" fill="${base}" stroke="var(--ink)" stroke-width="2.5"/>
        ${crenel}${hp}</g>`;
}

const FIELD = `
    <polygon points="60,70 340,70 380,520 20,520" fill="var(--sand)" stroke="var(--rim)" stroke-width="4"/>
    <polygon points="60,70 340,70 380,520 20,520" fill="none" stroke="var(--sand-edge)" stroke-width="2" opacity=".6"/>`;
const LANES = `
    <g class="lane-select-layer">
        <polygon
            class="lane-select"
            data-lane="lane1"
            points="60,70 153,70 140,520 20,520"
        />

        <polygon
            class="lane-select"
            data-lane="lane2"
            points="153,70 247,70 260,520 140,520"
        />

        <polygon
            class="lane-select"
            data-lane="lane3"
            points="247,70 340,70 380,520 260,520"
        />
    </g>

    <line x1="153" y1="70" x2="140" y2="520"
          stroke="var(--sand-line)" stroke-width="3"
          stroke-dasharray="2 10" stroke-linecap="round"
          pointer-events="none"/>

    <line x1="247" y1="70" x2="260" y2="520"
          stroke="var(--sand-line)" stroke-width="3"
          stroke-dasharray="2 10" stroke-linecap="round"
          pointer-events="none"/>

    <line x1="20" y1="295" x2="380" y2="295"
          stroke="var(--sand-line)" stroke-width="2"
          opacity=".4" pointer-events="none"/>
`;

function towersMarkup(towers, self){
    const opp = self === "player1" ? "player2" : "player1";
    const me = towers[self], you = towers[opp];
    return (
        tower(200, 96, 44, 34, "enemy", true,  you.king  / TOWER_MAX.king) +
        tower(110,150, 40, 30, "enemy", false, you.left  / TOWER_MAX.other) +
        tower(200,150, 40, 30, "enemy", false, you.middle/ TOWER_MAX.other) +
        tower(290,150, 40, 30, "enemy", false, you.right / TOWER_MAX.other) +
        tower(105,470, 50, 38, "you", false, me.left  / TOWER_MAX.other) +
        tower(200,470, 50, 38, "you", false, me.middle/ TOWER_MAX.other) +
        tower(295,470, 50, 38, "you", false, me.right / TOWER_MAX.other) +
        tower(200,516, 56, 44, "you", true,  me.king  / TOWER_MAX.king)
    );
}

function placedTroop(troop, self){
    const team = troop.owner === self ? "you" : "enemy";
    const { tx, ty, sc } = placeTroop(troop.lane, troop.x, self);
    const hp = troop.hpRatio != null ? troopHpBar(troop.hpRatio) : "";
    return `<g transform="translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${sc.toFixed(3)})">${rigMarkup(troop.cardId, team, troop.state)}${hp}</g>`;
}

// STATIC full redraw: selection and ended (troops don't move, so this is fine)
export function renderBoard(towers, troops, self){
    const board = document.getElementById("board");
    if(!board) return;
    board.innerHTML = FIELD + LANES + towersMarkup(towers, self)
        + troops.map(t => placedTroop(t, self)).join("");
}

/* ---------- LIVE BATTLE RENDER ----------
   Build each troop once, then update transform + state + hp per frame.
   This is what lets the CSS walk/attack animations actually play. */
let scene = null;

export function initBattle(self){
    const board = document.getElementById("board");
    if(!board) return;
    board.innerHTML = FIELD + LANES + `<g class="tower-layer"></g><g class="troop-layer"></g>`;
    scene = { els:new Map(), towersKey:"" };
}

export function drawBattleFrame(a, b, t, self){
    if(!scene) return;
    const board = document.getElementById("board");
    if(!board) return;

    const key = JSON.stringify(a.towers);
    if(key !== scene.towersKey){
        board.querySelector(".tower-layer").innerHTML = towersMarkup(a.towers, self);
        scene.towersKey = key;
    }

    const layer = board.querySelector(".troop-layer");
    const bMap = {};
    if(b) b.troops.forEach(tr => bMap[tr.id] = tr);

    const seen = new Set();
    a.troops.forEach(tr => {
        seen.add(tr.id);
        const nb = bMap[tr.id];
        const x = nb ? tr.x + (nb.x - tr.x) * t : tr.x;
        const team = tr.owner === self ? "you" : "enemy";

        let el = scene.els.get(tr.id);
        if(!el){
            layer.insertAdjacentHTML("beforeend",
                `<g data-tid="${tr.id}">${rigMarkup(tr.cardId, team, tr.state)}${troopHpBar(tr.hpRatio)}</g>`);
            el = layer.querySelector(`[data-tid="${tr.id}"]`);
            scene.els.set(tr.id, el);
            el.dataset.state = tr.state;
        }
        if(el.dataset.state !== tr.state){
            const rig = el.querySelector(".rig");
            if(rig){
                rig.classList.remove("state-walk","state-attack","state-die","state-idle","state-pose");
                rig.classList.add("state-" + tr.state);
            }
            el.dataset.state = tr.state;
        }
        const { tx, ty, sc } = placeTroop(tr.lane, x, self);
        el.setAttribute("transform", `translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${sc.toFixed(3)})`);
        updateHp(el, tr.hpRatio);
    });

    for(const [id, el] of scene.els){
        if(!seen.has(id)){ el.remove(); scene.els.delete(id); }
    }
}

export function resetBattle(){ scene = null; }

export function setMatchTime(seconds)
{
    const el = document.getElementById("matchClock");

    if(!el)
        return;

    const safeSeconds = Math.max(0, Math.ceil(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    el.textContent =
        minutes + ":" + remainingSeconds.toString().padStart(2, "0");

    el.classList.toggle("urgent", safeSeconds <= 30 && safeSeconds > 0);
}

/* ---------- TOPBAR / HAND / STATUS ---------- */
export function drawTopbar(game, self){
    const yg = document.getElementById("youGold");
    const mi = document.getElementById("matchInfo");

    if(yg)
        yg.textContent = game[self].gold;

    if(mi)
        mi.textContent = "Turn " + game.turn;
}

export function drawHand(room, self, onSelect){
    const g = room.game;
    const wrap = document.getElementById("cards");
    if(!wrap) return;
    const hand = g[self].hand || [];
    const chosen = g[self].selectedIndex;
    wrap.innerHTML = "";
    hand.forEach((card, i) => {
        const el = document.createElement("button");
        el.className =
    "game-card rarity-" + card.rarity +
    (chosen === i ? " selected" : "");
        el.innerHTML = `
            <span class="cost"><span class="coin"></span>${card.cost}</span>
            <span class="rarity ${card.rarity}"></span>
            <svg class="portrait" viewBox="0 0 100 120">${rigMarkup(card.id,"you","pose")}</svg>
            <span class="cname">${card.name}</span>`;
        el.onclick = () => onSelect(i);
        wrap.appendChild(el);
    });
}

export function setSelectedLane(lane){
    document.querySelectorAll(".lane-select").forEach(el => {
        el.classList.toggle("selected", el.dataset.lane === lane);
    });
}

export function setPhaseTag(text, kind){
    const el = document.getElementById("phaseTag");
    if(!el) return;
    el.textContent = text;
    el.classList.remove("phase-rest","phase-battle","phase-over");
    if(kind) el.classList.add("phase-" + kind);
}

export function setPhaseTime(n){
    const el = document.getElementById("phaseTime");
    if(el) el.textContent = n;
    const ring = document.querySelector(".timer-ring");
    if(ring) ring.classList.toggle("urgent", n <= 2 && n > 0);
}

export function setTrayLocked(locked){
    const tray = document.querySelector(".tray");
    if(tray) tray.classList.toggle("locked", locked);
}

export function showBanner(text, kind){
    const el = document.getElementById("phaseBanner");
    if(!el) return;
    el.querySelector("span").textContent = text;
    el.className = "";
    void el.offsetWidth;            // reflow so the animation restarts
    el.classList.add("show", kind);
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = "hidden"; }, 1700);
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

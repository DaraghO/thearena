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

function tower(
    cx,
    baseY,
    team,
    king,
    currentHp,
    maxHp,
    towerId,
    damage = 0
){
    const ratio = clamp01(currentHp / maxHp);

    const scale = king ? 1.12 : 1;
    const width = king ? 58 : 50;
    const height = king ? 72 : 62;

    const x = cx - width / 2;
    const y = baseY - height;

    const teamClass =
        team === "you"
            ? "tower-you"
            : "tower-enemy";

    const stateClasses = [];

    if(damage > 0)
        stateClasses.push("tower-hit");

    if(currentHp > 0 && ratio <= 0.3)
        stateClasses.push("tower-critical");

    if(currentHp <= 0)
        stateClasses.push("tower-destroyed");

    const hpWidth = king ? 78 : 66;
    const hpX = cx - hpWidth / 2;
    const hpY = y - 18;

    const bannerColor =
        team === "you"
            ? "var(--you)"
            : "var(--enemy)";

    const bannerDark =
        team === "you"
            ? "var(--you-dark)"
            : "var(--enemy-dark)";

    const label =
        king
            ? `${currentHp} / ${maxHp}`
            : `${currentHp}`;

    const crown = king
        ? `
            <path
                class="tower-crown"
                d="
                    M ${cx - 20} ${y - 13}
                    L ${cx - 11} ${y - 5}
                    L ${cx - 5} ${y - 18}
                    L ${cx} ${y - 5}
                    L ${cx + 7} ${y - 18}
                    L ${cx + 12} ${y - 5}
                    L ${cx + 20} ${y - 13}
                    L ${cx + 16} ${y + 1}
                    L ${cx - 16} ${y + 1}
                    Z
                "
            />
        `
        : "";

    const smoke = `
        <g class="tower-smoke">
            <circle cx="${cx - 4}" cy="${y + 12}" r="5"/>
            <circle cx="${cx + 2}" cy="${y + 5}" r="7"/>
            <circle cx="${cx + 7}" cy="${y - 3}" r="6"/>
        </g>
    `;

    const debris = `
        <g class="tower-debris">
            <rect
                x="${cx - 4}"
                y="${baseY - 25}"
                width="7"
                height="7"
                style="--dx:-24px;--dy:-34px;--rot:-130deg"
            />

            <rect
                x="${cx + 2}"
                y="${baseY - 20}"
                width="8"
                height="6"
                style="--dx:27px;--dy:-29px;--rot:155deg"
            />

            <rect
                x="${cx - 1}"
                y="${baseY - 34}"
                width="6"
                height="8"
                style="--dx:8px;--dy:-44px;--rot:210deg"
            />

            <rect
                x="${cx - 9}"
                y="${baseY - 17}"
                width="6"
                height="6"
                style="--dx:-31px;--dy:-20px;--rot:-190deg"
            />

            <rect
                x="${cx + 8}"
                y="${baseY - 31}"
                width="6"
                height="7"
                style="--dx:32px;--dy:-38px;--rot:120deg"
            />
        </g>
    `;

    return `
        <g
            class="
                arena-tower
                ${teamClass}
                ${king ? "king-tower" : "lane-tower"}
                ${stateClasses.join(" ")}
            "
            data-tower-id="${towerId}"
            data-hp="${currentHp}"
            transform="translate(${cx} ${baseY}) scale(${scale}) translate(${-cx} ${-baseY})"
        >
            <g class="tower-shake">
                <ellipse
                    class="tower-shadow"
                    cx="${cx}"
                    cy="${baseY + 3}"
                    rx="${width * 0.57}"
                    ry="7"
                />

                <rect
                    class="tower-base"
                    x="${x + 3}"
                    y="${baseY - 17}"
                    width="${width - 6}"
                    height="20"
                    rx="5"
                />

                <path
                    class="tower-body"
                    d="
                        M ${x + 8} ${y + 17}
                        L ${x + width - 8} ${y + 17}
                        L ${x + width - 3} ${baseY - 14}
                        L ${x + 3} ${baseY - 14}
                        Z
                    "
                />

                <path
                    class="tower-highlight"
                    d="
                        M ${cx - 2} ${y + 20}
                        L ${cx + 4} ${y + 20}
                        L ${cx + 8} ${baseY - 17}
                        L ${cx + 1} ${baseY - 17}
                        Z
                    "
                />

                <path
                    class="tower-banner"
                    style="
                        --banner:${bannerColor};
                        --banner-dark:${bannerDark};
                    "
                    d="
                        M ${cx - 10} ${y + 27}
                        L ${cx + 10} ${y + 27}
                        L ${cx + 10} ${y + 49}
                        L ${cx} ${y + 57}
                        L ${cx - 10} ${y + 49}
                        Z
                    "
                />

                <rect
                    class="tower-top"
                    x="${x + 3}"
                    y="${y + 7}"
                    width="${width - 6}"
                    height="20"
                    rx="4"
                />

                <rect
                    class="tower-crenel"
                    x="${x + 5}"
                    y="${y - 2}"
                    width="10"
                    height="13"
                    rx="2"
                />

                <rect
                    class="tower-crenel"
                    x="${cx - 5}"
                    y="${y - 2}"
                    width="10"
                    height="13"
                    rx="2"
                />

                <rect
                    class="tower-crenel"
                    x="${x + width - 15}"
                    y="${y - 2}"
                    width="10"
                    height="13"
                    rx="2"
                />

                ${crown}
                ${smoke}

                <g class="tower-impact">
                    <circle
                        cx="${cx}"
                        cy="${y + height * 0.48}"
                        r="${width * 0.43}"
                    />
                </g>

                <text
                    class="tower-damage"
                    x="${cx}"
                    y="${y + 14}"
                    text-anchor="middle"
                >-${damage}</text>

                ${debris}
            </g>

            <g class="tower-health">
                <text
                    class="tower-health-label"
                    x="${cx}"
                    y="${hpY - 4}"
                    text-anchor="middle"
                >${label}</text>

                <rect
                    class="tower-health-track"
                    x="${hpX}"
                    y="${hpY}"
                    width="${hpWidth}"
                    height="8"
                    rx="4"
                />

                <rect
                    class="tower-health-fill"
                    x="${hpX}"
                    y="${hpY}"
                    width="${(hpWidth * ratio).toFixed(2)}"
                    height="8"
                    rx="4"
                />
            </g>

            <g class="tower-ruins">
                <ellipse
                    cx="${cx}"
                    cy="${baseY - 1}"
                    rx="${width * 0.45}"
                    ry="7"
                />

                <circle cx="${cx - 14}" cy="${baseY - 6}" r="7"/>
                <circle cx="${cx - 3}" cy="${baseY - 3}" r="9"/>
                <circle cx="${cx + 10}" cy="${baseY - 7}" r="8"/>
            </g>
        </g>
    `;
}

const FIELD = `
    <defs>
        <linearGradient
            id="towerBaseGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
        >
            <stop
                offset="0%"
                stop-color="#4c5a72"
            />

            <stop
                offset="100%"
                stop-color="#263146"
            />
        </linearGradient>
    </defs>

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

function towersMarkup(
    towers,
    self,
    previousTowers = null
){
    const opponent =
        self === "player1"
            ? "player2"
            : "player1";

    const mine = towers[self];
    const theirs = towers[opponent];

    const previousMine =
        previousTowers?.[self] || mine;

    const previousTheirs =
        previousTowers?.[opponent] || theirs;

    function damage(previous, current){
        return Math.max(
            0,
            (previous ?? current) - current
        );
    }

    return (
        tower(
            200,
            103,
            "enemy",
            true,
            theirs.king,
            TOWER_MAX.king,
            "enemy-king",
            damage(
                previousTheirs.king,
                theirs.king
            )
        ) +

        tower(
            110,
            160,
            "enemy",
            false,
            theirs.left,
            TOWER_MAX.other,
            "enemy-left",
            damage(
                previousTheirs.left,
                theirs.left
            )
        ) +

        tower(
            200,
            160,
            "enemy",
            false,
            theirs.middle,
            TOWER_MAX.other,
            "enemy-middle",
            damage(
                previousTheirs.middle,
                theirs.middle
            )
        ) +

        tower(
            290,
            160,
            "enemy",
            false,
            theirs.right,
            TOWER_MAX.other,
            "enemy-right",
            damage(
                previousTheirs.right,
                theirs.right
            )
        ) +

        tower(
            105,
            472,
            "you",
            false,
            mine.left,
            TOWER_MAX.other,
            "you-left",
            damage(
                previousMine.left,
                mine.left
            )
        ) +

        tower(
            200,
            472,
            "you",
            false,
            mine.middle,
            TOWER_MAX.other,
            "you-middle",
            damage(
                previousMine.middle,
                mine.middle
            )
        ) +

        tower(
            295,
            472,
            "you",
            false,
            mine.right,
            TOWER_MAX.other,
            "you-right",
            damage(
                previousMine.right,
                mine.right
            )
        ) +

        tower(
            200,
            527,
            "you",
            true,
            mine.king,
            TOWER_MAX.king,
            "you-king",
            damage(
                previousMine.king,
                mine.king
            )
        )
    );
}

function placedTroop(troop, self){
    const team = troop.owner === self ? "you" : "enemy";
    const { tx, ty, sc } = placeTroop(troop.lane, troop.x, self);
    const hp = troop.hpRatio != null ? troopHpBar(troop.hpRatio) : "";
    return `<g transform="translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${sc.toFixed(3)})">${rigMarkup(troop.cardId, team, troop.state)}${hp}</g>`;
}

// STATIC full redraw: selection and ended (troops don't move, so this is fine)
let staticPreviousTowers = null;

export function renderBoard(towers, troops, self){
    const board =
        document.getElementById("board");

    if(!board)
        return;

    board.innerHTML =
        FIELD +
        LANES +
        towersMarkup(
            towers,
            self,
            staticPreviousTowers
        ) +
        troops
            .map(t => placedTroop(t, self))
            .join("");

    staticPreviousTowers =
        structuredClone(towers);
}

/* ---------- LIVE BATTLE RENDER ----------
   Build each troop once, then update transform + state + hp per frame.
   This is what lets the CSS walk/attack animations actually play. */
let scene = null;

export function initBattle(self){
    const board =
        document.getElementById("board");

    if(!board)
        return;

    board.innerHTML =
        FIELD +
        LANES +
        `
            <g class="tower-layer"></g>
            <g class="troop-layer"></g>
        `;

    scene = {
        els: new Map(),
        towersKey: "",
        previousTowers: null
    };
}

export function drawBattleFrame(a, b, t, self){
    if(!scene) return;
    const board = document.getElementById("board");
    if(!board) return;

    const key =
    JSON.stringify(a.towers);

if(key !== scene.towersKey){
    const towerLayer =
        board.querySelector(".tower-layer");

    towerLayer.innerHTML =
        towersMarkup(
            a.towers,
            self,
            scene.previousTowers
        );

    scene.previousTowers =
        structuredClone(a.towers);

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

let previousGold = null;

/* ---------- TOPBAR / HAND / STATUS ---------- */
export function drawTopbar(game, self){
    const goldElement = document.getElementById("youGold");
    const goldChip = document.getElementById("playerGoldChip");
    const goldChange = document.getElementById("goldChange");
    const matchInfo = document.getElementById("matchInfo");

    const currentGold = game[self].gold;

    if(goldElement)
        goldElement.textContent = currentGold;

    if(
        previousGold !== null &&
        currentGold !== previousGold &&
        goldChip &&
        goldChange
    ){
        const difference = currentGold - previousGold;
        const gained = difference > 0;

        goldChip.classList.remove("gold-gain", "gold-spend");
        goldChange.classList.remove("gain", "spend");

        void goldChip.offsetWidth;
        void goldChange.offsetWidth;

        goldChange.textContent =
            gained ? `+${difference}` : `${difference}`;

        goldChip.classList.add(
            gained ? "gold-gain" : "gold-spend"
        );

        goldChange.classList.add(
            gained ? "gain" : "spend"
        );
    }

    previousGold = currentGold;

    if(matchInfo)
        matchInfo.textContent = "Turn " + game.turn;
}
function showNotEnoughGold(cardElement){
    const goldChip = document.getElementById("playerGoldChip");
    const warning = document.getElementById("goldWarning");

    cardElement.classList.remove("no-gold");

    if(goldChip)
        goldChip.classList.remove("no-gold");

    if(warning)
        warning.classList.remove("show");

    // Force the browser to restart each animation.
    void cardElement.offsetWidth;

    if(goldChip)
        void goldChip.offsetWidth;

    if(warning)
        void warning.offsetWidth;

    cardElement.classList.add("no-gold");

    if(goldChip)
        goldChip.classList.add("no-gold");

    if(warning)
        warning.classList.add("show");
}
export function drawHand(room, self, onSelect){
    const game = room.game;
    const wrap = document.getElementById("cards");

    if(!wrap)
        return;

    const player = game[self];
    const hand = player.hand || [];
    const chosen = player.selectedIndex;
    const availableGold = player.gold;

    wrap.innerHTML = "";

    hand.forEach((card, index) => {
        const cannotAfford = card.cost > availableGold;

        const element = document.createElement("button");

        element.className =
            `game-card rarity-${card.rarity}` +
            (chosen === index ? " selected" : "") +
            (cannotAfford ? " unaffordable" : "");

        element.innerHTML = `
            <span class="cost">
                <span class="coin"></span>
                ${card.cost}
            </span>

            <span class="rarity ${card.rarity}"></span>

            <svg class="portrait" viewBox="0 0 100 120">
                ${rigMarkup(card.id, "you", "pose")}
            </svg>

            <span class="cname">${card.name}</span>
        `;

        element.onclick = () => {
            if(card.cost > game[self].gold){
                showNotEnoughGold(element);
                return;
            }

            onSelect(index);
        };

        wrap.appendChild(element);
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

export function showResult(outcome, youReady, opponentReady, onRematch){
    const el = document.getElementById("result");
    if(!el) return;

    const text = el.querySelector(".result-text");
    const sub = document.getElementById("resultSub");
    const button = document.getElementById("rematchBtn");
    const status = document.getElementById("rematchStatus");

    if(outcome === "win"){
        text.textContent = "Victory";
        el.classList.add("win");
    }
    else if(outcome === "draw"){
        text.textContent = "Draw";
        el.classList.remove("win");
    }
    else{
        text.textContent = "Defeat";
        el.classList.remove("win");
    }

    if(sub)
        sub.textContent = "Battle complete";

    if(button){
        button.disabled = youReady;
        button.textContent = youReady ? "Ready" : "Play Again";
        button.onclick = youReady ? null : onRematch;
    }

    if(status){
        if(youReady && opponentReady)
            status.textContent = "Starting rematch...";
        else if(youReady)
            status.textContent = "Waiting for opponent...";
        else if(opponentReady)
            status.textContent = "Opponent wants a rematch";
        else
            status.textContent = "";
    }

    el.classList.remove("hidden");
}
export function hideResult(){
    const el = document.getElementById("result");
    if(el) el.classList.add("hidden");
}


export function setReturnLobbyHandler(onReturn){
    const button = document.getElementById("returnLobbyBtn");

    if(button)
        button.onclick = onReturn;
}


export function showPlayerLeft(onReturn){
    const overlay = document.getElementById("playerLeftOverlay");

    if(!overlay)
        return;

    overlay.onclick = onReturn;
    overlay.classList.remove("hidden");
}


export function hidePlayerLeft(){
    const overlay = document.getElementById("playerLeftOverlay");

    if(overlay)
        overlay.classList.add("hidden");
}

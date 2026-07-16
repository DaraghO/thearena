// render.js
// All drawing lives here. No Firestore. game.js calls these.

/* =========================================================
   RIG REGISTRY
   Add a card: write a rig function, register it by card id.
   A rig returns an SVG <g>. Local box is 100 wide, feet at y = 118.
   ========================================================= */

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

// Shown for any card that has no rig yet. Keeps new cards visible.
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

const RIGS = {
    knight: knightRig
    // archer: archerRig,
    // dragon: dragonRig,
};

function rigMarkup(cardId, team, state){
    const fn = RIGS[cardId] || fallbackRig;
    return fn(team, state);
}

// place a rig on the board at a point, scaled
function placed(cx, feetY, scale, cardId, team, state){
    const s = scale;
    const x = cx - 50 * s;
    const y = feetY - 118 * s;
    return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s})">${rigMarkup(cardId, team, state)}</g>`;
}

/* ========================================

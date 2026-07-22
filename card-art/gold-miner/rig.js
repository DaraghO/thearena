// card-art/archer/rig.js
// SVG rig markup for the Archer card.

export function archerRig(team, state){
    return `
    <g class="rig archer team-${team} state-${state}">
        <ellipse class="shadow" cx="50" cy="114" rx="21" ry="4.2"/>

        <g class="archer-root">
            <g class="archer-quiver">
                <path class="archer-outline" d="M65 44 L76 39 L79 67 Q73 73 65 68 Z" fill="#69482f"/>
                <path d="M67 46 L75 42 L77 64 Q72 68 67 65 Z" fill="#8e633d"/>
                <g stroke="#3e2a24" stroke-width="1.2" stroke-linecap="round">
                    <line x1="69" y1="45" x2="75" y2="27"/>
                    <line x1="72.5" y1="44.4" x2="80" y2="27"/>
                    <line x1="75" y1="46" x2="84" y2="30"/>
                </g>
                <g class="archer-gold archer-outline">
                    <path d="M73 28 l2 -4.8 l1.6 5 l-1.8 2 z"/>
                    <path d="M79 28 l2.8 -4.6 l1 5.4 l-2 1.2 z"/>
                    <path d="M83 31 l3.4 -4.2 l.2 5.6 l-2 1 z"/>
                </g>
            </g>

            <g class="archer-hair-back">
                <path class="archer-hair archer-outline" d="M33 21 Q25 30 27 47 Q28 63 36 82 Q42 95 50 97 Q58 96 64 85 Q72 72 72 49 Q72 29 64 20 Q58 15 50 15 Q39 15 33 21 Z"/>
                <path d="M38 24 Q33 35 35 51 Q37 73 47 91" fill="none" stroke="#dbc3fb" stroke-width="1" opacity=".32"/>
                <path d="M63 24 Q67 35 65 52 Q63 72 55 90" fill="none" stroke="#dbc3fb" stroke-width="1" opacity=".32"/>
            </g>

            <g class="archer-leg-left">
                <line x1="46" y1="73" x2="40.5" y2="110.5" class="archer-limb-outline"/>
                <line x1="46" y1="73" x2="40.5" y2="110.5" class="archer-limb-skin"/>
            </g>
            <g class="archer-leg-right">
                <line x1="54" y1="73" x2="59.5" y2="110.5" class="archer-limb-outline"/>
                <line x1="54" y1="73" x2="59.5" y2="110.5" class="archer-limb-skin"/>
            </g>

            <g class="archer-body-stack">
                <path class="archer-dress archer-outline" d="M50 38 L64 74 L36 74 Z"/>
                <path class="archer-skin-light archer-outline" d="M50 38 L60.5 47.5 L39.5 47.5 Z"/>

                <g class="archer-neutral-arms">
                    <g class="archer-neutral-arm-left">
                        <line x1="43.5" y1="46.5" x2="34.2" y2="59.5" class="archer-arm-outline"/>
                        <line x1="43.5" y1="46.5" x2="34.2" y2="59.5" class="archer-arm-skin"/>
                    </g>
                    <g class="archer-neutral-arm-right">
                        <line x1="56.5" y1="46.5" x2="67.6" y2="60" class="archer-arm-outline"/>
                        <line x1="56.5" y1="46.5" x2="67.6" y2="60" class="archer-arm-skin"/>
                    </g>
                </g>

                <g class="archer-attack-arms">
                    <g class="archer-attack-arm-front">
                        <line x1="56.5" y1="46.2" x2="80.5" y2="51.5" class="archer-arm-outline"/>
                        <line x1="56.5" y1="46.2" x2="80.5" y2="51.5" class="archer-arm-skin"/>
                    </g>
                    <g class="archer-attack-arm-draw">
                        <line x1="43.5" y1="46.2" x2="58.2" y2="48.4" class="archer-arm-outline"/>
                        <line x1="43.5" y1="46.2" x2="58.2" y2="48.4" class="archer-arm-skin"/>
                    </g>
                </g>

                <g class="archer-boob-left">
                    <circle class="archer-dress archer-outline" cx="45" cy="48.8" r="7"/>
                    <path class="archer-skin-light" d="M38 48.8 A7 7 0 0 1 52 48.8 Z"/>
                </g>
                <g class="archer-boob-right">
                    <circle class="archer-dress archer-outline" cx="55" cy="48.8" r="7"/>
                    <path class="archer-skin-light" d="M48 48.8 A7 7 0 0 1 62 48.8 Z"/>
                </g>

                <g class="archer-neutral-bow-group">
                    <g class="archer-bow-neutral">
                        <path d="M71 43 Q84 61 72 82" fill="none" stroke="#b86f2e" stroke-width="3" stroke-linecap="round"/>
                        <path d="M71 43 L72 82" fill="none" stroke="#ece2cc" stroke-width=".75"/>
                        <rect class="archer-gold archer-outline" x="67.2" y="60" width="7" height="3.4" rx="1.5"/>
                    </g>
                </g>

                <g class="archer-attack-bow-group">
                    <g class="archer-bow-attack">
                        <path d="M83 31 Q97 52 83 76" fill="none" stroke="#b86f2e" stroke-width="3.2" stroke-linecap="round"/>
                        <path class="archer-bow-string-drawn" d="M83 31 L59 48.4 L83 76" fill="none" stroke="#f3ead8" stroke-width=".75"/>
                        <path d="M83 31 L83 76" fill="none" stroke="#f3ead8" stroke-width=".55" opacity=".38"/>
                        <rect class="archer-gold archer-outline" x="79" y="50" width="8" height="3.5" rx="1.5"/>
                    </g>
                    <g>
                        <line x1="57.5" y1="48.4" x2="87.5" y2="52" stroke="#3f2b23" stroke-width="1.1"/>
                        <path class="archer-gold archer-outline" d="M88.5 52 l-4 -2 l1 4 z"/>
                        <path d="M58.5 48.4 l-4 -2 l1 4 z" fill="#c8a6f5"/>
                    </g>
                </g>
            </g>

            <g class="archer-head-stack">
                <ellipse class="archer-skin-light archer-outline" cx="50" cy="26" rx="14.2" ry="14"/>
                <path class="archer-hair" d="M36.7 24.4 Q39 14 50 14 Q61 14 63.3 24.4 Q58.3 18.8 50 18.8 Q41.7 18.8 36.7 24.4 Z"/>

                <g class="archer-hair-side">
                    <path class="archer-hair archer-outline" d="M36.5 21.6 Q29.3 28 32.7 41 Q34.1 48.4 39 53.8 Q43.3 56.2 45.2 53.1 Q40 45.7 40.4 36.8 Q40.8 27.8 38.7 22.4 Z"/>
                    <path class="archer-hair archer-outline" d="M63.5 21.6 Q70.7 28 67.3 41 Q65.9 48.4 61 53.8 Q56.7 56.2 54.8 53.1 Q60 45.7 59.6 36.8 Q59.2 27.8 61.3 22.4 Z"/>
                </g>

                <g class="archer-hair-front">
                    <path class="archer-hair archer-outline" d="M36.2 17.2 Q42.5 12 50 12 Q57.5 12 63.8 17.2 L63.8 27.2 Q58.7 23.1 54 22.6 Q50 22.2 46 22.6 Q41.3 23.1 36.2 27.2 Z"/>
                    <path d="M42.6 17.8 Q43.9 24.6 41.8 29.2" fill="none" stroke="#decbfb" stroke-width="1" opacity=".42"/>
                    <path d="M49.9 17 Q50.4 25 48.8 29.3" fill="none" stroke="#decbfb" stroke-width="1" opacity=".42"/>
                    <path d="M57 17.8 Q56 24.5 58.2 29" fill="none" stroke="#decbfb" stroke-width="1" opacity=".42"/>
                </g>

                <path class="archer-eye archer-outline" d="M39.2 27.3 Q42 23.9 46 26.2 Q42.2 31 39.2 27.3 Z"/>
                <path class="archer-eye archer-outline" d="M53.9 26.2 Q58 23.9 60.8 27.3 Q57.8 31 53.9 26.2 Z"/>
                <ellipse cx="43.5" cy="27.2" rx="1.6" ry="1.5" fill="#2a1d30"/>
                <ellipse cx="56.5" cy="27.2" rx="1.6" ry="1.5" fill="#2a1d30"/>
                <circle cx="44" cy="26.7" r=".45" fill="#fff"/>
                <circle cx="57" cy="26.7" r=".45" fill="#fff"/>
                <path d="M47.7 35.2 Q50 38 52.3 35.2" fill="none" stroke="#b55d77" stroke-width="1.3" stroke-linecap="round"/>

                <g class="archer-blink-lids archer-skin-light">
                    <rect x="38.8" y="24.7" width="8.2" height="4.6" rx="2.1"/>
                    <rect x="53" y="24.7" width="8.2" height="4.6" rx="2.1"/>
                </g>

                <g class="archer-crown">
                    <path class="archer-gold archer-outline" d="M36 16.5 L38 7.6 L43.6 12.2 L48.8 5.6 L53.8 12.1 L60 7.4 L64 16.5 Z"/>
                    <rect class="archer-gold archer-outline" x="36" y="14.6" width="28" height="4.7" rx="2"/>
                    <circle cx="49.8" cy="15" r="1.45" fill="var(--archer-team)" stroke="#5c3428" stroke-width=".6"/>
                    <circle cx="40.7" cy="15.7" r="1" fill="#8dd9f0" stroke="#315867" stroke-width=".5"/>
                    <circle cx="59.1" cy="15.7" r="1" fill="#8dd9f0" stroke="#315867" stroke-width=".5"/>
                </g>

                <path class="archer-sparkle" d="M68 9 L69.3 12.2 L72.5 13.5 L69.3 14.8 L68 18 L66.7 14.8 L63.5 13.5 L66.7 12.2 Z" fill="#fff4aa" opacity="0"/>
            </g>

            <g class="archer-projectile-arrow">
                <line x1="85" y1="52" x2="110" y2="52" stroke="#3f2b23" stroke-width="1.15"/>
                <path class="archer-gold archer-outline" d="M111 52 l-5 -2.4 l1.2 4.8 z"/>
                <path d="M86 52 l-4 -2.2 l1 4.4 z" fill="#c8a6f5"/>
            </g>
        </g>
    </g>`;
}

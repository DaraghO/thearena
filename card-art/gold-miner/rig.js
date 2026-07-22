// card-art/gold-miner/rig.js
// SVG rig markup for the Gold Miner card.

export function goldMinerRig(team, state){
    return `
    <g class="rig gold-miner team-${team} state-${state}">
        <ellipse
            class="shadow gold-miner-shadow"
            cx="50"
            cy="113.5"
            rx="19"
            ry="4.2"
        />

        <g class="gold-miner-root">
            <!-- Upright version used for pose, idle and walking. -->
            <g class="gold-miner-upright">
                <g class="gold-miner-blob">
                    <circle
                        class="gold-miner-blob-base gold-miner-outline"
                        cx="50"
                        cy="91"
                        r="20"
                    />

                    <path
                        class="gold-miner-blob-highlight"
                        d="M34.5 83 Q41 74 50 74 Q59 74 65.5 83 Q58 79 50 79 Q42 79 34.5 83 Z"
                    />
                </g>

                <!-- The full helmet is the drill. -->
                <g class="gold-miner-drill-helmet">
                    <g class="gold-miner-drill-shell">
                        <path
                            class="gold-miner-drill-base gold-miner-outline"
                            d="M50 24 L67 72 Q68 75 65 77 L35 77 Q32 75 33 72 Z"
                        />

                        <path
                            class="gold-miner-drill-tip gold-miner-outline"
                            d="M50 24 L53.5 31 L46.5 31 Z"
                        />

                        <path class="gold-miner-drill-line" d="M39.8 40 L60.2 40"/>
                        <path class="gold-miner-drill-line" d="M37.3 49 L62.7 49"/>
                        <path class="gold-miner-drill-line" d="M35.2 58 L64.8 58"/>
                        <path class="gold-miner-drill-line" d="M33.8 67 L66.2 67"/>
                    </g>
                </g>

                <!-- Angry eyes tucked directly underneath the drill. -->
                <g class="gold-miner-eyes">
                    <path
                        class="gold-miner-eye gold-miner-outline"
                        d="M35.8 77.2 Q42.5 74.9 48.2 78.3 Q42.8 84.2 35.8 77.2 Z"
                    />

                    <path
                        class="gold-miner-eye gold-miner-outline"
                        d="M51.8 78.3 Q57.5 74.9 64.2 77.2 Q57.2 84.2 51.8 78.3 Z"
                    />

                    <ellipse class="gold-miner-pupil" cx="43.1" cy="80.1" rx="2" ry="2"/>
                    <ellipse class="gold-miner-pupil" cx="56.9" cy="80.1" rx="2" ry="2"/>
                    <circle class="gold-miner-eye-glint" cx="43.8" cy="79.5" r=".45"/>
                    <circle class="gold-miner-eye-glint" cx="57.6" cy="79.5" r=".45"/>

                    <path
                        class="gold-miner-visor gold-miner-outline"
                        d="M34 73.7 Q50 71.7 66 73.7 L64.7 78 Q50 76.7 35.3 78 Z"
                    />
                </g>

                <!-- Small pose/card-portrait effect. -->
                <g class="gold-miner-coin-pop">
                    <circle
                        class="gold-miner-coin gold-miner-outline"
                        cx="72"
                        cy="62"
                        r="5.5"
                    />

                    <circle
                        class="gold-miner-coin-inner"
                        cx="72"
                        cy="62"
                        r="3.1"
                    />
                </g>
            </g>

            <!-- Dedicated upside-down mining version. -->
            <g class="gold-miner-mining">
                <circle
                    class="gold-miner-blob-base gold-miner-outline"
                    cx="50"
                    cy="57"
                    r="20"
                />

                <path
                    class="gold-miner-blob-highlight"
                    d="M34.5 49 Q41 40 50 40 Q59 40 65.5 49 Q58 45 50 45 Q42 45 34.5 49 Z"
                />

                <g class="gold-miner-mining-eyes">
                    <path
                        class="gold-miner-eye gold-miner-outline"
                        d="M35.8 71.5 Q42.5 69.2 48.2 72.6 Q42.8 78.5 35.8 71.5 Z"
                    />

                    <path
                        class="gold-miner-eye gold-miner-outline"
                        d="M51.8 72.6 Q57.5 69.2 64.2 71.5 Q57.2 78.5 51.8 72.6 Z"
                    />

                    <ellipse class="gold-miner-pupil" cx="43.1" cy="74.4" rx="2" ry="2"/>
                    <ellipse class="gold-miner-pupil" cx="56.9" cy="74.4" rx="2" ry="2"/>
                    <circle class="gold-miner-eye-glint" cx="43.8" cy="73.8" r=".45"/>
                    <circle class="gold-miner-eye-glint" cx="57.6" cy="73.8" r=".45"/>
                </g>

                <g class="gold-miner-mining-drill">
                    <path
                        class="gold-miner-drill-base gold-miner-outline"
                        d="M34 73 Q33 76 36 78 L64 78 Q67 76 66 73 L50 111 Z"
                    />

                    <path class="gold-miner-drill-line" d="M35.4 79 L64.6 79"/>
                    <path class="gold-miner-drill-line" d="M38.4 86 L61.6 86"/>
                    <path class="gold-miner-drill-line" d="M41.4 93 L58.6 93"/>
                    <path class="gold-miner-drill-line" d="M44.3 100 L55.7 100"/>
                    <path class="gold-miner-drill-line" d="M47.4 107 L52.6 107"/>
                </g>

                <ellipse
                    class="gold-miner-spin-ring ring-one"
                    cx="50"
                    cy="83"
                    rx="18"
                    ry="3"
                />

                <ellipse
                    class="gold-miner-spin-ring ring-two"
                    cx="50"
                    cy="92"
                    rx="13"
                    ry="2.4"
                />

                <ellipse
                    class="gold-miner-spin-ring ring-three"
                    cx="50"
                    cy="101"
                    rx="8"
                    ry="1.8"
                />
            </g>
        </g>

        <g class="gold-miner-effects">
            <circle class="gold-miner-dirt dirt-one" cx="45" cy="109" r="3"/>
            <circle class="gold-miner-dirt dirt-two" cx="55" cy="109" r="3"/>

            <path
                class="gold-miner-spark spark-one"
                d="M44 107 l1.8 3 l3.5 1.2 l-3 1.1 l-1.2 3 l-1.3 -2.9 l-3.1 -1.2 l3.1 -1 z"
            />

            <path
                class="gold-miner-spark spark-two"
                d="M56 107 l1.8 3 l3.5 1.2 l-3 1.1 l-1.2 3 l-1.3 -2.9 l-3.1 -1.2 l3.1 -1 z"
            />

            <circle
                class="gold-miner-mined-coin gold-miner-outline"
                cx="50"
                cy="104"
                r="4.6"
            />

            <circle
                class="gold-miner-mined-coin-inner"
                cx="50"
                cy="104"
                r="2.5"
            />
        </g>
    </g>`;
}

const LANES = ["lane1", "lane2", "lane3"];
const RANDOM_SKIP_CHANCE = 0.15;

function randomItem(items){
    return items[
        Math.floor(Math.random() * items.length)
    ];
}

export function chooseBotMove(
    game,
    playerKey = "player2"
){
    const player = game?.[playerKey];

    if(!player){
        return {
            selectedIndex: null,
            selectedLane: null
        };
    }

    const affordableCards = (player.hand || [])
        .map((card, index) => ({ card, index }))
        .filter(({ card }) =>
            card.type === "unit" &&
            card.cost <= player.gold
        );

    if(
        affordableCards.length === 0 ||
        Math.random() < RANDOM_SKIP_CHANCE
    ){
        return {
            selectedIndex: null,
            selectedLane: null
        };
    }

    const choice = randomItem(affordableCards);

    return {
        selectedIndex: choice.index,
        selectedLane: randomItem(LANES)
    };
}

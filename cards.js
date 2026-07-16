// cards.js

export const cards = [

    {
        id: "knight",
        name: "Knight",
        type: "unit",
        rarity: "common",

        cost: 2,

        health: 500,
        damage: 80,

        speed: 4,
        range: 1,

        attackSpeed: 1
    },


    {
        id: "archer",
        name: "Archers",
        type: "unit",
        rarity: "common",

        cost: 2,

        health: 250,
        damage: 50,

        speed: 7,
        range: 5,

        attackSpeed: 1.5
    },


    {
        id: "fireball",
        name: "Fireball",
        type: "spell",
        rarity: "rare",

        cost: 5,

        damage: 300,
        range: 3
    },


    {
        id: "healing_potion",
        name: "Healing Potion",
        type: "item",
        rarity: "rare",

        cost: 5,

        healing: 400
    },


    {
        id: "dragon",
        name: "Dragon",
        type: "unit",
        rarity: "legendary",

        cost: 10,

        health: 1200,
        damage: 150,

        speed: 3,
        range: 4,

        attackSpeed: 2
    }

];

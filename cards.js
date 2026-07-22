// cards.js
export const cards = [
    {
        id:"knight",  
        name:"Knight",  
        type:"unit", 
        rarity:"common",
          cost:2, 
        health:500, 
        damage:80, 
        speed:4, 
        range:1, 
        detectRange:3, 
        attackSpeed:1 
    },
    {
        id:"archer",
        name:"Archer Baddie",
        type:"unit",
        rarity:"common",
        cost:2,
        health:107,
        damage:67,
        speed:6,
        range:7,
        detectRange:6,
        attackSpeed:1.7,
    
        adjacentLaneTargeting:true,
        attackLockedTargetAtAnyRange:true
    },
    {
        id:"dragon",
        name:"Dragon",
        type:"unit",
        rarity:"legendary",
        cost:10,
        health:1000,
        damage:250,
        speed:1,
        range:1,
        detectRange:6,
        attackSpeed:0.25
    },
    {
        id:"gold_miner",
        name:"Gold Miner",
        type:"unit",
        rarity:"legendary",
    
        cost:8,
        health:1000,
        speed:3,
    
        behaviour:"goldMiner",
        goldPerSecond:2
    },
    {
        id:"fireball", 
        name:"Fireball", 
        type:"spell", 
        rarity:"rare",
        cost:5, 
        damage:300, 
        range:3 
    },
    { 
        id:"healing_potion", 
        name:"Healing Potion", 
        type:"item", 
        rarity:"rare",
        cost:5, healing:400 
    }
];
// fresh random draw each rest phase; duplicates allowed (variety with a small pool)
export function getRandomUnitCards(amount = 3){
    const units = cards.filter(c => c.type === "unit");
    const out = [];
    for(let i=0;i<amount;i++) out.push(units[Math.floor(Math.random()*units.length)]);
    return out;
}

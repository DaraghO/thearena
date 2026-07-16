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

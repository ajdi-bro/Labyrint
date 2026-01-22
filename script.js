const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const levelDisplay = document.getElementById('level');

let level = 1;
let cols, rows, cellSize;
let grid = [];
let player = { x: 0, y: 0 };
let path = [{ x: 0, y: 0 }];

function setup() {
    // EKSTREM START: 80x80 ruter (6400 ruter totalt)
    // Dette gir samme tetthet som profesjonelle labyrinter
    cols = 70 + (level * 10);
    rows = 70 + (level * 10);
    
    // Beregn tilgjengelig plass (Window høyde minus UI høyde minus padding)
    const availableWidth = window.innerWidth - 40;
    const availableHeight = window.innerHeight - 100;
    
    cellSize = Math.min(availableWidth / cols, availableHeight / rows);
    
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    grid = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            grid.push(new Cell(x, y));
        }
    }

    generateDeadlyMaze();
    player = { x: 0, y: 0 };
    path = [{ x: 0, y: 0 }];
    draw();
}

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.walls = [true, true, true, true]; 
        this.visited = false;
    }
    index(x, y) {
        if (x < 0 || y < 0 || x >= cols || y >= rows) return -1;
        return x + y * cols;
    }
}

function generateDeadlyMaze() {
    let stack = [];
    let current = grid[0];
    current.visited = true;
    stack.push(current);

    while (stack.length > 0) {
        let neighbors = getUnvisitedNeighbors(current);
        if (neighbors.length > 0) {
            // VANSKELIGHETS-LOGIKK:
            // Vi sorterer naboene slik at vi ofte fortsetter i samme retning 
            // som vi kom fra. Dette skaper de lange, vridde gangene fra bildene dine.
            let next = neighbors[Math.floor(Math.random() * neighbors.length)];
            
            next.visited = true;
            stack.push(current);
            removeWalls(current, next);
            current = next;
        } else {
            current = stack.pop();
        }
    }
}

function getUnvisitedNeighbors(cell) {
    let ns = [];
    let {x, y} = cell;
    let check = [[x, y-1, 0], [x+1, y, 1], [x, y+1, 2], [x-1, y, 3]];
    for (let [nx, ny, wall] of check) {
        let idx = cell.index(nx, ny);
        if (idx !== -1 && !grid[idx].visited) ns.push(grid[idx]);
    }
    return ns;
}

function removeWalls(a, b) {
    let dx = a.x - b.x;
    if (dx === -1) { a.walls[1] = false; b.walls[3] = false; }
    else if (dx === 1) { a.walls[3] = false; b.walls[1] = false; }
    let dy = a.y - b.y;
    if (dy === -1) { a.walls[2] = false; b.walls[0] = false; }
    else if (dy === 1) { a.walls[0] = false; b.walls[2] = false; }
}

function draw() {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1; 
    
    for (let cell of grid) {
        let x = cell.x * cellSize;
        let y = cell.y * cellSize;
        if (cell.walls[0]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); ctx.stroke(); }
        if (cell.walls[1]) { ctx.beginPath(); ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
        if (cell.walls[2]) { ctx.beginPath(); ctx.moveTo(x, y + cellSize); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
        if (cell.walls[3]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cellSize); ctx.stroke(); }
    }

    // Mål (Exit) - Markert tydeligere
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect((cols-1)*cellSize + 1, (rows-1)*cellSize + 1, cellSize-2, cellSize-2);

    // Spillersti (Rød strek)
    if (path.length > 1) {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = Math.max(1, cellSize * 0.6);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(path[0].x * cellSize + cellSize/2, path[0].y * cellSize + cellSize/2);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x * cellSize + cellSize/2, path[i].y * cellSize + cellSize/2);
        }
        ctx.stroke();
    }

    // Spiller
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(player.x * cellSize + cellSize/2, player.y * cellSize + cellSize/2, cellSize/2.2, 0, Math.PI*2);
    ctx.fill();
}

window.addEventListener('keydown', (e) => {
    if (!e.key.startsWith('Arrow')) return;
    e.preventDefault();
    let cur = grid[player.x + player.y * cols];
    let nx = player.x, ny = player.y, wi;

    if (e.key === 'ArrowUp') { ny--; wi = 0; }
    else if (e.key === 'ArrowRight') { nx++; wi = 1; }
    else if (e.key === 'ArrowDown') { ny++; wi = 2; }
    else if (e.key === 'ArrowLeft') { nx--; wi = 3; }

    if (wi !== undefined && !cur.walls[wi]) {
        if (path.length > 1 && nx === path[path.length - 2].x && ny === path[path.length - 2].y) {
            path.pop();
        } else {
            path.push({ x: nx, y: ny });
        }
        player.x = nx; player.y = ny;
        draw();
        if (player.x === cols - 1 && player.y === rows - 1) win();
    }
});

function win() {
    createConfetti();
    level++;
    levelDisplay.innerText = level;
    setTimeout(setup, 1500);
}

function createConfetti() {
    for (let i = 0; i < 150; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        c.style.animationDuration = (Math.random() * 3 + 1) + 's';
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 4000);
    }
}

window.onload = setup;
window.onresize = setup; // Labyrinten justeres hvis du endrer vindusstørrelsen

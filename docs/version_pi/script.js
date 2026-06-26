/* script.js for Balanced Team Builder */

// Globals
let originalPlayers = [];
let players = [];
let preferences = [];
let solutions = [];
let currentSolutionIndex = 0;

// Helper functions for parsing files
function parsePlayers(content) {
    const lines = content.trim().split(/\r?\n/);
    return lines.map(line => {
        const [name, strength, comment] = line.split(',').map(t => t.trim());
        return { name, strength: Number(strength), comment, selected: false };
    });
}
function parsePreferences(content) {
    return content.trim().split(/\r?\n/).map(l => {
        const [p1, p2, val] = l.split(',').map(t => t.trim());
        if (!p1 || !p2 || isNaN(Number(val))) return null;
        return { p1, p2, value: Number(val) };
    }).filter(x=>!!x);
}

// File Loaders
function loadFile(inputEl, cb) {
    const file = inputEl.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => cb(e.target.result);
    reader.readAsText(file);
}
function fetchText(url, cb) {
    fetch(url).then(r=>r.text()).then(cb);
}

// Renderers
function renderPlayers() {
    const form = document.getElementById('players-form');
    form.innerHTML = '';
    players.forEach((p,i) => {
        const div = document.createElement('div');
        div.className = 'player';
        div.innerHTML = `<input type="checkbox" id="chk_${i}" ${p.selected ? 'checked' : ''}>
            <strong>${p.name}</strong> &nbsp;
            <label>Strength:</label> 
            <input type="number" min="1" max="100" id="str_${i}" value="${p.strength}" style="width:60px">
            &nbsp;<small>${p.comment||''}</small>`;
        form.appendChild(div);
        // Checkbox change
        div.querySelector(`#chk_${i}`).addEventListener('change', e => {
            p.selected = e.target.checked;
        });
        // Strength adjust
        div.querySelector(`#str_${i}`).addEventListener('change', e => {
            p.strength = Number(e.target.value);
        });
    });
}
function renderPreferences() {
    const list = document.getElementById('preferences-list');
    list.innerHTML = '';
    preferences.forEach((p, i) => {
        const div = document.createElement('div');
        div.innerHTML = `<input type="text" value="${p.p1}" size="4">, <input type="text" value="${p.p2}" size="4">&nbsp;
            <input type="number" value="${p.value}" style="width:60px">`;
        div.className = 'player-preference';
        // Edits update live
        Array.from(div.querySelectorAll('input')).forEach((inp, idx) => {
            inp.addEventListener('change', () => {
                if(idx===0) p.p1 = inp.value.trim();
                else if(idx===1) p.p2 = inp.value.trim();
                else if(idx===2) p.value = Number(inp.value);
            });
        });
        list.appendChild(div);
    });
}

// Generate all possible teams, filtering permutations and unbalanced solutions
function generateTeams() {
    const n = Number(document.getElementById('num-teams').value) || 2;
    const selP = players.filter(p=>p.selected);
    if (selP.length < n) { alert('Select at least as many players as teams!'); return; }
    const teams = getBalancedTeams(selP, n, preferences);
    // Filter permutations
    solutions = filterTeamPermutations(teams);
    if (!solutions.length) { alert('No balanced teams found.'); return; }
    currentSolutionIndex = 0;
    showSolutions();
}

// Present solutions and browse
function showSolutions() {
    const section = document.getElementById('solutions-section');
    const cont = document.getElementById('solutions-container');
    section.style.display = '';
    cont.innerHTML = '';
    const sol = solutions[currentSolutionIndex];
    sol.forEach((team, idx) => {
        const el = document.createElement('div');
        el.className = 'team';
        el.innerHTML = `<strong>Team ${idx+1} (Total strength: ${team.strength})</strong><ul>`+
            team.players.map(p => {
                let highlight = preferences.filter(prf => {
                    return team.players.find(t => t.name==prf.p1) && team.players.find(t => t.name==prf.p2);
                }).map(one => `<span class="preference">+${one.value}</span>`);
                return `<li>${p.name} [${p.strength}] ${(highlight.length)?highlight.join(''):''}</li>`;
            }).join('')+`</ul>`;
        cont.appendChild(el);
    });
    // Browsing controls
    const browse = document.getElementById('browsing-controls');
    browse.innerHTML = `<button ${currentSolutionIndex==0?'disabled':''} id="prevSol">&lt; Prev</button> 
        Solution ${currentSolutionIndex+1} of ${solutions.length}
        <button ${currentSolutionIndex==solutions.length-1?'disabled':''} id="nextSol">Next &gt;</button>`;
    document.getElementById('prevSol').onclick=()=>{currentSolutionIndex--;showSolutions();}
    document.getElementById('nextSol').onclick=()=>{currentSolutionIndex++;showSolutions();}
}

// Core algorithm - partitioning players into n teams, honoring preferences and balance
function getBalancedTeams(players, n, prefs) {
    // Generate all unique, unordered partitions of arr into n non-empty subsets
    function* unorderedPartitions(arr, n, curr = [], idx = 0) {
        if (idx >= arr.length) {
            if (curr.length === n && curr.every(team => team.length > 0)) yield curr.map(team => [...team]);
            return;
        }
        for (let i = 0; i < curr.length; ++i) {
            curr[i].push(arr[idx]);
            yield* unorderedPartitions(arr, n, curr, idx + 1);
            curr[i].pop();
        }
        if (curr.length < n) {
            curr.push([arr[idx]]);
            yield* unorderedPartitions(arr, n, curr, idx + 1);
            curr.pop();
        }
    }
    const avg = players.reduce((s, p) => s + p.strength, 0) / n;
    let results = [];
    const maxPartitionCount = 500000; // For safety
    let partitionCounter = 0;
    for (const part of unorderedPartitions(players, n)) {
        partitionCounter++;
        if (partitionCounter > maxPartitionCount) break;
        const teamSums = part.map(t => t.reduce((s, p) => s + p.strength, 0));
        // Only accept partitions within 10% of average
        if (teamSums.every(s => Math.abs(s - avg) <= avg * 0.1)) {
            const teamObjs = part.map((t, j) => {
                let base = t.reduce((s, p) => s + p.strength, 0);
                // Add preference bonuses only for assigned pairs
                prefs.forEach(pr => {
                    if (t.find(x => x.name === pr.p1) && t.find(x => x.name === pr.p2)) base += pr.value;
                });
                return { players: t, strength: base };
            });
            results.push(teamObjs);
        }
    }
    // Sort so that solutions with smallest team strength difference come first
    results.sort((a, b) => {
        const diffA = Math.max(...a.map(t=>t.strength)) - Math.min(...a.map(t=>t.strength));
        const diffB = Math.max(...b.map(t=>t.strength)) - Math.min(...b.map(t=>t.strength));
        return diffA - diffB;
    });
    return results;
}
// Remove solutions that are permutations of others
function filterTeamPermutations(solutions) {
    const hashes = new Set();
    return solutions.filter(sol => {
        const hash = sol.map(team=>team.players.map(p=>p.name).sort().join(',')).sort().join('|');
        if(hashes.has(hash)) return false;
        hashes.add(hash);
        return true;
    });
}

// File loading handlers
function loadInitialFromServer() {
    fetchText('../players.txt', c => {
        originalPlayers = players = parsePlayers(c);
        renderPlayers();
    });
    fetchText('../preferences.txt', c => {
        preferences = parsePreferences(c);
        renderPreferences();
    });
}
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('load-local').onclick = function() {
        loadFile(document.getElementById('players-file'), function(c) {
            originalPlayers = players = parsePlayers(c); renderPlayers();
        });
        loadFile(document.getElementById('preferences-file'), function(c) {
            preferences = parsePreferences(c); renderPreferences();
        });
    };
    document.getElementById('load-server').onclick = loadInitialFromServer;
    document.getElementById('generate-teams').onclick = generateTeams;
    // Initial load
    loadInitialFromServer();
});

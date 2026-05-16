// State
let playersData = [];
let preferencesData = [];
let selectedPlayers = new Set();
let solutions = [];
let currentSolutionIdx = 0;

// DOM Elements
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const step3 = document.getElementById('step-3');

const playersFile = document.getElementById('players-file');
const prefsFile = document.getElementById('prefs-file');
const playersStatus = document.getElementById('players-status');
const prefsStatus = document.getElementById('prefs-status');
const loadFilesBtn = document.getElementById('load-files-btn');
const loadServerBtn = document.getElementById('load-server-btn');

const playersContainer = document.getElementById('players-container');
const selectedCountEl = document.getElementById('selected-count');
const nrOfTeamsInput = document.getElementById('nr-of-teams');
const generateTeamsBtn = document.getElementById('generate-teams-btn');
const backToFilesBtn = document.getElementById('back-to-files');

const loader = document.getElementById('loader');
const solutionsViewer = document.getElementById('solutions-viewer');
const prevSolutionBtn = document.getElementById('prev-solution-btn');
const nextSolutionBtn = document.getElementById('next-solution-btn');
const solutionTitle = document.getElementById('solution-title');
const solutionVariance = document.getElementById('solution-variance');
const teamsContainer = document.getElementById('teams-container');
const backToSelectionBtn = document.getElementById('back-to-selection');

// Event Listeners
playersFile.addEventListener('change', (e) => handleFileUpload(e, 'players'));
prefsFile.addEventListener('change', (e) => handleFileUpload(e, 'prefs'));
loadFilesBtn.addEventListener('click', () => goToStep(2));
loadServerBtn.addEventListener('click', loadServerData);
backToFilesBtn.addEventListener('click', () => goToStep(1));
generateTeamsBtn.addEventListener('click', generateTeams);
backToSelectionBtn.addEventListener('click', () => goToStep(2));
prevSolutionBtn.addEventListener('click', () => showSolution(currentSolutionIdx - 1));
nextSolutionBtn.addEventListener('click', () => showSolution(currentSolutionIdx + 1));

// File Handling
function handleFileUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        if (type === 'players') {
            parsePlayers(content);
            playersStatus.textContent = `Loaded ${playersData.length} players`;
            document.getElementById('players-drop-zone').classList.add('loaded');
        } else {
            parsePreferences(content);
            prefsStatus.textContent = `Loaded ${preferencesData.length} preferences`;
            document.getElementById('prefs-drop-zone').classList.add('loaded');
        }
        checkFilesLoaded();
    };
    reader.readAsText(file);
}

function parsePlayers(text) {
    playersData = [];
    const lines = text.split('\n');
    let idCounter = 1;
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        const parts = trimmed.split(',');
        if (parts.length >= 2) {
            const name = parts[0].trim();
            const strength = parseFloat(parts[1].trim());
            const comment = parts.length >= 3 ? parts[2].trim() : '';
            
            if (name && !isNaN(strength)) {
                playersData.push({ id: idCounter++, name, strength, comment });
            }
        }
    }
}

function parsePreferences(text) {
    preferencesData = [];
    const lines = text.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        let parts = trimmed.split(',');
        if (parts.length === 1) {
            parts = trimmed.split(/\s+/);
        }
        parts = parts.map(p => p.trim()).filter(p => p);
        
        if (parts.length >= 2) {
            const p1 = parts[0];
            const p2 = parts[1];
            const bonus = parts.length >= 3 ? parseFloat(parts[2]) : 2;
            if (!isNaN(bonus)) {
                preferencesData.push({ p1, p2, bonus });
            }
        }
    }
}

function checkFilesLoaded() {
    if (playersData.length > 0) {
        loadFilesBtn.disabled = false;
        renderPlayers();
        renderPreferences();
    }
}

async function loadServerData() {
    try {
        const [playersRes, prefsRes] = await Promise.all([
            fetch('players.txt'),
            fetch('preferences.txt')
        ]);
        
        if (playersRes.ok) {
            const playersText = await playersRes.text();
            parsePlayers(playersText);
            playersStatus.textContent = `Loaded ${playersData.length} players (Server)`;
            document.getElementById('players-drop-zone').classList.add('loaded');
        }
        
        if (prefsRes.ok) {
            const prefsText = await prefsRes.text();
            parsePreferences(prefsText);
            prefsStatus.textContent = `Loaded ${preferencesData.length} preferences (Server)`;
            document.getElementById('prefs-drop-zone').classList.add('loaded');
        }
        
        checkFilesLoaded();
        if (playersData.length > 0) {
            goToStep(2);
        } else {
            alert('Could not parse data from server. Please select files manually.');
        }
    } catch (error) {
        console.error("Failed to load server data:", error);
        alert('Could not load files via fetch (might be CORS). Please select files manually.');
    }
}

// UI Navigation
function goToStep(stepNum) {
    step1.classList.remove('active');
    step2.classList.remove('active');
    step3.classList.remove('active');
    
    if (stepNum === 1) step1.classList.add('active');
    if (stepNum === 2) step2.classList.add('active');
    if (stepNum === 3) step3.classList.add('active');
}

// Step 2: Selection
function renderPlayers() {
    playersContainer.innerHTML = '';
    selectedPlayers.clear();
    
    updateSelectionCount();
    
    playersData.forEach(player => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
            <input type="checkbox" id="p-${player.id}">
            <div class="player-info">
                <span class="player-name">${player.name}</span>
                <div class="player-strength-edit">
                    <label>Strength:</label>
                    <input type="number" class="strength-input" value="${player.strength}" step="0.5" min="1" max="20">
                </div>
            </div>
        `;
        
        const checkbox = card.querySelector('input[type="checkbox"]');
        const strengthInput = card.querySelector('.strength-input');
        
        strengthInput.addEventListener('click', (e) => e.stopPropagation());
        strengthInput.addEventListener('change', (e) => {
            const newStrength = parseFloat(e.target.value);
            if (!isNaN(newStrength)) {
                player.strength = newStrength;
            }
        });
        
        card.addEventListener('click', (e) => {
            if (e.target !== checkbox && e.target !== strengthInput) {
                checkbox.checked = !checkbox.checked;
            }
            if (checkbox.checked) {
                selectedPlayers.add(player.id);
                card.classList.add('selected');
            } else {
                selectedPlayers.delete(player.id);
                card.classList.remove('selected');
            }
            updateSelectionCount();
        });
        
        playersContainer.appendChild(card);
    });
}

function renderPreferences() {
    const prefsContainer = document.getElementById('preferences-container');
    if (!prefsContainer) return;
    prefsContainer.innerHTML = '';
    
    preferencesData.forEach((pref) => {
        const card = document.createElement('div');
        card.className = 'pref-card';
        card.innerHTML = `
            <div class="pref-info">
                <span class="pref-names">${pref.p1} &amp; ${pref.p2}</span>
                <div class="pref-strength-edit">
                    <label>Bonus:</label>
                    <input type="number" class="strength-input" value="${pref.bonus}" step="0.5">
                </div>
            </div>
        `;
        
        const strengthInput = card.querySelector('.strength-input');
        strengthInput.addEventListener('change', (e) => {
            const newBonus = parseFloat(e.target.value);
            if (!isNaN(newBonus)) {
                pref.bonus = newBonus;
            }
        });
        
        prefsContainer.appendChild(card);
    });
}

function updateSelectionCount() {
    selectedCountEl.textContent = selectedPlayers.size;
    const k = parseInt(nrOfTeamsInput.value, 10);
    generateTeamsBtn.disabled = selectedPlayers.size < k || selectedPlayers.size === 0;
}

nrOfTeamsInput.addEventListener('change', updateSelectionCount);

// Step 3: Generation & Viewing
function generateTeams() {
    goToStep(3);
    loader.classList.remove('hidden');
    solutionsViewer.classList.add('hidden');
    
    // Use setTimeout to allow UI to render loader before heavy computation
    setTimeout(() => {
        const activePlayers = playersData.filter(p => selectedPlayers.has(p.id));
        const k = parseInt(nrOfTeamsInput.value, 10);
        
        computeSolutions(activePlayers, k);
        
        loader.classList.add('hidden');
        if (solutions.length > 0) {
            solutionsViewer.classList.remove('hidden');
            showSolution(0);
        } else {
            alert("No valid partitions could be found for the selected number of teams.");
            goToStep(2);
        }
    }, 100);
}

function computeSolutions(items, k) {
    if (items.length < k) {
        solutions = [];
        return;
    }
    
    let allPartitions = [];
    if (items.length <= 12) {
        // Exhaustive search
        allPartitions = getPartitions(items, k);
    } else {
        // Randomized search for larger sets
        allPartitions = getRandomPartitions(items, k, 20000);
    }
    
    const evaluated = [];
    for (const p of allPartitions) {
        const sol = evaluatePartition(p, preferencesData);
        if (sol.isValid) {
            evaluated.push(sol);
        }
    }
    
    // Sort by variance (lowest first)
    evaluated.sort((a, b) => a.variance - b.variance);
    
    // Deduplicate
    const uniqueSolutions = [];
    const seen = new Set();
    
    for (const sol of evaluated) {
        // Canonicalize team representation to string for deduplication
        const sig = sol.teams.map(t => {
            const memberIds = t.team.map(m => m.id).sort((a,b)=>a-b).join('-');
            return memberIds;
        }).sort().join('|');
        
        if (!seen.has(sig)) {
            seen.add(sig);
            uniqueSolutions.push(sol);
        }
        
        if (uniqueSolutions.length >= 100) break; // Limit to top 100 unique solutions
    }
    
    solutions = uniqueSolutions;
}

// Recursive partition generation (Bell Number / Stirling subset)
function getPartitions(items, k) {
    if (k === 1) return [[items]];
    if (items.length === k) return [items.map(item => [item])];
    if (items.length < k) return [];
    
    const first = items[0];
    const rest = items.slice(1);
    
    const result = [];
    
    // Option 1: first item is in a subset by itself
    const p1 = getPartitions(rest, k - 1);
    for (const p of p1) {
        result.push([[first], ...p]);
    }
    
    // Option 2: first item joins one of the existing subsets
    const p2 = getPartitions(rest, k);
    for (const p of p2) {
        for (let i = 0; i < p.length; i++) {
            const newP = [...p];
            newP[i] = [first, ...newP[i]];
            result.push(newP);
        }
    }
    
    return result;
}

// Randomized partitions for large N
function getRandomPartitions(items, k, iterations) {
    const partitions = [];
    for (let i = 0; i < iterations; i++) {
        const p = Array.from({length: k}, () => []);
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        
        // Ensure at least 1 per team
        for (let j = 0; j < k; j++) {
            p[j].push(shuffled[j]);
        }
        // Distribute the rest
        for (let j = k; j < shuffled.length; j++) {
            const r = Math.floor(Math.random() * k);
            p[r].push(shuffled[j]);
        }
        partitions.push(p);
    }
    return partitions;
}

function evaluatePartition(partition, prefs) {
    const teamStrengths = partition.map((team, idx) => {
        let sum = team.reduce((acc, p) => acc + p.strength, 0);
        const bonuses = [];
        
        for (const pref of prefs) {
            const p1InTeam = team.some(p => p.name === pref.p1 || p.comment === pref.p1);
            const p2InTeam = team.some(p => p.name === pref.p2 || p.comment === pref.p2);
            if (p1InTeam && p2InTeam) {
                sum += pref.bonus;
                bonuses.push(pref);
            }
        }
        
        // Sort team members alphabetically
        const sortedTeam = [...team].sort((a,b) => a.name.localeCompare(b.name));
        
        return { 
            id: idx,
            team: sortedTeam, 
            strength: sum, 
            bonuses 
        };
    });
    
    // Sort teams by descending strength
    teamStrengths.sort((a, b) => b.strength - a.strength);
    
    const strengths = teamStrengths.map(ts => ts.strength);
    const sumStrengths = strengths.reduce((a, b) => a + b, 0);
    const average = sumStrengths / teamStrengths.length;
    
    let isValid = true;
    for (const s of strengths) {
        if (Math.abs(s - average) > average * 0.1) {
            isValid = false;
            break;
        }
    }
    
    const max = Math.max(...strengths);
    const min = Math.min(...strengths);
    
    return {
        teams: teamStrengths,
        variance: max - min,
        isValid: isValid
    };
}

function showSolution(idx) {
    if (idx < 0 || idx >= solutions.length) return;
    currentSolutionIdx = idx;
    
    const sol = solutions[idx];
    solutionTitle.textContent = `Solution ${idx + 1} of ${solutions.length}`;
    solutionVariance.innerHTML = `Strength Difference: <strong>${sol.variance}</strong>`;
    
    prevSolutionBtn.disabled = idx === 0;
    nextSolutionBtn.disabled = idx === solutions.length - 1;
    
    teamsContainer.innerHTML = '';
    
    sol.teams.forEach((teamData, tIdx) => {
        const card = document.createElement('div');
        card.className = 'team-card';
        
        const header = document.createElement('div');
        header.className = 'team-header';
        header.innerHTML = `
            <h4>Team ${tIdx + 1}</h4>
            <span class="team-strength">${teamData.strength}</span>
        `;
        card.appendChild(header);
        
        // Determine which members are in a preferred pair
        const preferredMembers = new Set();
        teamData.bonuses.forEach(b => {
            preferredMembers.add(b.p1);
            preferredMembers.add(b.p2);
        });
        
        const membersList = document.createElement('ul');
        membersList.className = 'team-members';
        
        teamData.team.forEach(member => {
            const li = document.createElement('li');
            li.className = 'team-member';
            if (preferredMembers.has(member.name)) {
                li.classList.add('preferred-pair');
            }
            li.innerHTML = `
                <span class="member-name">${member.name}</span>
                <span class="member-strength">${member.strength}</span>
            `;
            membersList.appendChild(li);
        });
        
        card.appendChild(membersList);
        
        if (teamData.bonuses.length > 0) {
            teamData.bonuses.forEach(b => {
                const bDiv = document.createElement('div');
                bDiv.className = 'bonus-item';
                bDiv.textContent = `+${b.bonus} synergy (${b.p1} & ${b.p2})`;
                card.appendChild(bDiv);
            });
        }
        
        teamsContainer.appendChild(card);
    });
}

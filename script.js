function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    
    // Get the actual drop target
    let dropTarget = ev.target;
    
    // Check if dropping into word bank
    if (dropTarget.id === 'wordBank' || dropTarget.closest('#wordBank')) {
        const wordBank = document.getElementById('wordBank');
        wordBank.appendChild(draggedElement);
        return;
    }
    
    // For grid cells, get the actual cell (in case we dropped on a word)
    dropTarget = dropTarget.classList.contains('grid-cell') ? 
        dropTarget : 
        dropTarget.classList.contains('word') ? 
            dropTarget.parentElement : null;
    
    if (dropTarget && dropTarget.classList.contains('grid-cell')) {
        // If dropping onto a grid cell
        if (!dropTarget.hasChildNodes()) {
            // Empty cell - just append
            dropTarget.appendChild(draggedElement);
        } else {
            // Cell has a word - swap positions
            const existingWord = dropTarget.firstChild;
            const draggedParent = draggedElement.parentElement;
            
            // If dragged from word bank, move existing word there
            if (draggedParent.id === 'wordBank') {
                dropTarget.appendChild(draggedElement);
                document.getElementById('wordBank').appendChild(existingWord);
            } else {
                // Swap positions of the two words
                draggedParent.appendChild(existingWord);
                dropTarget.appendChild(draggedElement);
            }
        }
    }
}

function resetGrid() {
    const wordBank = document.getElementById('wordBank');
    const gridCells = document.querySelectorAll('.grid-cell');
    
    // Move all words from grid cells back to word bank
    gridCells.forEach(cell => {
        if (cell.firstChild) {
            wordBank.appendChild(cell.firstChild);
        }
    });
}

function generateWords() {
    const textarea = document.getElementById('wordInput');
    const wordBank = document.getElementById('wordBank');
    
    // Clear existing words
    wordBank.innerHTML = '';
    
    // Get words from textarea
    const words = textarea.value.split('\n').filter(word => word.trim() !== '');
    
    // Create draggable elements for each word
    words.forEach((word, index) => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word';
        wordElement.id = `word-${index}`;
        wordElement.draggable = true;
        wordElement.addEventListener('dragstart', drag);
        wordElement.textContent = word.trim();
        wordBank.appendChild(wordElement);
    });
}

async function fetchTodayWords() {
    try {
        const response = await fetch('today_words.json');
        const words = await response.json();
        
        // Clear and populate word bank directly
        const wordBank = document.getElementById('wordBank');
        wordBank.innerHTML = '';
        
        words.forEach((word, index) => {
            const wordElement = document.createElement('div');
            wordElement.className = 'word';
            wordElement.id = `word-${index}`;
            wordElement.draggable = true;
            wordElement.addEventListener('dragstart', drag);
            wordElement.textContent = word.trim();
            wordBank.appendChild(wordElement);
        });
    } catch (error) {
        console.error('Error fetching today\'s words:', error);
    }
} 
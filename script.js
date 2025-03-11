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
        // Check if the word is from a locked row
        const sourceRow = draggedElement.closest('.grid-row');
        if (sourceRow && sourceRow.classList.contains('locked')) {
            return; // Prevent dropping locked words
        }
        const wordBank = document.getElementById('wordBank');
        wordBank.appendChild(draggedElement);
        
        // Check row completion after removing word
        if (sourceRow) {
            checkRowCompletion(sourceRow);
        }
        return;
    }
    
    // For grid cells, get the actual cell
    dropTarget = dropTarget.classList.contains('grid-cell') ? 
        dropTarget : 
        dropTarget.classList.contains('word') ? 
            dropTarget.parentElement : null;
    
    // Check if target cell is in a locked row
    const targetRow = dropTarget?.closest('.grid-row');
    if (targetRow?.classList.contains('locked')) {
        return; // Prevent dropping into locked rows
    }
    
    if (dropTarget && dropTarget.classList.contains('grid-cell')) {
        // Handle the drop as before...
        if (!dropTarget.hasChildNodes()) {
            dropTarget.appendChild(draggedElement);
        } else {
            const existingWord = dropTarget.firstChild;
            const draggedParent = draggedElement.parentElement;
            
            // Check if either word is in a locked row
            const existingWordRow = existingWord.closest('.grid-row');
            if (existingWordRow?.classList.contains('locked')) {
                return; // Prevent swapping with locked words
            }
            
            if (draggedParent.id === 'wordBank') {
                dropTarget.appendChild(draggedElement);
                document.getElementById('wordBank').appendChild(existingWord);
            } else {
                draggedParent.appendChild(existingWord);
                dropTarget.appendChild(draggedElement);
            }
        }
        
        // Check row completion after drop
        checkRowCompletion(targetRow);
        const sourceRow = draggedElement.closest('.grid-row');
        if (sourceRow && sourceRow !== targetRow) {
            checkRowCompletion(sourceRow);
        }
    }
}

function resetGrid() {
    const wordBank = document.getElementById('wordBank');
    const gridCells = document.querySelectorAll('.grid-cell');
    
    // Move only unlocked words back to word bank
    gridCells.forEach(cell => {
        if (cell.firstChild && !cell.closest('.grid-row').classList.contains('locked')) {
            wordBank.appendChild(cell.firstChild);
        }
    });
    
    // Update lock buttons visibility
    document.querySelectorAll('.grid-row').forEach(row => {
        checkRowCompletion(row);
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

function toggleLock(checkbox) {
    const gridRow = checkbox.closest('.grid-row');
    const isLocked = checkbox.checked;
    gridRow.classList.toggle('locked', isLocked);
    
    // Update draggable property for words in this row
    const words = gridRow.querySelectorAll('.word');
    words.forEach(word => {
        word.draggable = !isLocked;
    });
}

function checkRowCompletion(row) {
    const cells = row.querySelectorAll('.grid-cell');
    const toggleSwitch = row.querySelector('.toggle-switch');
    const isFull = Array.from(cells).every(cell => cell.children.length > 0);
    
    // Show/hide toggle switch based on row completion
    toggleSwitch.style.display = isFull ? 'inline-block' : 'none';
} 
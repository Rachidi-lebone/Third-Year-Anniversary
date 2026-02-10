export function setupPuzzle(navigateTo) {
    const board = document.getElementById('puzzle-board');
    const piecesContainer = document.getElementById('puzzle-pieces-container');
    const continueBtn = document.getElementById('puzzle-continue-btn');
    const hintContainer = document.getElementById('puzzle-hint-container');

    const gridSize = 4;
    const numPieces = gridSize * gridSize;
    const pieceSize = 75; // as defined in CSS
    
    let placedPieces = 0;
    
    // Clear previous puzzle state
    board.innerHTML = '';
    piecesContainer.innerHTML = '';
    hintContainer.innerHTML = '';
    continueBtn.style.display = 'none';

    const pieces = [];
    for (let i = 0; i < numPieces; i++) {
        const col = i % gridSize;
        const row = Math.floor(i / gridSize);

        // Create puzzle slots in the board
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot';
        slot.dataset.index = i;
        board.appendChild(slot);
        
        slot.addEventListener('dragover', e => e.preventDefault());
        slot.addEventListener('drop', handleDrop);

        // Create draggable pieces
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        piece.draggable = true;
        piece.dataset.index = i;
        piece.style.backgroundPosition = `-${col * pieceSize}px -${row * pieceSize}px`;
        pieces.push(piece);
        
        piece.addEventListener('dragstart', handleDragStart);
    }
    
    // Shuffle and append pieces
    pieces.sort(() => Math.random() - 0.5).forEach(piece => piecesContainer.appendChild(piece));

    showHint();

    function showHint() {
        // Find a piece that hasn't been placed (the first one in the shuffled array will do)
        const hintPieceIndex = pieces.find(p => !p.classList.contains('snapped'))?.dataset.index;
        if (hintPieceIndex === undefined) return;

        const hintCol = hintPieceIndex % gridSize;
        const hintRow = Math.floor(hintPieceIndex / gridSize);

        const hintPiece = document.createElement('div');
        hintPiece.className = 'puzzle-hint-piece';
        hintPiece.style.width = `${pieceSize}px`;
        hintPiece.style.height = `${pieceSize}px`;
        hintPiece.style.top = `${hintRow * pieceSize}px`;
        hintPiece.style.left = `${hintCol * pieceSize}px`;
        hintPiece.style.backgroundPosition = `-${hintCol * pieceSize}px -${hintRow * pieceSize}px`;
        
        hintContainer.appendChild(hintPiece);
        
        setTimeout(() => {
           if (hintContainer.contains(hintPiece)) {
               hintContainer.removeChild(hintPiece);
           }
        }, 3000); // Animation duration
    }

    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
    }

    function handleDrop(e) {
        e.preventDefault();
        const pieceIndex = e.dataTransfer.getData('text/plain');
        const slot = e.target.closest('.puzzle-slot');

        if (slot && pieceIndex === slot.dataset.index) {
            const piece = document.querySelector(`.puzzle-piece[data-index='${pieceIndex}']`);
            
            slot.appendChild(piece);
            piece.style.position = 'absolute';
            piece.style.top = '0';
            piece.style.left = '0';
            piece.classList.add('snapped');
            piece.draggable = false;
            
            placedPieces++;
            checkCompletion();
        }
    }

    function checkCompletion() {
        if (placedPieces >= 1) { // Show hint after first piece is placed
             // Only show hint if there are pieces left to place
            const remainingPieces = document.querySelectorAll('.puzzle-piece:not(.snapped)').length;
            if (remainingPieces > 0) {
                 setTimeout(showHint, 500);
            }
        }
        
        const requiredPieces = Math.floor(numPieces * 0.95); // Approx 95%
        if (placedPieces >= requiredPieces) {
            // Auto-complete the rest
            document.querySelectorAll('.puzzle-piece:not(.snapped)').forEach(p => {
                const index = p.dataset.index;
                const slot = document.querySelector(`.puzzle-slot[data-index='${index}']`);
                slot.appendChild(p);
                p.style.position = 'absolute';
                p.style.top = '0';
                p.style.left = '0';
                p.classList.add('snapped');
                p.draggable = false;
            });
            continueBtn.style.display = 'block';
        }
    }
}
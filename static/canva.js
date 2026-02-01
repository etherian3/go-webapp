const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
const canvasContainer = document.querySelector('.canvas-container');
if (canvasContainer) {
  canvas.width = canvasContainer.clientWidth - 40;
  canvas.height = canvasContainer.clientHeight - 40;
} else {
  canvas.width = 800;
  canvas.height = 600;
}
canvas.style.backgroundColor = '#FFFFFF';

// Drawing state
let isDrawing = false;
let currentColor = '#000000';
let brushSize = 5;
let currentTool = 'brush'; // brush, rectangle, circle, arrow, triangle, text
let fillShape = false;
let startX, startY;
let snapshot;

// Initialize color
const colorBtns = document.querySelectorAll('.clr');
colorBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentColor = btn.dataset.clr;
    document.querySelectorAll('.clr').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Color picker
const favcolor = document.getElementById('favcolor');
if (favcolor) {
  favcolor.addEventListener('input', (e) => {
    currentColor = e.target.value;
  });
}

// Background color
const bgcolor = document.getElementById('bgcolor');
if (bgcolor) {
  bgcolor.addEventListener('input', (e) => {
    canvas.style.backgroundColor = e.target.value;
  });
}

// Fill shape checkbox
const fillShapeCheckbox = document.getElementById('fillShape');
if (fillShapeCheckbox) {
  fillShapeCheckbox.addEventListener('change', (e) => {
    fillShape = e.target.checked;
  });
}

// Brush size
const brushSizeInput = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
if (brushSizeInput) {
  brushSizeInput.addEventListener('input', (e) => {
    brushSize = e.target.value;
    if (brushSizeValue) {
      brushSizeValue.textContent = brushSize;
    }
  });
}

// Tool buttons (if they exist)
const toolButtons = document.querySelectorAll('.tool-btn');
if (toolButtons.length > 0) {
  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentTool = btn.dataset.tool;
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// Clear button
const clearBtn = document.getElementById('clear');
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

// Save button
const saveBtn = document.getElementById('save');
if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    // Create a temporary canvas to composite background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Fill with background color
    const bgColor = canvas.style.backgroundColor || '#FFFFFF';
    tempCtx.fillStyle = bgColor;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the canvas content on top
    tempCtx.drawImage(canvas, 0, 0);

    // Save the composite image
    const link = document.createElement('a');
    link.download = `canvas-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL();
    link.click();
  });
}

// Drawing functions
function startDraw(e) {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;

  if (currentTool === 'brush') {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
  } else {
    // Save canvas state for shapes
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
}

function draw(e) {
  if (!isDrawing) return;

  const rect = canvas.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;

  ctx.strokeStyle = currentColor;
  ctx.fillStyle = currentColor;
  ctx.lineWidth = brushSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (currentTool === 'brush') {
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
  } else {
    // Restore canvas for shape preview
    ctx.putImageData(snapshot, 0, 0);

    const width = currentX - startX;
    const height = currentY - startY;

    switch (currentTool) {
      case 'rectangle':
        drawRectangle(startX, startY, width, height);
        break;
      case 'circle':
        drawCircle(startX, startY, currentX, currentY);
        break;
      case 'arrow':
        drawArrow(startX, startY, currentX, currentY);
        break;
      case 'triangle':
        drawTriangle(startX, startY, currentX, currentY);
        break;
    }
  }
}

function stopDraw() {
  if (isDrawing && currentTool === 'text') {
    const rect = canvas.getBoundingClientRect();
    const x = startX;
    const y = startY;

    const text = prompt('Enter text:');
    if (text) {
      ctx.font = `${brushSize * 5}px Arial`;
      ctx.fillStyle = currentColor;
      ctx.fillText(text, x, y);
    }
  }

  isDrawing = false;
  ctx.beginPath();
}

// Shape drawing functions
function drawRectangle(x, y, width, height) {
  if (fillShape) {
    ctx.fillRect(x, y, width, height);
  }
  ctx.strokeRect(x, y, width, height);
}

function drawCircle(x1, y1, x2, y2) {
  const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  ctx.beginPath();
  ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
  if (fillShape) {
    ctx.fill();
  }
  ctx.stroke();
}

function drawArrow(fromX, fromY, toX, toY) {
  const headlen = 15;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  // Draw line
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Draw arrowhead
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

function drawTriangle(x1, y1, x2, y2) {
  const width = x2 - x1;
  const height = y2 - y1;

  ctx.beginPath();
  ctx.moveTo(x1 + width / 2, y1); // Top point
  ctx.lineTo(x1, y2); // Bottom left
  ctx.lineTo(x2, y2); // Bottom right
  ctx.closePath();
  if (fillShape) {
    ctx.fill();
  }
  ctx.stroke();
}

// Event listeners
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDraw);
canvas.addEventListener('mouseout', stopDraw);

// Touch support for mobile
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  const mouseEvent = new MouseEvent('mouseup', {});
  canvas.dispatchEvent(mouseEvent);
});

// Resize canvas when window resizes
window.addEventListener('resize', () => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const canvasContainer = document.querySelector('.canvas-container');
  if (canvasContainer) {
    canvas.width = canvasContainer.clientWidth - 40;
    canvas.height = canvasContainer.clientHeight - 40;
  }
  ctx.putImageData(imageData, 0, 0);
});

// Set initial active color
if (colorBtns.length > 0) {
  colorBtns[0].classList.add('active');
}

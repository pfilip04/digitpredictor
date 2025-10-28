const clearButton = document.getElementById('clearbutton');
const undoButton = document.getElementById('undobutton');
const predictButton = document.getElementById('predictbutton');

const canvas = document.getElementById('paintcanvas');
const ctx = canvas.getContext('2d');

let boundary = canvas.getBoundingClientRect();

function calculateSize() {
  return (canvas.width + canvas.height) / 300;
}

let currentSize = calculateSize();

let lastEvent = null;
let needsRedraw = false;

let painting = false;
let strokes = [];
let currentStroke = [];

ctx.strokeStyle = '#9f9f9f';

function drawFrame() {
  if (!painting || !lastEvent) {
    needsRedraw = false;
    return;
  }

  ctx.lineWidth = currentSize;

  const x = lastEvent.clientX - boundary.left;
  const y = lastEvent.clientY - boundary.top;

  const point = { x: x / canvas.width, y: y / canvas.height };
  currentStroke.push(point);

  ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
  ctx.stroke();

  needsRedraw = false;
}

function updateStrokeStyle() {
    currentSize = calculateSize();

    ctx.strokeStyle = '#9f9f9f';
    ctx.lineWidth = currentSize;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
}

function startPosition(e) {
  painting = true;

  const x = e.clientX - boundary.left;
  const y = e.clientY - boundary.top;

  const point = {x: x / canvas.width, y: y / canvas.height}

  currentStroke = [point];

  ctx.beginPath();
  ctx.moveTo(point.x * canvas.width, point.y * canvas.height);
}

function endPosition() {
  if (!painting) return;
  painting = false;

  if (currentStroke && currentStroke.length > 0) {
    strokes.push(currentStroke);
  }

  currentStroke = null;
}

function draw(e) {
  if (!painting) return;

  lastEvent = e;
  if (!needsRedraw) {
    needsRedraw = true;
    requestAnimationFrame(drawFrame);
  }
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const stroke of strokes) {
    if (!stroke || stroke.length === 0) continue;

    ctx.beginPath();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const start = stroke[0];
    ctx.moveTo(start.x * canvas.width, start.y * canvas.height);

    for (let i = 1; i < stroke.length; i++) {
      const point = stroke[i];
      ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
    }
    ctx.stroke();
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  boundary = canvas.getBoundingClientRect();

  updateStrokeStyle();
  requestAnimationFrame(redraw);
}

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes = [];
}

function undo() {
  strokes.pop();
  requestAnimationFrame(redraw);
}

function normalize(n, d) {
    const max = Math.max(canvas.width, canvas.height)

    if (d) {
        return (n * canvas.width + (max - canvas.width)) / max;
    }
    return (n * canvas.height + (max - canvas.height)) / max;
}

function range() {
  let xmin = 1;
  let ymin = 1;
  let xmax = 0;
  let ymax = 0;

  for (const stroke of strokes) {
    for (const point of stroke) {
      if (point.x < xmin) xmin = point.x;
      if (point.y < ymin) ymin = point.y;

      if (point.x > xmax) xmax = point.x;
      if (point.y > ymax) ymax = point.y;
    }
  }
  return {
    min: { x: normalize(xmin, 1), y: normalize(ymin, 0) },
    max: { x: normalize(xmax, 1), y: normalize(ymax, 0) }
  };
}

function scaled() {
  const bounds = range();

  const x = bounds.max.x - bounds.min.x;
  const y = bounds.max.y - bounds.min.y;

  let a = 1.2 * Math.max(x, y);

  let padX = (a - x) / 2;
  let padY = (a - y) / 2;

  const scale = 1 / a;

  return {
    min: { x: bounds.min.x - padX, y: bounds.min.y - padY },
    scale: scale
  };
}

function coordinates() {
  const scales = scaled();

  return strokes.map(stroke =>
    stroke.map(point => ({
      x: (normalize(point.x, 1) - scales.min.x) * scales.scale,
      y: (normalize(point.y, 0) - scales.min.y) * scales.scale
    }))
  );
}

function image() {
  const strokes1 = coordinates();

  const canvas1 = document.createElement("canvas");
  canvas1.width = 28;
  canvas1.height = 28;
  const ctx1 = canvas1.getContext("2d");

  ctx1.fillStyle = "black";
  ctx1.fillRect(0, 0, canvas1.width, canvas1.height);

  const currentSize1 = 1.4;

  ctx1.strokeStyle = "white";
  ctx1.lineWidth = currentSize1;
  ctx1.lineJoin = ctx.lineJoin;
  ctx1.lineCap = ctx.lineCap;

  ctx1.beginPath();

  for (const stroke of strokes1) {
    if (stroke.length > 0) {
      ctx1.moveTo(stroke[0].x * canvas1.width, stroke[0].y * canvas1.height);
      for (let i = 1; i < stroke.length; i++) {
        ctx1.lineTo(stroke[i].x * canvas1.width, stroke[i].y * canvas1.height);
      }
    }
  }
  ctx1.stroke();

  return canvas1;
}

function predict() {
  let image1 = image()
  let dataURL = image1.toDataURL("image/png");
  fetch("/predict/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify({ image: dataURL }),
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      console.log(`Error: ${data.error}`);
      document.querySelector('.result').innerText = "Err";
      return;
    }

    document.getElementById("resultn").innerHTML = `${data.predicted}`;
    document.getElementById("resultc").innerHTML = `${data.confidence}% confident`;

    let html = "";
    data.contenders.forEach(c => {
      html += `<li>${c.digit} - ${c.confidence}%</li>`;
    });

    document.getElementById("contenders").innerHTML = html;
  })
  .catch(err => {
    console.error(`Error: ${err}`);
    document.querySelector('.result').innerText = "Err";
  });
}

function getCookie(name) {
  let cookieValue = null;
  document.cookie.split(";").forEach(cookie => {
    cookie = cookie.trim();
    if (cookie.startsWith(name + "=")) {
      cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
    }
  });
  return cookieValue;
}

resizeCanvas();

canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mouseout', endPosition);
canvas.addEventListener('mousemove', draw);

window.addEventListener('resize', resizeCanvas);

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  startPosition(touch);
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  draw(touch);
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  endPosition();
});

clearButton.addEventListener('click', clear);

undoButton.addEventListener('click', undo);

predictButton.addEventListener('click', predict);

const cursor = document.querySelector(".shirt-cursor");
const leftSleeve = document.querySelector(".sleeve-left");
const rightSleeve = document.querySelector(".sleeve-right");
const body = document.querySelector(".shirt-body");

let mouse = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  previousX: window.innerWidth / 2,
  previousY: window.innerHeight / 2
};

let position = { x: mouse.x, y: mouse.y };
let velocity = { x: 0, y: 0 };

let rotation = { x: 0, y: 0, z: 0 };
let sleeve = { left: 0, right: 0 };

let lastTime = 0;

window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  cursor.classList.add("is-visible");
});

document.documentElement.addEventListener("mouseleave", () => {
  cursor.classList.remove("is-visible");
});

document.documentElement.addEventListener("mouseenter", () => {
  cursor.classList.add("is-visible");
});

function lerp(current, target, amount) {
  return current + (target - current) * amount;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function animate(time) {
  const delta = Math.min((time - (lastTime || time)) / 16.67, 2);
  lastTime = time;

  // Mouse movement velocity
  const moveX = mouse.x - mouse.previousX;
  const moveY = mouse.y - mouse.previousY;

  velocity.x = lerp(velocity.x, moveX, 0.35);
  velocity.y = lerp(velocity.y, moveY, 0.35);

  mouse.previousX = mouse.x;
  mouse.previousY = mouse.y;

  // Smooth cursor following
  position.x = lerp(position.x, mouse.x, 0.14 * delta);
  position.y = lerp(position.y, mouse.y, 0.14 * delta);

  // Movement-based 3D rotation
  const targetRotateY = clamp(velocity.x * 0.65, -22, 22);
  const targetRotateX = clamp(-velocity.y * 0.55, -18, 18);

  rotation.x = lerp(rotation.x, targetRotateX, 0.09 * delta);
  rotation.y = lerp(rotation.y, targetRotateY, 0.09 * delta);

  // Gentle idle movement
  const float = Math.sin(time * 0.0025) * 5;
  const breathe = Math.sin(time * 0.003) * 2;
  const idleRotate = Math.sin(time * 0.0018) * 3;

  rotation.z = lerp(
    rotation.z,
    clamp(velocity.x * 0.16, -8, 8),
    0.08 * delta
  );

  // Sleeve movement — independent fabric swing
  const leftTarget = clamp(
    -velocity.x * 0.3 + velocity.y * 0.12,
    -15,
    15
  );

  const rightTarget = clamp(
    velocity.x * 0.3 - velocity.y * 0.12,
    -15,
    15
  );

  sleeve.left = lerp(sleeve.left, leftTarget, 0.12 * delta);
  sleeve.right = lerp(sleeve.right, rightTarget, 0.12 * delta);

  const leftIdle = Math.sin(time * 0.004) * 2.5;
  const rightIdle = Math.sin(time * 0.0045 + 1) * 2.5;

  // Slight stretch while moving
  const speed = Math.min(
    Math.hypot(velocity.x, velocity.y) / 35,
    1
  );

  const scale = 1 + speed * 0.025 + breathe * 0.001;

  // Apply main jersey animation
  cursor.style.transform = `
    translate3d(${position.x}px, ${position.y + float}px, 0)
    translate(-50%, -50%)
    perspective(700px)
    rotateX(${rotation.x}deg)
    rotateY(${rotation.y}deg)
    rotateZ(${rotation.z + idleRotate}deg)
    scale(${scale})
  `;

  // Left sleeve
  leftSleeve.style.transform = `
    rotate(${sleeve.left + leftIdle}deg)
  `;

  // Right sleeve
  rightSleeve.style.transform = `
    rotate(${sleeve.right + rightIdle}deg)
  `;

  // Subtle body movement
  body.style.transform = `
    translateY(${Math.sin(time * 0.003) * 1.5}px)
  `;

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

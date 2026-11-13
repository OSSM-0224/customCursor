const cursor = document.querySelector(".shirt-cursor");
const leftSleeve = document.querySelector(".sleeve-left");
const rightSleeve = document.querySelector(".sleeve-right");

let targetX = window.innerWidth / 2;
let targetY = window.innerHeight / 2;
let x = targetX;
let y = targetY;
let lastX = targetX;
let lastY = targetY;
let velocityX = 0;
let velocityY = 0;
let shirtTilt = 0;
let leftAngle = 0;
let rightAngle = 0;

window.addEventListener("mousemove", (event) => {
  targetX = event.clientX;
  targetY = event.clientY;
  cursor.classList.add("is-visible");
});

document.documentElement.addEventListener("mouseleave", () => {
  cursor.classList.remove("is-visible");
});

function animate() {
  // Main shirt smoothly follows the pointer with a little inertia.
  x += (targetX - x) * 0.17;
  y += (targetY - y) * 0.17;

  velocityX = targetX - lastX;
  velocityY = targetY - lastY;

  // Clamp the rotation so fast mouse movements do not flip the shirt.
  const speedTilt = Math.max(-12, Math.min(12, velocityX * 0.22));
  shirtTilt += (speedTilt - shirtTilt) * 0.10;

  // Each sleeve gets its own delayed swing, like loose fabric.
  const leftTarget = Math.max(-13, Math.min(13, -velocityX * 0.28 + velocityY * 0.08));
  const rightTarget = Math.max(-13, Math.min(13, velocityX * 0.25 - velocityY * 0.06));
  leftAngle += (leftTarget - leftAngle) * 0.13;
  rightAngle += (rightTarget - rightAngle) * 0.11;

  // Gentle idle float remains even when the mouse stops.
  const time = performance.now();
  const bob = Math.sin(time * 0.0035) * 2.5;
  const idleSway = Math.sin(time * 0.0025) * 1.4;

  cursor.style.transform =
    `translate3d(${x}px, ${y + bob}px, 0) ` +
    `translate(-50%, -50%) rotate(${shirtTilt + idleSway}deg)`;

  leftSleeve.style.transform = `rotate(${leftAngle + Math.sin(time * 0.004) * 1.2}deg)`;
  rightSleeve.style.transform = `rotate(${rightAngle - Math.sin(time * 0.0042) * 1.2}deg)`;

  lastX = targetX;
  lastY = targetY;
  requestAnimationFrame(animate);
}

animate();

import { $ } from "./utils.js";

export function initCounter(targetCount) {
  const counter = $("#counter-num");
  if (!counter) return;

  const target = Number(counter.dataset.target) || targetCount;
  let hasAnimated = false;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          animateCount(counter, 0, target, 2000);
        }
      });
    },
    { threshold: 0.3 },
  );
  observer.observe(counter);
}

function animateCount(element, from, to, duration) {
  const start = performance.now();
  const step = (timestamp) => {
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent =
      Math.floor(from + (to - from) * eased).toLocaleString() + "+";
    if (progress < 1) requestAnimationFrame(step);
    else element.textContent = to.toLocaleString() + "+";
  };
  requestAnimationFrame(step);
}

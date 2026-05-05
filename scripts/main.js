if (window.AOS) {
  AOS.init({
    anchorPlacement: "top-left",
    duration: 800,
    once: true
  });
}

const navToggle = document.querySelector(".nav-toggle");
const navList = document.querySelector(".nav-list");
const ageTarget = document.getElementById("age");
const cursor = document.querySelector(".cursor-main");
const characterScene = document.querySelector(".character-scene");
const particleLayer = document.querySelector(".character-particles");

function setMenu(open) {
  document.body.classList.toggle("nav-open", open);
  navList?.classList.toggle("open", open);
  navToggle?.setAttribute("aria-expanded", String(open));
}

function updateAge() {
  if (!ageTarget) return;

  const birthDate = new Date(2003, 0, 28);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!birthdayPassed) {
    age -= 1;
  }

  ageTarget.textContent = age;
}

navToggle?.addEventListener("click", () => setMenu(!navList?.classList.contains("open")));
navList?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

if (cursor) {
  window.addEventListener(
    "pointermove",
    (event) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;

      if (characterScene && window.matchMedia("(min-width: 1026px)").matches) {
        const halfX = window.innerWidth / 2;
        const halfY = window.innerHeight / 2;
        const rotateX = ((event.clientX - halfX) / halfX) * 9;
        const rotateY = ((halfY - event.clientY) / halfY) * 6;

        characterScene.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
        characterScene.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
        characterScene.style.setProperty("--lift-z", `${Math.abs(rotateX).toFixed(1)}px`);
      }
    },
    { passive: true }
  );
}

if (particleLayer) {
  const particles = 28;

  for (let index = 0; index < particles; index += 1) {
    const particle = document.createElement("span");
    const angle = (index / particles) * Math.PI * 2;
    const radius = 28 + (index % 7) * 8;
    const x = 50 + Math.cos(angle) * radius;
    const y = 48 + Math.sin(angle) * (radius * 0.78);
    const size = 2 + (index % 4);

    particle.className = "character-particle";
    particle.style.setProperty("--px", `${x.toFixed(2)}%`);
    particle.style.setProperty("--py", `${y.toFixed(2)}%`);
    particle.style.setProperty("--ps", `${size}px`);
    particle.style.setProperty("--pz", `${80 + (index % 6) * 38}px`);
    particle.style.setProperty("--dx", `${Math.cos(angle + 0.7) * 18}px`);
    particle.style.setProperty("--dy", `${Math.sin(angle + 0.7) * 24}px`);
    particle.style.setProperty("--pd", `${3.4 + (index % 6) * 0.35}s`);
    particle.style.setProperty("--delay", `${index * -0.17}s`);

    particleLayer.appendChild(particle);
  }
}

updateAge();

/**
 * Root Hub Portal - Interactive Dynamics
 */

document.addEventListener('DOMContentLoaded', () => {
  const rootStyle = document.documentElement.style;
  const orbs = [
    document.querySelector('.orb-1'),
    document.querySelector('.orb-2'),
    document.querySelector('.orb-3')
  ];

  let targetX = 50;
  let targetY = 50;
  let currentX = 50;
  let currentY = 50;

  window.addEventListener('mousemove', (e) => {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    targetX = Math.max(0, Math.min(100, (e.clientX / width) * 100));
    targetY = Math.max(0, Math.min(100, (e.clientY / height) * 100));
  });

  function renderAmbient() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    rootStyle.setProperty('--mouse-x', `${currentX.toFixed(2)}%`);
    rootStyle.setProperty('--mouse-y', `${currentY.toFixed(2)}%`);

    const offsetX = (currentX - 50) * 0.3;
    const offsetY = (currentY - 50) * 0.3;

    if (orbs[0]) orbs[0].style.transform = `translate(${offsetX * 0.8}px, ${offsetY * 0.8}px)`;
    if (orbs[1]) orbs[1].style.transform = `translate(${-offsetX * 0.7}px, ${-offsetY * 0.7}px)`;
    if (orbs[2]) orbs[2].style.transform = `translate(${offsetX * 0.5}px, ${-offsetY * 0.6}px)`;

    requestAnimationFrame(renderAmbient);
  }
  requestAnimationFrame(renderAmbient);

  // 3D Tilt Hover Effect for Cards
  const cards = document.querySelectorAll('.service-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });
});

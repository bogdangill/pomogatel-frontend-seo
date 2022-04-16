// Credits: Bret Cameron https://css-tricks.com/how-to-recreate-the-ripple-effect-of-material-design-buttons/

function createRipple(event) {
    const button = event.currentTarget;

    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    console.log(button.offsetLeft + ' ' + button.offsetTop);

    circle.style.cssText = `
        width: ${diameter}px;
        height: ${diameter}px;
        left: ${event.clientX - button.offsetLeft - radius}px;
        top: ${event.clientY - button.offsetTop - radius}px;
    `;

    circle.classList.add("ripple");

    const ripple = button.querySelector(".ripple");

    if (ripple) {
        ripple.remove();
    }

    button.appendChild(circle);
}

const buttons = document.querySelectorAll(".btn--ripple");

for (const button of buttons) {
    button.addEventListener("click", createRipple);
}
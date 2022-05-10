export default class Ripple {
    constructor(
        targetSelector = '[data-ripple]',
        {
            circleTag = "span",
            circleColor = "default",
            enableForDesktop = true,
        }
    ){
        this.target = targetSelector;
        this.circleTag = circleTag;
        this.circleColor = circleColor;
        this.width = this.target.clientWidth;
        this.height = this.target.clientHeight;

        if (enableForDesktop) {
            this.init();
        } else {
            if (window.outerWidth < 1199) {
                this.init();
            }
        }
    }

    init() {
        this.target.addEventListener('click', (event) => {
            this.target.classList.add('ripple');

            const circle = document.createElement(this.circleTag);
            const diameter = Math.max(this.width, this.height);
            const radius = diameter / 2;

            //рассчитываем координаты кнопки относительно вьюпорта(lose ripple when scrolling fix)
            let viewportOffset = this.target.getBoundingClientRect();

            circle.style.cssText = `
                width: ${diameter}px;
                height: ${diameter}px;
                left: ${event.pageX - scrollX - (viewportOffset.left + radius)}px;
                top: ${event.pageY - scrollY - (viewportOffset.top + radius)}px;
            `;

            circle.classList.add(`ripple__circle`);

            if (this.circleColor) circle.classList.add(`ripple__circle--${this.circleColor}`);

            const ripple = this.target.querySelector(".ripple__circle");
            if (ripple) ripple.remove();
            this.target.appendChild(circle);
        })
    }
}
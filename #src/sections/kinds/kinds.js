import Ripple from "../../modules/ripple/ripple";

let kinds = document.querySelectorAll("[data-ripple='kind']");

for (let kind of kinds) {
    new Ripple(kind, {
        circleColor: 'primary',
        enableForDesktop: false
    })
}
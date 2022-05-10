import '../../modules/dropdown/dropdown.js';
import Ripple from '../../modules/ripple/ripple.js';
import '../../sections/nav-top/nav-top.js';

const rippleTargets = document.querySelectorAll("[data-ripple='btn']");

for (let target of rippleTargets) {
    new Ripple(target, {
        circleTag: 'span',
        circleColor: 'default',
        enableForDesktop: false
    });
}
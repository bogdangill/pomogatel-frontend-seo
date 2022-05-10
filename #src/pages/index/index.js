import '../../modules/accordion/accordion.js';
import '../../modules/dropdown/dropdown.js';
import Ripple from '../../modules/ripple/ripple.js';
import '../../sections/reviews/reviews.js';

const rippleTargets = document.querySelectorAll("[data-ripple='btn']");

for (let target of rippleTargets) {
    new Ripple(target, {
        circleTag: 'span',
        circleColor: 'default',
        enableForDesktop: false
    });
}
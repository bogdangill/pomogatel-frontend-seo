import '../modules/accordion/accordion.js';
import '../modules/dropdown/dropdown.js';
import '../modules/btn/btn.js';


let counter = document.querySelector('.slider__counter');
let slidesContainer = document.querySelector('.swiper-wrapper');

const swiper = new Swiper('.swiper-container', {
  autoplay: true,
  speed: 1000,
  effect: 'fade',
  navigation: {
    nextEl: '.btn--control--right',
    prevEl: '.btn--control--left'
  },
  simulateTouch: false,
  on: {
    init: () => {
      counter.innerHTML = 1 + '/' + slidesContainer.children.length;
    },
    slideChange: function() {
      counter.innerHTML = (this.activeIndex + 1) + '/' + swiper.slides.length;
    }
  }
});

swiper.init();
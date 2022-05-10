import Swiper, { Navigation, A11y } from "swiper";
import Ripple from "../../modules/ripple/ripple";

const carousels = document.querySelectorAll('[data-carousel]');

for (let carousel of carousels) {
    let carouselName = carousel.getAttribute('data-carousel');
    let navTopLinks = carousel.querySelectorAll("[data-ripple='navLink']");
    let navButtons = carousel.querySelectorAll("[data-ripple='carouselBtn']")

    new Swiper(`[data-carousel=${carouselName}]`, {
        modules: [Navigation, A11y],
        slidesPerView: "auto",
        allowTouchMove: false,
        watchSlidesProgress: true, //фикс ненужного перелистывания карусели при клике на слайд
        navigation: {
            nextEl: `.nav-top__btn--right.nav-top__btn--${carouselName}`,
            prevEl: `.nav-top__btn--left.nav-top__btn--${carouselName}`,
        }
    })

    for (let link of navTopLinks) {
        new Ripple(link, {
            circleColor: 'primary',
            enableForDesktop: false
        })
    }

    for (let btn of navButtons) {
        new Ripple(btn, {
            circleColor: 'gray',
            enableForDesktop: false
        })
    }
}
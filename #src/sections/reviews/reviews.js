const swipers = document.querySelectorAll('[data-slider]');

if (swipers.length) {
    const sliderReviews = new Swiper('[data-slider="reviews"]', {
        spaceBetween: 32,
        slidesPerView: 'auto',
        initialSlide: 1,
        centeredSlides: true,
        breakpoints: {
            767: {
                spaceBetween: 16,
                slidesPerView: 3,
                centeredSlides: false
            },
            1199: {
                spaceBetween: 32,
                slidesPerView: 3,
                centeredSlides: false
            }
        },
        pagination: {
            el: '.swiper-pagination',
            type: 'bullets',
        }
    });

    sliderReviews.init();
}
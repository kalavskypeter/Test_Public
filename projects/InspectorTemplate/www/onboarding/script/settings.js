var slides = document.getElementsByClassName("swiper-slide").length;
var changeRatio = (slides - 1.5) / (slides - 1);
var footerAction = document.getElementById('footerAction');

var mySwiper = new Swiper('.swiper-container', {
    speed: 400,
    parallax: true,
    effect: 'slide',
    resistance: true,
    resistanceRatio: 0,

    pagination: {
        el: '.swiper-pagination'
    },

    navigation: {
        prevEl: '.swiper-button-prev',
        nextEl: '.swiper-button-next',
    },
    on: {
        progress: function(progress) {
            if (progress > changeRatio) {
                footerAction.innerHTML = "Let's go!";
            } else {
                footerAction.innerHTML = "Skip the tour";
            }
        }
    }
});
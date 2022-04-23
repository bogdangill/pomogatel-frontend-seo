const accordions = document.querySelectorAll('.accordion');

//добавяю дефолтный модификатор таким способом, чтобы контент был визуально доступен даже если js выключен в браузере
accordions.forEach(acc => acc.classList.add('accordion--hidden'));

function toggleAcc(acc, isOpened) {
    let accBody = acc.querySelector('.accordion__body');
    let accBodyInnerHeight = 0;

    if (accBody.hasChildNodes()) {
        let children = accBody.childNodes;

        for (let child of children) {
            //без проверки помимо высоты детей суммирует непонятно откуда взявшийся undefined и в итоге NaN. костыль.
            if (child.offsetHeight !== undefined) accBodyInnerHeight += child.offsetHeight;
        }
    }

    if (isOpened) {
        accBody.style.height = 0;
        acc.classList.remove('accordion--visible');
        acc.classList.add('accordion--hidden');
        acc.querySelector('.accordion__trigger').setAttribute('aria-expanded', 'false');
    } else {
        accBody.style.height = accBodyInnerHeight + 'px';
        acc.classList.remove('accordion--hidden');
        acc.classList.add('accordion--visible');
        acc.querySelector('.accordion__trigger').setAttribute('aria-expanded', 'true');
    }
}

if (accordions.length > 0) {
    accordions.forEach(accordion => {
        accordion.addEventListener("click", () => {
            if (accordion.classList.contains('accordion--visible')) {
                toggleAcc(accordion, true);
                return
            }

            accordions.forEach(acc => toggleAcc(acc, true));

            if (accordion.classList.contains('accordion--hidden')) {
                toggleAcc(accordion)
            }
        })
    })
}
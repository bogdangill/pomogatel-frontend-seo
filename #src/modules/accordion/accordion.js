const accordions = document.querySelectorAll('.accordion');

//добавяю дефолтный модификатор таким способом, чтобы контент был визуально доступен даже если js выключен в браузере
accordions.forEach(acc => acc.classList.add('accordion--hidden'));

function closeAcc(acc) {
    acc.classList.remove('accordion--visible');
    acc.classList.add('accordion--hidden');
    acc.querySelector('.accordion__trigger').setAttribute('aria-expanded', 'false');
}

if (accordions.length > 0) {
    accordions.forEach(accordion => {
        accordion.addEventListener("click", () => {
            let accBody = accordion.querySelector('.accordion__body');
            let accBodyInnerHeight = 0;

            if (accBody.hasChildNodes()) {
                let children = accBody.childNodes;

                for (let child of children) {
                    //без проверки помимо высоты детей суммирует непонятно откуда взявшийся undefined и в итоге NaN. костыль.
                    if (child.offsetHeight !== undefined) accBodyInnerHeight += child.offsetHeight;
                }
            }

            if (accordion.classList.contains('accordion--hidden')) {
                accordions.forEach(acc => closeAcc(acc))
            } else {
                closeAcc(accordion)
                return
            }

            accBody.style.height = accBodyInnerHeight + 'px';
            accordion.classList.remove('accordion--hidden');
            accordion.classList.add('accordion--visible');
            accordion.querySelector('.accordion__trigger').setAttribute('aria-expanded', 'true');
        })
    })
}
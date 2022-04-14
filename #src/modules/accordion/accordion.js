const accordions = document.querySelectorAll('.accordion');

//добавяю дефолтный модификатор таким способом, чтобы контент был визуально доступен даже если js выключен в браузере
accordions.forEach(acc => acc.classList.add('accordion--hidden'));

function closeAcc(acc) {
    acc.classList.remove('accordion--visible');
    acc.classList.add('accordion--hidden');
}

if (accordions.length > 0) {
    accordions.forEach(accordion => {
        accordion.addEventListener("click", () => {
            if (accordion.classList.contains('accordion--hidden')) {
                accordions.forEach(acc => closeAcc(acc))
            } else {
                closeAcc(accordion)
                return
            }

            accordion.classList.remove('accordion--hidden');
            accordion.classList.add('accordion--visible');
        })
    })
}
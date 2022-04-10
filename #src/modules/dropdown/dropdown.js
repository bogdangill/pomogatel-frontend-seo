let dropdowns = document.querySelectorAll('.dropdown');

function toggleDropdown(dd, isOpened = false) {
    let ddBody = dd.querySelector('.dropdown-body');

    if (isOpened) {
        ddBody.classList.remove('dropdown-body--visible');
        ddBody.classList.add('dropdown-body--hidden');
    } else {
        ddBody.classList.remove('dropdown-body--hidden');
        ddBody.classList.add('dropdown-body--visible');
    }
}

for (let dropdown of dropdowns) {
    let ddItems = dropdown.querySelectorAll('a'),
        defaultVal = dropdown.querySelector('.dropdown__value');

    dropdown.addEventListener('click', () => toggleDropdown(dropdown));

    for (let ddItem of ddItems) {
        ddItem.addEventListener('click', () => {
            let selectedVal = ddItem.textContent.split(' и ')[0];
            defaultVal.textContent = selectedVal;
        })
    }

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown__value')) {
            toggleDropdown(dropdown, true);
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            toggleDropdown(dropdown, true);
        }
    })
}
let dropdowns = document.querySelectorAll('.dropdown');

function toggleDropdown(dd, isOpened = false) {
    let ddBody = dd.querySelector('.dropdown-body');
    let trigger = dd.querySelector('.dropdown__value');

    if (isOpened) {
        ddBody.classList.remove('dropdown-body--visible');
        ddBody.classList.add('dropdown-body--hidden');
        trigger.setAttribute("aria-expanded", "false");
    } else {
        ddBody.classList.remove('dropdown-body--hidden');
        ddBody.classList.add('dropdown-body--visible');
        trigger.setAttribute("aria-expanded", "true");
        
        ddBody.firstElementChild.firstElementChild.focus();
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
        let dropdownSibling = document.activeElement.nextElementSibling;

        if (e.key === 'ArrowUp') {
            if (dropdownSibling) {
                dropdownSibling.childNodes[0].previousElementSibling.firstElementChild.focus();
            } else {
                dropdownSibling = document.activeElement.parentElement.previousElementSibling.firstElementChild;
                dropdownSibling.focus();
            }
        }
        if (e.key == 'ArrowDown') {
            if (dropdownSibling) {
                dropdownSibling.childNodes[0].nextElementSibling.firstElementChild.focus();
            } else {
                dropdownSibling = document.activeElement.parentElement.nextElementSibling.firstElementChild;
                dropdownSibling.focus();
            }
        }
        if (e.key === 'Escape') {
            toggleDropdown(dropdown, true);
        }
    })
}
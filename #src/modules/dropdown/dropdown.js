let dropdowns = document.querySelectorAll('.dropdown');

for (let dropdown of dropdowns) {
    let ddBody = dropdown.querySelector('.dropdown-body');

    dropdown.addEventListener('click', () => {
        ddBody.classList.remove('visually-hidden');
        ddBody.classList.add('dropdown-body--visible');
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown__value')) {
            ddBody.classList.remove('dropdown-body--visible');
            ddBody.classList.add('visually-hidden');
        } 
    });
}
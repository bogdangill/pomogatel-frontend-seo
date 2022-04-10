let dropdowns = document.querySelectorAll('.dropdown');

for (let dropdown of dropdowns) {
    let ddBody = dropdown.querySelector('.dropdown-body');

    dropdown.addEventListener('click', () => {
        ddBody.classList.remove('dropdown-body--hidden');
        ddBody.classList.add('dropdown-body--visible');
    });

    let ddItems = ddBody.querySelectorAll('a');
    let defaultVal = dropdown.querySelector('.dropdown__value');

    for (let ddItem of ddItems) {
        ddItem.addEventListener('click', () => {
            let selectedVal = ddItem.textContent.split(' и ')[0];
            defaultVal.textContent = selectedVal;
        })
    }

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown__value')) {
            ddBody.classList.remove('dropdown-body--visible');
            ddBody.classList.add('dropdown-body--hidden');
        } 
    });
}
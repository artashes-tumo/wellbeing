const themeSelect = document.getElementById('theme-select');

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    themeSelect.value = 'dark';
}

themeSelect.addEventListener('change', () => {
    if (themeSelect.value === 'dark') {
        document.body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
});

// وظيفة البحث في الجدول
document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('table tr');
    
    rows.forEach((row, index) => {
        if(index === 0) return; // تخطى عناوين الجدول
        const name = row.cells[0].textContent.toLowerCase();
        row.style.display = name.includes(searchTerm) ? '' : 'none';
    });
});

// إدارة الحالة النشطة لقائمة التنقل
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function(e) {
        document.querySelector('.active')?.classList.remove('active');
        this.classList.add('active');
    });
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered');
            });
    });
}
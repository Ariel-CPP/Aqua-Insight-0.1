document.addEventListener('DOMContentLoaded', function() {
    console.log('🚧 Under Development page loaded');

    // 1. DYNAMIC FEATURE NAME dari URL parameter
    function updateFeatureName() {
        const urlParams = new URLSearchParams(window.location.search);
        const feature = urlParams.get('feature');
        
        if (feature) {
            const titleElement = document.getElementById('featureTitle');
            titleElement.textContent = `${feature} - Under Development`;
        }
    }

    // 2. PROGRESS BAR ANIMATION
    function animateProgressBars() {
        const progressBars = document.querySelectorAll('.progress-fill');
        progressBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, 300);
        });
    }

    // 3. HEADER & BACK BUTTON
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }

    // 4. NOTIFY BUTTON INTERACTION (placeholder)
    const notifyBtn = document.querySelector('.notify-btn');
    if (notifyBtn) {
        notifyBtn.addEventListener('click', function() {
            alert('📧 Email notifications will be available in v0.2!\n\nThank you for your interest!');
        });
    }

    // 5. PAGE LOAD ANIMATIONS
    function initAnimations() {
        // Stagger preview items
        const previewItems = document.querySelectorAll('.preview-item');
        previewItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px)';
            setTimeout(() => {
                item.style.transition = 'all 0.6s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 150);
        });

        // Animate progress after delay
        setTimeout(animateProgressBars, 800);
    }

    // 6. SCROLL EFFECTS
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 4px 30px rgba(0,0,0,0.15)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.08)';
        }
    });

    // INIT
    updateFeatureName();
    initAnimations();

    // Performance log
    console.log(`Under Development page loaded in ${Math.round(performance.now())}ms`);
});

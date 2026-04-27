document.addEventListener('DOMContentLoaded', function() {
    // Feature card click handlers
    const featureCards = document.querySelectorAll('.feature-card');
    const modal = document.getElementById('underDevModal');
    const closeBtn = document.querySelector('.close');

    featureCards.forEach(card => {
        card.addEventListener('click', function() {
            const featureName = this.dataset.feature;
            showUnderDevModal(featureName);
        });
    });

    // Close modal
    closeBtn.addEventListener('click', closeModal);
    
    // Close modal on outside click
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    function showUnderDevModal(featureName) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Smooth scrolling for anchor links (if needed later)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Header scroll effect
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 4px 30px rgba(0,0,0,0.12)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.08)';
        }

        lastScrollTop = scrollTop;
    });
});

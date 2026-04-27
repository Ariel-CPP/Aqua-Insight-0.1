document.addEventListener('DOMContentLoaded', function() {
    console.log('🌊 Aqua Insight v0.1 loaded successfully!');

    // 1. SMOOTH SCROLLING untuk dropdown links
    document.querySelectorAll('.dropdown-content a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                // Offset untuk fixed header
                const headerOffset = 100;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
            
            // Close dropdown
            const dropdownContent = document.querySelector('.dropdown-content');
            dropdownContent.style.display = 'none';
        });
    });

    // 2. DROPDOWN FUNCTIONALITY
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');

    if (dropdownBtn) {
        dropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
        });
    }

    // Close dropdown saat klik di luar
    document.addEventListener('click', function(event) {
        const dropdown = document.querySelector('.dropdown');
        if (!dropdown.contains(event.target)) {
            dropdownContent.style.display = 'none';
        }
    });

    // 3. HEADER SCROLL EFFECT (Dynamic shadow)
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > 50) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.backdropFilter = 'blur(20px)';
            header.style.boxShadow = '0 4px 30px rgba(0,0,0,0.12)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.backdropFilter = 'blur(20px)';
            header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.08)';
        }

        lastScrollTop = scrollTop;
    });

    // 4. FEATURE BUTTON HOVER ANIMATIONS (Enhanced)
    const featureBtns = document.querySelectorAll('.feature-btn');
    featureBtns.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-6px) scale(1.02)';
            this.querySelector('.feature-icon').style.transform = 'rotate(5deg) scale(1.1)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.querySelector('.feature-icon').style.transform = 'rotate(0) scale(1)';
        });
    });

    // 5. ACTIVE SECTION HIGHLIGHT (saat scroll)
    const categorySections = document.querySelectorAll('.category-section');
    window.addEventListener('scroll', function() {
        let current = '';
        const headerOffset = 120;

        categorySections.forEach(section => {
            const sectionTop = section.offsetTop - headerOffset;
            if (scrollTop >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        // Update dropdown active state
        document.querySelectorAll('.dropdown-content a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // 6. MOBILE MENU RESPONSIVE (untuk tablet/mobile)
    function handleResize() {
        if (window.innerWidth <= 768) {
            // Mobile optimizations
            document.querySelector('.header-right').style.flexDirection = 'column';
        } else {
            document.querySelector('.header-right').style.flexDirection = 'row';
        }
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    // 7. FEATURE CLICK ANALYTICS (untuk tracking)
    featureBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const featureName = this.querySelector('.feature-title').textContent;
            console.log(`Feature clicked: ${featureName}`);
            
            // GA4 / Analytics event (uncomment jika pakai Google Analytics)
            // gtag('event', 'feature_click', {
            //     'feature_name': featureName,
            //     'category': this.closest('.category-section').querySelector('h3').textContent
            // });
        });
    });

    // 8. PAGE LOAD ANIMATIONS (Staggered)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe semua feature buttons
    featureBtns.forEach((btn, index) => {
        btn.style.opacity = '0';
        btn.style.transform = 'translateY(30px)';
        btn.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(btn);
    });

    // 9. BACK TO TOP (smooth scroll)
    let backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '↑';
    backToTopBtn.className = 'back-to-top';
    document.body.appendChild(backToTopBtn);

    window.addEventListener('scroll', function() {
        if (window.scrollY > 800) {
            backToTopBtn.style.opacity = '1';
            backToTopBtn.style.visibility = 'visible';
        } else {
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.visibility = 'hidden';
        }
    });

    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 10. ERROR HANDLING & PERFORMANCE
    window.addEventListener('error', function(e) {
        console.error('Aqua Insight Error:', e.error);
    });

    // Preload critical resources
    if ('serviceWorker' in navigator) {
        // Future PWA support
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Ignore if no sw.js
        });
    }

    // Performance metrics
    if (performance.getEntriesByType('navigation')[0].loadEventEnd) {
        console.log(`Page loaded in ${Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd)}ms`);
    }
});

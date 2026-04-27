document.addEventListener('DOMContentLoaded', function() {
    console.log('📧 Contact page loaded');

    const form = document.getElementById('contactForm');
    const submitBtn = document.querySelector('.submit-btn');

    // 1. FORM SUBMISSION (EmailJS / Formspree ready)
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Disable button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        submitBtn.style.opacity = '0.7';

        // Simulate API call
        setTimeout(() => {
            showSuccessMessage();
            form.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
            submitBtn.style.opacity = '1';
        }, 2000);
    });

    // 2. RESET FORM
    document.querySelector('.reset-btn').addEventListener('click', function() {
        form.reset();
        clearLabels();
    });

    // 3. FLOATING LABELS
    const inputs = document.querySelectorAll('.form-group input, .form-group textarea');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const label = this.parentNode.querySelector('label');
            if (this.value) {
                label.style.opacity = '1';
            } else {
                label.style.opacity = '0.6';
            }
        });
    });

    // 4. SUCCESS MESSAGE
    function showSuccessMessage() {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            ✅ <strong>Thank you!</strong> Your message has been sent successfully. 
            We'll get back to you within 24-48 hours.
        `;
        form.parentNode.insertBefore(successDiv, form);
        
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }

    function clearLabels() {
        document.querySelectorAll('.form-group label').forEach(label => {
            label.style.top = '1.25rem';
            label.style.fontSize = '1rem';
        });
    }

    // 5. HEADER SCROLL EFFECT
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 4px 30px rgba(0,0,0,0.12)';
        } else {
            header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.08)';
        }
    });

    // 6. FORM VALIDATION
    form.addEventListener('input', validateForm);

    function validateForm() {
        const email = document.getElementById('email').value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            document.getElementById('email').style.borderColor = '#ef4444';
        } else {
            document.getElementById('email').style.borderColor = '#10b981';
        }
    }

    // 7. PAGE LOAD ANIMATIONS
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });

    document.querySelectorAll('.info-card, .faq-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });

    console.log('Contact form ready - EmailJS integration available');
});

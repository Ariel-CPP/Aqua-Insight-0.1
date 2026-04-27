/**
 * zoom-pan.js - Canvas Zoom & Pan Controls
 * Aqua Insight v0.1 - Particle Analyzer
 */

const ZoomPan = {
    // State
    canvas: null,
    ctx: null,
    image: null,
    imageWidth: 0,
    imageHeight: 0,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    particles: [],

    /**
     * Initialize zoom/pan for canvas
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.bindEvents();
        this.drawEmptyCanvas();
    },

    /**
     * Bind mouse/touch events
     */
    bindEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));

        // Touch events
              this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.onTouchEnd());
    },

    /**
     * Draw empty canvas background
     */
    drawEmptyCanvas() {
        const ctx = this.ctx;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Upload an image to begin', this.canvas.width / 2, this.canvas.height / 2);
    },

    /**
     * Set image to display
     */
    setImage(img, width, height) {
        this.image = img;
        this.imageWidth = width;
        this.imageHeight = height;
        this.fitToView();
    },

    /**
     * Fit image to view
     */
    fitToView() {
        if (!this.image) return;

        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        const scaleX = canvasWidth / this.imageWidth;
        const scaleY = canvasHeight / this.imageHeight;
        this.scale = Math.min(scaleX, scaleY) * 0.9;

        this.offsetX = (canvasWidth - this.imageWidth * this.scale) / 2;
        this.offsetY = (canvasHeight - this.imageHeight * this.scale) / 2;

        this.render();
        this.updateZoomDisplay();
    },

    /**
     * Reset zoom to 100%
     */
    resetZoom() {
        if (!this.image) return;

        this.scale = 1;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        this.offsetX = (canvasWidth - this.imageWidth) / 2;
        this.offsetY = (canvasHeight - this.imageHeight) / 2;

        this.render();
        this.updateZoomDisplay();
    },

    /**
     * Zoom in
     */
    zoomIn() {
        this.scale = Math.min(this.scale * 1.2, 10);
        this.render();
        this.updateZoomDisplay();
    },

    /**
     * Zoom out
     */
    zoomOut() {
        this.scale = Math.max(this.scale / 1.2, 0.1);
        this.render();
        this.updateZoomDisplay();
    },

    /**
     * Update zoom level display
     */
    updateZoomDisplay() {
        const zoomEl = document.getElementById('zoomLevel');
        if (zoomEl) {
            zoomEl.textContent = Math.round(this.scale * 100) + '%';
        }
    },

    /**
     * Main render function
     */
    render() {
        if (!this.ctx || !this.image) return;

        const ctx = this.ctx;
        const canvas = this.canvas;

        // Clear canvas
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image
        ctx.drawImage(
            this.image,
            this.offsetX,
            this.offsetY,
            this.imageWidth * this.scale,
            this.imageHeight * this.scale
        );
    },

    /**
     * Render with particle overlay
     */
    renderWithOverlay(particles) {
        if (!this.ctx || !this.image) return;

        const ctx = this.ctx;
        const canvas = this.canvas;

        // Clear canvas
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image
        ctx.drawImage(
            this.image,
            this.offsetX,
            this.offsetY,
            this.imageWidth * this.scale,
            this.imageHeight * this.scale
        );

        // Draw particles
        this.drawParticles(particles);
    },

    /**
     * Draw particles on canvas
     */
    drawParticles(particles) {
        const ctx = this.ctx;

        particles.forEach(particle => {
            const x = this.offsetX + particle.centroid.x * this.scale;
            const y = this.offsetY + particle.centroid.y * this.scale;
            const radius = Math.sqrt(particle.size / Math.PI) * this.scale;

            // Draw bounding circle
            ctx.beginPath();
            ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw filled circle
            ctx.beginPath();
            ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 212, 255, 0.15)';
            ctx.fill();

            // Draw label
            const labelY = y - radius - 18;
            const labelRadius = 12;

            ctx.beginPath();
            ctx.arc(x, labelY, labelRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 40, 60, 0.95)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#00d4ff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(particle.number.toString(), x, labelY);
        });
    },

    // Mouse event handlers
    onMouseDown(e) {
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
    },

    onMouseMove(e) {
        if (!this.isDragging) return;

        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;

        this.offsetX += dx;
        this.offsetY += dy;

        this.lastX = e.clientX;
        this.lastY = e.clientY;

        if (this.particles.length > 0) {
            this.renderWithOverlay(this.particles);
        } else {
            this.render();
        }
    },

    onMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    },

    onWheel(e) {
        e.preventDefault();

        if (e.deltaY < 0) {
            this.scale = Math.min(this.scale * 1.1, 10);
        } else {
            this.scale = Math.max(this.scale / 1.1, 0.1);
        }

        if (this.particles.length > 0) {
            this.renderWithOverlay(this.particles);
        } else {
            this.render();
        }

        this.updateZoomDisplay();
    },

    // Touch event handlers
    onTouchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.lastX = e.touches[0].clientX;
            this.lastY = e.touches[0].clientY;
        }
    },

    onTouchMove(e) {
        if (!this.isDragging || e.touches.length !== 1) return;
        e.preventDefault();

        const dx = e.touches[0].clientX - this.lastX;
        const dy = e.touches[0].clientY - this.lastY;

        this.offsetX += dx;
        this.offsetY += dy;

        this.lastX = e.touches[0].clientX;
        this.lastY = e.touches[0].clientY;

        if (this.particles.length > 0) {
            this.renderWithOverlay(this.particles);
        } else {
            this.render();
        }
    },

    onTouchEnd() {
        this.isDragging = false;
    }
};

// Export
window.ZoomPan = ZoomPan;

/**
 * zoom-pan.js - Canvas Zoom & Pan Controls
 * Aqua Insight - Particle Analyzer
 */

const ZoomPan = {
    // State
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    
    // Config
    minScale: 0.1,
    maxScale: 10,
    zoomStep: 0.25,
    
    // References
    canvas: null,
    ctx: null,
    image: null,
    imageWidth: 0,
    imageHeight: 0,
    particles: null,

    /**
     * Initialize zoom/pan for canvas
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Set canvas size to match container
        this.updateCanvasSize();
        
        // Mouse events
        canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
        
        // Wheel event for zoom
        canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        
        // Touch events for mobile
        canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        // Button controls
        document.getElementById('zoomIn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('resetView')?.addEventListener('click', () => this.resetView());
        
        // Handle window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.updateCanvasSize();
            if (this.image) this.fitToView();
        }, 200));
    },

    /**
     * Update canvas size to match container
     */
    updateCanvasSize() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
    },

    /**
     * Set the image to display
     */
    setImage(image, width, height) {
        this.image = image;
        this.imageWidth = width;
        this.imageHeight = height;
        this.updateCanvasSize();
        this.fitToView();
    },

    /**
     * Set particles for overlay
     */
    setParticles(particles) {
        this.particles = particles;
    },

    /**
     * Fit image to view
     */
    fitToView() {
        if (!this.canvas || !this.image) return;
        
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth || this.canvas.width;
        const containerHeight = container.clientHeight || this.canvas.height;
        
        // Calculate scale to fit
        const scaleX = containerWidth / this.imageWidth;
        const scaleY = containerHeight / this.imageHeight;
        this.scale = Math.min(scaleX, scaleY, 1) * 0.95;
        
        // Center the image
        this.offsetX = (containerWidth - this.imageWidth * this.scale) / 2;
        this.offsetY = (containerHeight - this.imageHeight * this.scale) / 2;
        
        this.render();
    },

    /**
     * Render the canvas
     */
    render() {
        if (!this.ctx) return;
        
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Clear canvas with background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw checkerboard pattern for transparency
        this.drawCheckerboard(ctx, canvas.width, canvas.height);
        
        if (!this.image) return;
        
        // Save context state
        ctx.save();
        
        // Apply transform
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);
        
        // Draw image
        ctx.drawImage(this.image, 0, 0, this.imageWidth, this.imageHeight);
        
        // Restore context
        ctx.restore();
    },

    /**
     * Render with particle overlay
     */
    renderWithOverlay(particles) {
        if (!this.ctx || !this.image) return;
        
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Clear canvas with background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw checkerboard pattern
        this.drawCheckerboard(ctx, canvas.width, canvas.height);
        
        // Save context state
        ctx.save();
        
        // Apply transform
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);
        
        // Draw image
        ctx.drawImage(this.image, 0, 0, this.imageWidth, this.imageHeight);
        
        // Draw particle overlay
        this.drawParticleOverlay(ctx, particles);
        
        // Restore context
        ctx.restore();
    },

    /**
     * Draw checkerboard pattern for transparency
     */
    drawCheckerboard(ctx, width, height) {
        const tileSize = 10;
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#252525';
        for (let y = 0; y < height; y += tileSize) {
            for (let x = 0; x < width; x += tileSize) {
                if ((x / tileSize + y / tileSize) % 2 === 0) {
                    ctx.fillRect(x, y, tileSize, tileSize);
                }
            }
        }
    },

    /**
     * Draw particle overlay with numbers
     */
    drawParticleOverlay(ctx, particles) {
        if (!particles || particles.length === 0) return;
        
        particles.forEach(particle => {
            const { centroid, number, size } = particle;
            const x = centroid.x;
            const y = centroid.y;
            
            // Calculate radius
            const radius = Math.sqrt(size / Math.PI);
            
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
            
            // Calculate label position (above the particle)
            const labelY = y - radius - 18;
            const labelRadius = 12;
            
            // Draw label background
            ctx.beginPath();
            ctx.arc(x, labelY, labelRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 40, 60, 0.95)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // Draw number
            ctx.fillStyle = '#00d4ff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(number.toString(), x, labelY);
        });
    },

    /**
     * Draw overlay on a specific context (for export)
     */
    drawOverlayOnContext(ctx, particles, scale = 1, offsetX = 0, offsetY = 0) {
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        this.drawParticleOverlayOnContext(ctx, particles);
        ctx.restore();
    },

    /**
     * Draw particle overlay on a clean context (for export)
     */
    drawParticleOverlayOnContext(ctx, particles) {
        if (!particles || particles.length === 0) return;
        
        particles.forEach(particle => {
            const { centroid, number, size } = particle;
            const x = centroid.x;
            const y = centroid.y;
            
            // Calculate radius
            const radius = Math.sqrt(size / Math.PI);
            
            // Draw bounding circle
            ctx.beginPath();
            ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.9)';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            
            // Draw label background
            const labelY = y - radius - 18;
            const labelRadius = 14;
            
            ctx.beginPath();
            ctx.arc(x, labelY, labelRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 40, 60, 0.95)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw number
            ctx.fillStyle = '#00d4ff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(number.toString(), x, labelY);
        });
    },

    /**
     * Zoom in
     */
    zoomIn() {
        this.scale = Math.min(this.scale + this.zoomStep, this.maxScale);
        this.render();
        if (this.particles) {
            this.renderWithOverlay(this.particles);
        }
    },

    /**
     * Zoom out
     */
    zoomOut() {
        this.scale = Math.max(this.scale - this.zoomStep, this.minScale);
        this.render();
        if (this.particles) {
            this.renderWithOverlay(this.particles);
        }
    },

    /**
     * Reset view to fit
     */
    resetView() {
        this.fitToView();
    },

    /**
     * Zoom to specific level
     */
    zoomTo(level) {
        this.scale = Utils.clamp(level, this.minScale, this.maxScale);
        this.render();
        if (this.particles) {
            this.renderWithOverlay(this.particles);
        }
    },

    /**
     * Center view
     */
    centerView() {
        if (!this.canvas || !this.image) return;
        
        this.offsetX = (this.canvas.width - this.imageWidth * this.scale) / 2;
        this.offsetY = (this.canvas.height - this.imageHeight * this.scale) / 2;
        
        this.render();
        if (this.particles) {
            this.renderWithOverlay(this.particles);
        }
    },

    /**
     * Mouse wheel zoom
     */
    onWheel(e) {
        e.preventDefault();
        
        // Get mouse position relative to canvas
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate zoom
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.min(Math.max(this.scale * zoomFactor, this.minScale), this.maxScale);
        
        // Adjust offset to zoom towards mouse position
        const scaleDiff = newScale / this.scale;
        this.offsetX = mouseX - (mouseX - this.offsetX) * scaleDiff;
        this.offsetY = mouseY - (mouseY - this.offsetY) * scaleDiff;
        
        this.scale = newScale;
        
        this.render();
        if (this.particles) {
            this.renderWithOverlay(this.particles);
        }
    },

    /**
     * Mouse down - start drag
     */
    onMouseDown(e) {
        this.isDragging = true;
        this.startX = e.clientX - this.offsetX;
        this.startY = e.clientY - this.offsetY;
        this.canvas.style.cursor = 'grabbing';
    },

    /**
     * Mouse move - drag
     */
    onMouseMove(e) {
        if (!this.isDragging) return;
        
        this.offsetX = e.clientX - this.startX;
        this.offsetY = e.clientY - this.startY;
        
        this.render();
        if (this.particles) {
            this.renderWithOverlay(this.particles);
        }
    },

    /**
     * Mouse up - end drag
     */
    onMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    },

    /**
     * Touch start
     */
    onTouchStart(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            const touch = e.touches[0];
            this.isDragging = true;
            this.startX = touch.clientX - this.offsetX;
            this.startY = touch.clientY - this.offsetY;
        } else if (e.touches.length === 2) {
            // Pinch zoom start
            this.isDragging = false;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            this.pinchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
        }
    },

    /**
     * Touch move
     */
    onTouchMove(e) {
        if (e.touches.length === 1 && this.isDragging) {
            e.preventDefault();
            const touch = e.touches[0];
            this.offsetX = touch.clientX - this.startX;
            this.offsetY = touch.clientY - this.startY;
            
            this.render();
            if (this.particles) {
                this.renderWithOverlay(this.particles);
            }
        } else if (e.touches.length === 2 && this.pinchDistance) {
            // Pinch zoom
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const newDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            const zoomFactor = newDistance / this.pinchDistance;
            this.scale = Math.min(Math.max(this.scale * zoomFactor, this.minScale), this.maxScale);
            this.pinchDistance = newDistance;
            
            this.render();
            if (this.particles) {
                this.renderWithOverlay(this.particles);
            }
        }
    },

    /**
     * Touch end
     */
    onTouchEnd(e) {
        this.isDragging = false;
        this.pinchDistance = null;
    },

    /**
     * Convert canvas coordinates to image coordinates
     */
    canvasToImage(x, y) {
        return {
            x: (x - this.offsetX) / this.scale,
            y: (y - this.offsetY) / this.scale
        };
    },

    /**
     * Convert image coordinates to canvas coordinates
     */
    imageToCanvas(x, y) {
        return {
            x: x * this.scale + this.offsetX,
            y: y * this.scale + this.offsetY
        };
    },

    /**
     * Get current transform info
     */
    getTransformInfo() {
        return {
            scale: this.scale,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            isDragging: this.isDragging
        };
    },

    /**
     * Set transform directly
     */
    setTransform(scale, offsetX, offsetY) {
        this.scale = scale;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.render();
        if (this.particles) {
            this.renderWithOverlay(this.particles);
        }
    },

    /**
     * Get base64 image data
     */
    getImageDataURL() {
        if (!this.canvas) return null;
        return this.canvas.toDataURL('image/png');
    },

    /**
     * Clear canvas
     */
    clear() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawCheckerboard(this.ctx, this.canvas.width, this.canvas.height);
    },

    /**
     * Destroy/cleanup
     */
    destroy() {
        this.image = null;
        this.particles = null;
        this.canvas = null;
        this.ctx = null;
    }
};

// Export for use in other modules
window.ZoomPan = ZoomPan;

/**
 * export.js - Data Export Functions
 * Aqua Insight v0.1 - Particle Analyzer
 */

const Export = {
    /**
     * Export results to CSV
     */
    exportToCSV(data) {
        const { particles, totalParticles, totalArea, imageWidth, imageHeight } = data;

        // Build CSV content
        let csv = 'AQUA INSIGHT - PARTICLE ANALYSIS REPORT\n';
        csv += `Generated: ${new Date().toLocaleString()}\n`;
        csv += `Image Size: ${imageWidth} x ${imageHeight}\n`;
        csv += `Total Particles: ${totalParticles}\n`;
        csv += `Total Area: ${totalArea} px²\n`;
        csv += `Coverage: ${((totalArea / (imageWidth * imageHeight)) * 100).toFixed(2)}%\n\n`;

        // Header
        csv += 'No,Size (px²),Mean R,Mean G,Mean B,Circularity\n';

        // Data rows
        particles.forEach(p => {
            csv += `${p.number},${p.size},${p.meanR.toFixed(2)},${p.meanG.toFixed(2)},${p.meanB.toFixed(2)},${p.circularity.toFixed(3)}\n`;
        });

        this.downloadFile(csv, 'particle-analysis-report.csv', 'text/csv');
    },

    /**
     * Export canvas to PNG with overlay
     */
    exportToPNG(canvas, particles, imageWidth, imageHeight) {
        // Create export canvas
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = imageWidth;
        exportCanvas.height = imageHeight;
        const ctx = exportCanvas.getContext('2d');

        // Draw original image
        if (ZoomPan.image) {
            ctx.drawImage(ZoomPan.image, 0, 0);
        }

        // Draw particle overlay
        this.drawParticleOverlay(ctx, particles, imageWidth, imageHeight);

        // Download
        exportCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'particle-analysis-overlay.png';
            link.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    },

    /**
     * Draw particle overlay on context
     */
    drawParticleOverlay(ctx, particles, width, height) {
        particles.forEach(particle => {
            const { centroid, number, size } = particle;
            const x = centroid.x;
            const y = centroid.y;
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
            ctx.fillText(number.toString(), x, labelY);
        });
    },

    /**
     * Download file helper
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
};

// Export
window.Export = Export;

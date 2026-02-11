/**
 * exportWorker.ts
 * Background worker for heavy canvas rendering and export
 */

/* eslint-disable no-restricted-globals */

self.onmessage = async (e: MessageEvent) => {
    const {
        width,
        height,
        backgroundColor,
        backgroundImageUrl,
        shapes,
        texts,
        images,
        filters,
        format,
        quality
    } = e.data;

    try {
        // @ts-ignore
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            self.postMessage({ error: 'Could not create OffscreenCanvas context' });
            return;
        }

        // --- Rendering Logic (Simplified copy of exportService.ts for the worker) ---

        // 1. Background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // 2. Background Image
        if (backgroundImageUrl) {
            try {
                const response = await fetch(backgroundImageUrl);
                const blob = await response.blob();
                const img = await createImageBitmap(blob);

                // Contain logic
                const imgAspect = img.width / img.height;
                const canvasAspect = width / height;
                let drawWidth, drawHeight, offsetX, offsetY;

                if (imgAspect > canvasAspect) {
                    drawWidth = width;
                    drawHeight = width / imgAspect;
                    offsetX = 0;
                    offsetY = (height - drawHeight) / 2;
                } else {
                    drawHeight = height;
                    drawWidth = height * imgAspect;
                    offsetY = 0;
                    offsetX = (width - drawWidth) / 2;
                }

                ctx.save();
                if (filters) {
                    // @ts-ignore
                    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) sepia(${filters.sepia}%) grayscale(${filters.grayscale}%) blur(${filters.blur}px)`;
                }
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                ctx.restore();
            } catch (err) {
                console.warn('Worker: Failed to load background', err);
            }
        }

        // 3. Image Layers
        for (const imgLayer of images) {
            if (!imgLayer.visible) continue;
            try {
                const response = await fetch(imgLayer.src);
                const blob = await response.blob();
                const img = await createImageBitmap(blob);

                ctx.save();
                const centerX = imgLayer.x + imgLayer.width / 2;
                const centerY = imgLayer.y + imgLayer.height / 2;

                ctx.translate(centerX, centerY);
                ctx.rotate((imgLayer.rotation * Math.PI) / 180);

                // Skew
                const radX = (imgLayer.skewX * Math.PI) / 180;
                const radY = (imgLayer.skewY * Math.PI) / 180;
                ctx.transform(1, Math.tan(radY), Math.tan(radX), 1, 0, 0);

                const scaleX = imgLayer.flipX ? -1 : 1;
                const scaleY = imgLayer.flipY ? -1 : 1;
                ctx.scale(scaleX, scaleY);
                ctx.globalAlpha = imgLayer.opacity;

                if (imgLayer.shadow) {
                    ctx.shadowColor = imgLayer.shadow.color;
                    ctx.shadowBlur = imgLayer.shadow.blur;
                    ctx.shadowOffsetX = imgLayer.shadow.offsetX;
                    ctx.shadowOffsetY = imgLayer.shadow.offsetY;
                }

                // @ts-ignore
                ctx.filter = `brightness(${imgLayer.filters.brightness}%) contrast(${imgLayer.filters.contrast}%) saturate(${imgLayer.filters.saturation}%) grayscale(${imgLayer.filters.grayscale}%) blur(${imgLayer.filters.blur}px) sepia(${imgLayer.filters.sepia}%)`;

                ctx.drawImage(img, -imgLayer.width / 2, -imgLayer.height / 2, imgLayer.width, imgLayer.height);
                ctx.restore();
            } catch (err) {
                console.warn('Worker: Failed to load image layer', err);
            }
        }

        // 4. Shapes (Simplified for MVP worker)
        for (const shape of shapes) {
            if (!shape.visible) continue;
            ctx.save();
            const centerX = shape.x + shape.width / 2;
            const centerY = shape.y + shape.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((shape.rotation * Math.PI) / 180);

            ctx.fillStyle = shape.color;
            ctx.globalAlpha = shape.opacity;

            if (shape.type === 'rectangle') {
                ctx.fillRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
            } else if (shape.type === 'circle') {
                ctx.beginPath();
                ctx.ellipse(0, 0, shape.width / 2, shape.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // 5. Texts (Text rendering in OffscreenCanvas requires careful font loading)
        // For MVP, we'll notify that texts might need main thread if fonts aren't loaded in worker
        // But we can try basic fillText
        for (const textLayer of texts) {
            if (!textLayer.visible) continue;
            ctx.save();
            ctx.translate(textLayer.x + textLayer.width / 2, textLayer.y + textLayer.fontSize / 2);
            ctx.rotate((textLayer.rotation * Math.PI) / 180);
            // @ts-ignore
            ctx.font = `${textLayer.fontWeight} ${textLayer.fontSize}px sans-serif`;
            ctx.fillStyle = textLayer.color;
            ctx.textAlign = 'center';
            ctx.fillText(textLayer.text, 0, 0);
            ctx.restore();
        }

        // --- End Rendering ---

        // Convert to Blob
        // @ts-ignore
        const blob = await canvas.convertToBlob({ type: `image/${format}`, quality });

        // Convert to DataURL for message
        const reader = new FileReader();
        reader.onloadend = () => {
            self.postMessage({ dataUrl: reader.result });
        };
        reader.readAsDataURL(blob);

    } catch (err: any) {
        self.postMessage({ error: err.message });
    }
};


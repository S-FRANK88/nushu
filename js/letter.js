// ====== LETTER.JS — Card creation, candlelight, flip, save ======

document.addEventListener('DOMContentLoaded', () => {
    const letterInput = document.getElementById('letter-input');
    const cardNushuText = document.getElementById('card-nushu-text');
    const currentCount = document.getElementById('current-count');
    const letterCard = document.getElementById('letter-card');
    const btnFlip = document.getElementById('btn-flip');
    const btnSave = document.getElementById('btn-save');
    const btnShare = document.getElementById('btn-share');
    const viewModeActions = document.getElementById('view-mode-actions');
    const btnWriteOwn = document.getElementById('btn-write-own');
    const candleIcon = document.getElementById('candle-icon');
    const candlelightOverlay = document.getElementById('candlelight-overlay');
    const candlelightBackdrop = document.getElementById('candlelight-backdrop');
    const candleCursor = document.getElementById('candle-cursor');
    const btnExitCandle = document.getElementById('btn-exit-candle');
    const shadowLayer = document.getElementById('shadow-layer');
    const backDate = document.querySelector('.back-date');
    const letterCardContainer = document.getElementById('letter-card-container');

    // Set date on card back
    const now = new Date();
    backDate.textContent = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

    // ---- Real-time transcription ----
    let currentChineseText = '';

    // ---- URL Parameters & View Mode ----
    const urlParams = new URLSearchParams(window.location.search);
    const sharedTextEncoded = urlParams.get('text');
    let isViewMode = false;

    if (sharedTextEncoded) {
        try {
            const decodedChinese = decodeURIComponent(atob(sharedTextEncoded));
            isViewMode = true;

            // Switch page immediately
            document.getElementById('homepage').classList.remove('active');
            document.getElementById('letter-page').classList.add('active');

            // Apply text
            letterInput.value = decodedChinese;
            currentChineseText = decodedChinese;
            const nushuStr = typeof toNushu === 'function' ? toNushu(decodedChinese) : decodedChinese;
            cardNushuText.innerHTML = '';
            if (nushuStr && nushuStr.length > 0) {
                for (const char of nushuStr) {
                    const s = document.createElement('span');
                    s.textContent = char;
                    cardNushuText.appendChild(s);
                }
            }
            currentCount.textContent = decodedChinese.length;

            // Adjust UI for View Mode
            document.getElementById('letter-input-panel').classList.add('hidden');
            document.getElementById('letter-card-container').style.margin = '0 auto';
            document.getElementById('card-actions').classList.add('hidden');
            document.querySelector('.back-button').classList.add('hidden');
            viewModeActions.classList.remove('hidden');
        } catch (e) {
            console.error("Failed to decode shared text", e);
        }
    }

    // ---- I want to write CTA ----
    btnWriteOwn.addEventListener('click', () => {
        window.location.href = window.location.pathname; // Reload without query params
    });

    // ---- Font Size Controls ----
    const fontSizeRadios = document.querySelectorAll('input[name="font-size"]');
    const maxCountSpan = document.getElementById('max-count');

    fontSizeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            cardNushuText.style.fontSize = e.target.value;
            const newMax = e.target.getAttribute('data-max');
            if (newMax) {
                letterInput.maxLength = newMax;
                maxCountSpan.textContent = newMax;
                // Trim existing text if it exceeds the new limit
                if (letterInput.value.length > newMax) {
                    letterInput.value = letterInput.value.substring(0, newMax);
                    letterInput.dispatchEvent(new Event('input')); // Trigger update
                }
            }
        });
    });

    letterInput.addEventListener('input', () => {
        const text = letterInput.value;
        currentChineseText = text;
        currentCount.textContent = text.length;

        // Convert to Nüshu
        const nushuText = typeof toNushu === 'function' ? toNushu(text) : text;
        cardNushuText.innerHTML = ''; // Start empty

        // Loop over text only if it has content, no default fallbacks anymore
        if (nushuText && nushuText.length > 0) {
            for (const char of nushuText) {
                const s = document.createElement('span');
                s.textContent = char;
                cardNushuText.appendChild(s);
            }
        }
    });

    // ---- Card Flip ----
    btnFlip.addEventListener('click', () => {
        letterCard.classList.toggle('flipped');
        btnFlip.textContent = letterCard.classList.contains('flipped') ? '🔄 翻回正面' : '🔄 翻转卡片';
    });

    // ---- Candlelight Mode ----
    let candleActive = false;
    let nushuChars = []; // Store positions of nushu chars for shadow mapping

    candleIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        activateCandlelight();
    });

    function activateCandlelight() {
        candleActive = true;
        candlelightBackdrop.classList.remove('hidden');
        candlelightOverlay.classList.remove('hidden');
        letterCard.classList.add('flashlight-active');
        letterCardContainer.classList.add('flashlight-active');
        document.body.classList.add('candle-mode');
        document.body.style.cursor = 'none';

        // Wait for next animation frame to ensure the DOM has laid out the spans
        // so getBoundingClientRect() returns the actual painted coordinates
        requestAnimationFrame(() => {
            buildShadowMap();
        });
    }

    function deactivateCandlelight() {
        candleActive = false;
        candlelightBackdrop.classList.add('hidden');
        candlelightOverlay.classList.add('hidden');
        letterCard.classList.remove('flashlight-active');
        letterCardContainer.classList.remove('flashlight-active');
        document.body.classList.remove('candle-mode');
        document.body.style.cursor = '';
        shadowLayer.innerHTML = '';
        shadowLayer.classList.add('hidden');
        // Reset mask variables
        const cardFront = document.getElementById('card-front');
        cardFront.style.removeProperty('--light-x');
        cardFront.style.removeProperty('--light-y');
    }

    btnExitCandle.addEventListener('click', deactivateCandlelight);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && candleActive) {
            deactivateCandlelight();
        }
    });

    // Track mouse for candlelight cursor
    document.addEventListener('mousemove', (e) => {
        if (!candleActive) return;
        candleCursor.style.left = e.clientX + 'px';
        candleCursor.style.top = e.clientY + 'px';

        const cardFront = document.getElementById('card-front');
        const cardRect = cardFront.getBoundingClientRect();

        // Calculate light position relative to the card for the CSS mask
        const relativeX = e.clientX - cardRect.left;
        const relativeY = e.clientY - cardRect.top;
        cardFront.style.setProperty('--light-x', `${relativeX}px`);
        cardFront.style.setProperty('--light-y', `${relativeY}px`);

        // Update full screen overlay mask position
        candlelightOverlay.style.setProperty('--mouse-x', `${e.clientX}px`);
        candlelightOverlay.style.setProperty('--mouse-y', `${e.clientY}px`);

        // Update shadow positions based on candle position
        updateShadows(e.clientX, e.clientY);
    });

    function buildShadowMap() {
        shadowLayer.classList.remove('hidden');
        shadowLayer.innerHTML = '';

        const text = currentChineseText || "书我";
        const nushuSpans = Array.from(document.querySelectorAll('#card-nushu-text span'));

        // Create shadow characters
        nushuSpans.forEach((span, i) => {
            const shadowChar = document.createElement('span');
            shadowChar.className = 'shadow-char';
            shadowChar.textContent = text[i] || text[0];
            shadowChar.style.cssText = `
        position: absolute;
        font-family: 'Noto Serif SC', serif;
        font-size: 0;
        color: rgba(60, 40, 20, 0);
        pointer-events: none;
        transition: font-size 0.3s ease, color 0.3s ease;
        transform: translate(-50%, -50%);
        text-shadow: 0 2px 8px rgba(0,0,0,0.3);
      `;
            shadowChar.dataset.index = i;
            shadowLayer.appendChild(shadowChar);
        });

        nushuChars = Array.from(shadowLayer.children);
    }

    function updateShadows(mouseX, mouseY) {
        const cardFront = document.getElementById('card-front');
        const cardRect = cardFront.getBoundingClientRect();

        const maxDist = 100; // Reduce light range to only reveal nearby characters

        // Ensure shadow wrapper has size
        shadowLayer.style.width = '100%';
        shadowLayer.style.height = '100%';

        const nushuSpans = document.querySelectorAll('#card-nushu-text span');

        nushuChars.forEach((shadowChar, i) => {
            const spanEl = nushuSpans[i];
            if (!spanEl) return;

            // Get actual on-screen location of the Nushu character
            const spanRect = spanEl.getBoundingClientRect();

            // Center point of the actual character
            const screenBaseX = spanRect.left + spanRect.width / 2;
            const screenBaseY = spanRect.top + spanRect.height / 2;

            // Position relative to the card container
            const baseX = screenBaseX - cardRect.left;
            const baseY = screenBaseY - cardRect.top;

            // Distance from mouse to the character
            const dx = screenBaseX - mouseX;
            const dy = screenBaseY - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 调节影像虚实的参数：
            // 1. proximity：控制透明度（浓度）。这里提升了整体系数，影子会更浓。
            // 2. blurRadius：控制边缘模糊度。这里分母改大了（从 dist/20 改到了 dist/40），影子会更实。
            let proximity = Math.max(0, 1 - (dist / maxDist));
            proximity = Math.pow(proximity, 1.5);

            // Shadow offset: cast AWAY from the light source
            const stretchFactor = 0.1 + (dist / 1000); // 缩小拉伸程度
            const shadowOffsetX = dx * stretchFactor;
            const shadowOffsetY = dy * stretchFactor;

            // final position is base + offset
            const finalX = baseX + shadowOffsetX;
            const finalY = baseY + shadowOffsetY;

            shadowChar.style.left = finalX + 'px';
            shadowChar.style.top = finalY + 'px';

            // Size, Blur and opacity based on proximity AND distance
            const fontSize = 18 + (dist * 0.05);
            const opacity = proximity * 0.95; // 浓度提高到0.95，更加实
            const blurRadius = Math.max(1, dist / 40); // 虚化幅度减半，更加锐利

            shadowChar.style.fontSize = fontSize + 'px';
            shadowChar.style.color = `rgba(15, 20, 30, 0)`; // Hide text color, rely on text-shadow blur
            // Set shadow to a glowing amber color: rgba(230, 150, 50)
            shadowChar.style.textShadow = `0 0 ${blurRadius}px rgba(230, 150, 50, ${opacity})`;
        });
    }

    // ---- Save Card as Image ----
    btnSave.addEventListener('click', async () => {
        // Make sure card is showing front
        if (letterCard.classList.contains('flipped')) {
            letterCard.classList.remove('flipped');
            btnFlip.textContent = '🔄 翻转卡片';
            await new Promise(r => setTimeout(r, 900));
        }

        try {
            // Use html2canvas if available
            if (typeof html2canvas !== 'undefined') {
                const cardFront = document.getElementById('card-front');
                const canvas = await html2canvas(cardFront, {
                    backgroundColor: '#1f2d47',
                    scale: 2,
                    useCORS: true,
                    logging: false
                });

                // Start sharing card creation
                const scale = 2; // Match html2canvas scale
                const padding = 60 * scale;
                const footerHeight = 140 * scale;

                const shareCanvas = document.createElement('canvas');
                const ctx = shareCanvas.getContext('2d');

                // Canvas dimensions
                shareCanvas.width = canvas.width + (padding * 2);
                shareCanvas.height = canvas.height + padding + padding + footerHeight;

                // 1. Draw Background (Deep blue matched to app theme)
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(0, 0, shareCanvas.width, shareCanvas.height - footerHeight);

                // 2. Draw the generated Card with a shadow
                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                ctx.shadowBlur = 40 * scale;
                ctx.shadowOffsetY = 20 * scale;
                ctx.drawImage(canvas, padding, padding);

                // Reset shadow
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;

                // 3. Draw Footer Background
                const footerY = shareCanvas.height - footerHeight;
                ctx.fillStyle = '#f4f4f5'; // Light gray footer
                ctx.fillRect(0, footerY, shareCanvas.width, footerHeight);

                // 4. Generate & Draw QR Code
                const qrSize = 90 * scale;
                const qrX = padding;
                const qrY = footerY + (footerHeight - qrSize) / 2;

                const baseUrl = window.location.href.split('?')[0];
                const textToShare = currentChineseText || '';
                let shareUrl = baseUrl;
                if (textToShare) {
                    const encodedText = btoa(encodeURIComponent(textToShare));
                    shareUrl = `${baseUrl}?text=${encodedText}`;
                }

                try {
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;
                    // Fetch the image as a blob to avoid CORS canvas tainting
                    const response = await fetch(qrUrl);
                    const blob = await response.blob();
                    const objectUrl = URL.createObjectURL(blob);

                    const qrImg = new Image();
                    await new Promise((resolve, reject) => {
                        qrImg.onload = resolve;
                        qrImg.onerror = reject;
                        qrImg.src = objectUrl;
                    });

                    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
                    URL.revokeObjectURL(objectUrl);
                } catch (e) {
                    console.warn("Could not draw QR code due to network/CORS issue", e);
                    // Let it continue with no QR code instead of breaking the whole download
                }

                // 5. Draw Hint Text
                ctx.fillStyle = '#3f3f46';
                ctx.font = `${18 * scale}px 'Noto Serif SC', serif, sans-serif`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText("扫码生成专属女书密信", qrX + qrSize + 24 * scale, footerY + footerHeight / 2);

                // 6. Draw Brand Name "Axsis"
                ctx.fillStyle = '#94a3b8';
                ctx.font = `bold ${28 * scale}px 'Playfair Display', serif, sans-serif`;
                ctx.textAlign = 'right';
                ctx.fillText("Axsis", shareCanvas.width - padding, footerY + footerHeight / 2);

                // 7. Download Final Image
                const link = document.createElement('a');
                link.download = `Axsis-Nushu-Letter-${Date.now()}.jpg`;
                link.href = shareCanvas.toDataURL('image/jpeg', 0.95);
                link.click();
            } else {
                alert('图片保存功能加载中，请稍后再试');
            }
        } catch (err) {
            console.error('Save failed:', err);
            alert('保存失败，请截图保存');
        }
    });

    // ---- Share Link ----
    if (btnShare) {
        btnShare.addEventListener('click', () => {
            const textToShare = currentChineseText || '';
            if (!textToShare) {
                alert('请先写下想说的话。');
                return;
            }

            try {
                // Encode the text
                const encodedText = btoa(encodeURIComponent(textToShare));

                // Construct URL
                const baseUrl = window.location.href.split('?')[0];
                const shareUrl = `${baseUrl}?text=${encodedText}`;

                // Copy to clipboard
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert('分享链接已复制到剪贴板！');
                }).catch(err => {
                    console.error('Could not copy text: ', err);
                    prompt('请复制此链接:', shareUrl);
                });
            } catch (e) {
                console.error('Encoding failed:', e);
                alert('生成分享链接失败');
            }
        });
    }

    // Initialize default card text if not in view mode
    if (!isViewMode) {
        cardNushuText.textContent = '𛈬𛈻';
    }
});

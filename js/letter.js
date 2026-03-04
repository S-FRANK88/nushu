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
            const missingCharsUrl = new Set();
            if (decodedChinese && decodedChinese.length > 0) {
                for (let i = 0; i < decodedChinese.length; i++) {
                    const origChar = decodedChinese[i];
                    if (origChar.trim() === '') {
                        const s = document.createElement('span');
                        s.textContent = origChar;
                        cardNushuText.appendChild(s);
                        continue;
                    }
                    const hasMapped = typeof hasNushuMapping === 'function' && hasNushuMapping(origChar);
                    const s = document.createElement('span');
                    if (hasMapped) {
                        s.textContent = typeof toNushu === 'function' ? toNushu(origChar) : origChar;
                    } else {
                        // No Nüshu mapping — use Liuye calligraphy font
                        s.textContent = origChar;
                        s.style.fontFamily = "'LiuyeTi', serif";
                        missingCharsUrl.add(origChar);
                    }
                    cardNushuText.appendChild(s);
                }
            }

            // Wait for DOM to show the missing chars warning securely
            setTimeout(() => {
                const warningEl = document.getElementById('missing-chars-warning');
                const listEl = document.getElementById('missing-chars-list');
                if (warningEl && listEl) {
                    if (missingCharsUrl.size > 0) {
                        listEl.textContent = Array.from(missingCharsUrl).join('、');
                        warningEl.style.display = 'block';
                        // In view mode, we put it back in view since input panel is hidden
                        warningEl.style.marginTop = '2rem';
                        warningEl.style.color = '#e57373';
                        if (isViewMode) {
                            document.getElementById('letter-preview-panel').appendChild(warningEl);
                        }
                    }
                }
            }, 100);
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

    // ---- Theme Switching Logic ----
    const themeSelector = document.getElementById('theme-selector');
    const customBgUpload = document.getElementById('custom-bg-upload');
    const bgOctagon = document.getElementById('octagon-bg');

    // Theme Elements
    const ornamentsGroup = document.querySelectorAll('.card-ornament');
    const frameStyle1 = document.getElementById('card-frame-style1');
    const bgStyle2 = document.getElementById('card-bg-style2');
    const bgCustom = document.getElementById('card-bg-custom');

    let customImageSrc = '';

    themeSelector.addEventListener('change', (e) => {
        const theme = e.target.value;
        if (theme === 'custom') {
            customBgUpload.click();
            return; // Don't apply until file selected
        }
        applyTheme(theme);
    });

    customBgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                customImageSrc = ev.target.result;
                bgCustom.style.backgroundImage = `url(${customImageSrc})`;
                applyTheme('custom');
                // Force selector to show custom
                themeSelector.value = 'custom';
            };
            reader.readAsDataURL(file);
        } else {
            // Cancelled, reset dropdown
            themeSelector.value = letterCard.dataset.currentTheme || 'default';
        }
    });

    function applyTheme(theme) {
        letterCard.dataset.currentTheme = theme;
        // Hide all
        ornamentsGroup.forEach(el => el.classList.add('hidden'));
        frameStyle1.classList.add('hidden');
        bgStyle2.classList.add('hidden');
        bgCustom.classList.add('hidden');
        bgOctagon.classList.add('hidden');

        // Setup according to theme
        if (theme === 'default') {
            document.getElementById('card-front').style.backgroundColor = '#2b3e61';
            ornamentsGroup.forEach(el => el.classList.remove('hidden'));
            bgOctagon.classList.remove('hidden');
        } else if (theme === 'style1') {
            document.getElementById('card-front').style.backgroundColor = '#2b3e61';
            frameStyle1.classList.remove('hidden');
            bgOctagon.classList.remove('hidden');
        } else if (theme === 'style2') {
            document.getElementById('card-front').style.backgroundColor = 'transparent';
            bgStyle2.classList.remove('hidden');
        } else if (theme === 'custom') {
            document.getElementById('card-front').style.backgroundColor = '#2b3e61'; // Base fallback
            bgCustom.classList.remove('hidden');
        }
    }

    // Initial theme layout
    applyTheme('default');


    // ---- Font Size Controls (no character limit) ----
    const fontSizeRadios = document.querySelectorAll('input[name="font-size"]');

    fontSizeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            cardNushuText.style.fontSize = e.target.value;
        });
    });

    letterInput.addEventListener('input', () => {
        const text = letterInput.value;
        currentChineseText = text;
        currentCount.textContent = text.length;

        cardNushuText.innerHTML = '';
        const missingChars = new Set();

        if (text && text.length > 0) {
            for (let i = 0; i < text.length; i++) {
                const origChar = text[i];
                // Check if char is line break/space and skip missing marking
                if (origChar.trim() === '') {
                    const s = document.createElement('span');
                    s.textContent = origChar;
                    cardNushuText.appendChild(s);
                    continue;
                }

                const hasMapped = typeof hasNushuMapping === 'function' && hasNushuMapping(origChar);
                const s = document.createElement('span');
                if (hasMapped) {
                    s.textContent = typeof toNushu === 'function' ? toNushu(origChar) : origChar;
                } else {
                    // No Nüshu mapping — use Liuye calligraphy font
                    s.textContent = origChar;
                    s.style.fontFamily = "'LiuyeTi', serif";
                    missingChars.add(origChar);
                }
                cardNushuText.appendChild(s);
            }
        }

        // Display missing chars warning
        const warningEl = document.getElementById('missing-chars-warning');
        const listEl = document.getElementById('missing-chars-list');
        if (warningEl && listEl) {
            if (missingChars.size > 0) {
                listEl.textContent = Array.from(missingChars).join('、');
                warningEl.style.display = 'block';
            } else {
                warningEl.style.display = 'none';
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

    // Track mouse or touch for candlelight cursor
    function handlePointerMove(clientX, clientY) {
        if (!candleActive) return;
        candleCursor.style.left = clientX + 'px';
        candleCursor.style.top = clientY + 'px';

        const cardFront = document.getElementById('card-front');
        const cardRect = cardFront.getBoundingClientRect();

        // Calculate light position relative to the card for the CSS mask
        // Correctly handling the scale
        const scaleX = cardRect.width / cardFront.offsetWidth;
        const scaleY = cardRect.height / cardFront.offsetHeight;

        const relativeX = (clientX - cardRect.left) / scaleX;
        const relativeY = (clientY - cardRect.top) / scaleY;
        cardFront.style.setProperty('--light-x', `${relativeX}px`);
        cardFront.style.setProperty('--light-y', `${relativeY}px`);

        // Update full screen overlay mask position
        candlelightOverlay.style.setProperty('--mouse-x', `${clientX}px`);
        candlelightOverlay.style.setProperty('--mouse-y', `${clientY}px`);

        // Update shadow positions based on candle position
        updateShadows(clientX, clientY, scaleX, scaleY);
    }

    document.addEventListener('mousemove', (e) => {
        handlePointerMove(e.clientX, e.clientY);
    });

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    document.addEventListener('touchstart', (e) => {
        if (candleActive && e.touches.length > 0) {
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    function buildShadowMap() {
        shadowLayer.classList.remove('hidden');
        shadowLayer.innerHTML = '';

        const text = currentChineseText || "书我";
        const nushuSpans = Array.from(document.querySelectorAll('#card-nushu-text span'));

        // Create shadow characters — one Chinese char per Nüshu span
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
        transition: font-size 0.15s ease, color 0.15s ease;
        transform: translate(-50%, -50%);
        text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        white-space: nowrap;
      `;
            shadowChar.dataset.index = i;
            shadowLayer.appendChild(shadowChar);
        });

        nushuChars = Array.from(shadowLayer.children);
    }

    function updateShadows(mouseX, mouseY, scaleX = 1, scaleY = 1) {
        const cardFront = document.getElementById('card-front');
        const cardRect = cardFront.getBoundingClientRect();

        const maxDist = 120 * Math.max(scaleX, scaleY); // Light reveal radius scaled

        // Ensure shadow wrapper has size
        shadowLayer.style.width = '100%';
        shadowLayer.style.height = '100%';

        const nushuSpans = document.querySelectorAll('#card-nushu-text span');

        nushuChars.forEach((shadowChar, i) => {
            const spanEl = nushuSpans[i];
            if (!spanEl) return;

            // Get actual on-screen location of the Nüshu character
            const spanRect = spanEl.getBoundingClientRect();

            // Center point of the actual character
            const screenBaseX = spanRect.left + spanRect.width / 2;
            const screenBaseY = spanRect.top + spanRect.height / 2;

            // Position relative to the card container, unscaled
            const baseX = (screenBaseX - cardRect.left) / scaleX;
            const baseY = (screenBaseY - cardRect.top) / scaleY;

            // Distance from mouse to the character (on screen)
            const dx = screenBaseX - mouseX;
            const dy = screenBaseY - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Proximity: how "lit" this character is (1 = right under candle, 0 = out of range)
            let proximity = Math.max(0, 1 - (dist / maxDist));
            proximity = Math.pow(proximity, 1.2);

            // Shadow offset: very small, cast away from the light (like a real shadow)
            const stretchFactor = 0.03 + (dist / 3000);
            const shadowOffsetX = (dx * stretchFactor) / scaleX;
            const shadowOffsetY = (dy * stretchFactor) / scaleY;

            // Final position stays very close to the original character
            const finalX = baseX + shadowOffsetX;
            const finalY = baseY + shadowOffsetY;

            shadowChar.style.left = finalX + 'px';
            shadowChar.style.top = finalY + 'px';

            // Font size matches the Nüshu character size for proper overlap
            const nushuFontSize = parseFloat(getComputedStyle(spanEl).fontSize) || 24;
            const fontSize = nushuFontSize * 0.85;
            const opacity = proximity * 0.9;
            const blurRadius = Math.max(0.5, dist / 60);

            shadowChar.style.fontSize = fontSize + 'px';
            shadowChar.style.color = `rgba(15, 20, 30, 0)`;
            shadowChar.style.textShadow = `0 0 ${blurRadius}px rgba(230, 150, 50, ${opacity})`;
        });
    }

    // ---- Helper: Load an image as a promise ----
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    // ---- Save Card as Image (Pure Canvas Layered Drawing) ----
    btnSave.addEventListener('click', async () => {
        // Make sure card is showing front
        if (letterCard.classList.contains('flipped')) {
            letterCard.classList.remove('flipped');
            btnFlip.textContent = '🔄 翻转卡片';
            await new Promise(r => setTimeout(r, 900));
        }

        try {
            // Wait for all fonts to be ready
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }

            // === Card dimensions ===
            const cardW = 380, cardH = 540;
            const retina = 2;

            // === Layer 1: Card background canvas ===
            const cardCanvas = document.createElement('canvas');
            cardCanvas.width = cardW * retina;
            cardCanvas.height = cardH * retina;
            const cc = cardCanvas.getContext('2d');
            cc.scale(retina, retina);

            const theme = letterCard.dataset.currentTheme || 'default';

            // === Layer 1: Card background ===
            if (theme === 'style2' || theme === 'custom') {
                try {
                    const bgImgSrc = theme === 'style2' ? 'images/bg-style2.jpg' : customImageSrc;
                    const bImg = await loadImage(bgImgSrc);
                    // Draw cover
                    cc.save();
                    cc.beginPath();
                    cc.rect(0, 0, cardW, cardH);
                    cc.clip();
                    const rW = cardW / bImg.width;
                    const rH = cardH / bImg.height;
                    const r = Math.max(rW, rH);
                    const nW = bImg.width * r;
                    const nH = bImg.height * r;
                    cc.drawImage(bImg, (cardW - nW) / 2, (cardH - nH) / 2, nW, nH);
                    cc.restore();
                } catch (e) {
                    console.error("Failed to draw full background, falling back to blue:", e);
                    cc.fillStyle = '#2b3e61';
                    cc.fillRect(0, 0, cardW, cardH);
                }
            } else {
                cc.fillStyle = '#2b3e61';
                cc.fillRect(0, 0, cardW, cardH);

                // Draw subtle inset shadow effect
                const grad = cc.createRadialGradient(cardW / 2, cardH / 2, 100, cardW / 2, cardH / 2, cardW);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(1, 'rgba(0,0,0,0.3)');
                cc.fillStyle = grad;
                cc.fillRect(0, 0, cardW, cardH);

                // Draw card border
                cc.strokeStyle = 'rgba(160,140,110,0.35)';
                cc.lineWidth = 2;
                cc.strokeRect(8, 8, cardW - 16, cardH - 16);
            }

            // === Layer 2: Ornaments / Overlays ===
            if (theme === 'default') {
                try {
                    const flowerImg = await loadImage('images/corner-flower.png');
                    const flowerSize = 140;
                    cc.drawImage(flowerImg, 0, 0, flowerSize, flowerSize);
                    cc.save(); cc.translate(cardW, 0); cc.scale(-1, 1); cc.drawImage(flowerImg, 0, 0, flowerSize, flowerSize); cc.restore();
                    cc.save(); cc.translate(0, cardH); cc.scale(1, -1); cc.drawImage(flowerImg, 0, 0, flowerSize, flowerSize); cc.restore();
                    cc.save(); cc.translate(cardW, cardH); cc.scale(-1, -1); cc.drawImage(flowerImg, 0, 0, flowerSize, flowerSize); cc.restore();
                } catch (e) { console.warn('Could not load flower ornament:', e); }
            } else if (theme === 'style1') {
                try {
                    const frameImg = await loadImage('images/corner-style1.png');
                    cc.drawImage(frameImg, 0, 0, cardW, cardH);
                } catch (e) { console.warn('Could not load frame style1:', e); }
            }

            // === Layer 3: Text characters in vertical grid ===
            const spans = cardNushuText.querySelectorAll('span');
            if (spans.length > 0) {
                const fontSize = parseFloat(getComputedStyle(cardNushuText).fontSize) || 35;
                const cellSize = fontSize * 1.4;
                const gap = fontSize * 0.15;
                const step = cellSize + gap;

                // Text area padding (inside the card)
                const padTop = 45;
                const padRight = 20;
                const padBottom = 20;
                const padLeft = 20;

                const areaH = cardH - padTop - padBottom;
                const rowsPerCol = Math.floor(areaH / step);

                cc.fillStyle = '#fcefdc';
                cc.textAlign = 'center';
                cc.textBaseline = 'middle';

                let charIndex = 0;
                spans.forEach((span) => {
                    const charText = span.textContent;
                    if (!charText || charText.trim() === '') {
                        charIndex++;
                        return;
                    }

                    const col = Math.floor(charIndex / rowsPerCol);
                    const row = charIndex % rowsPerCol;

                    // Right to left columns
                    const x = cardW - padRight - (col + 0.5) * step;
                    const y = padTop + (row + 0.5) * step;

                    // Check if the span uses LiuyeTi
                    const isLiuye = span.style.fontFamily && span.style.fontFamily.includes('LiuyeTi');

                    // Set font
                    if (isLiuye) {
                        cc.font = `${fontSize}px 'LiuyeTi', serif`;
                    } else {
                        cc.font = `${fontSize}px 'Nyushu', 'NotoSansNushu', 'Noto Sans Nushu', sans-serif`;
                    }

                    // Text shadow effect
                    cc.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    cc.shadowBlur = 8;
                    cc.shadowOffsetX = 0;
                    cc.shadowOffsetY = 2;

                    cc.fillText(charText, x, y);

                    charIndex++;
                });

                // Reset shadow
                cc.shadowColor = 'transparent';
                cc.shadowBlur = 0;
                cc.shadowOffsetX = 0;
                cc.shadowOffsetY = 0;
            }

            // === Compose final share image ===
            const padding = 60 * retina;
            const footerHeight = 140 * retina;

            const shareCanvas = document.createElement('canvas');
            const ctx = shareCanvas.getContext('2d');

            shareCanvas.width = cardCanvas.width + (padding * 2);
            shareCanvas.height = cardCanvas.height + padding + padding + footerHeight;

            // 1. Draw dark background
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, shareCanvas.width, shareCanvas.height - footerHeight);

            // 2. Draw the card canvas with shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 40 * retina;
            ctx.shadowOffsetY = 20 * retina;
            ctx.drawImage(cardCanvas, padding, padding);

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // 3. Draw footer background
            const footerY = shareCanvas.height - footerHeight;
            ctx.fillStyle = '#f4f4f5';
            ctx.fillRect(0, footerY, shareCanvas.width, footerHeight);

            // 4. Generate & draw QR code
            const qrSize = 90 * retina;
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
                const qrImg = await loadImage(qrUrl);
                ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
            } catch (e) {
                console.warn("Could not draw QR code:", e);
            }

            // 5. Draw hint text
            ctx.fillStyle = '#3f3f46';
            ctx.font = `${18 * retina}px 'Noto Serif SC', serif, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText("扫码生成专属女书密信", qrX + qrSize + 24 * retina, footerY + footerHeight / 2);

            // 6. Download final image
            const link = document.createElement('a');
            link.download = `Nushu-Letter-${Date.now()}.jpg`;
            link.href = shareCanvas.toDataURL('image/jpeg', 0.95);
            link.click();

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

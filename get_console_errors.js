const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // Catch fetch/network errors
    page.on('requestfailed', request => {
        console.log(`PAGE NETWORK ERROR: ${request.url()} - ${request.failure().errorText}`);
    });

    await page.goto('http://localhost:8044/');
    await new Promise(r => setTimeout(r, 1000)); // wait 1s

    // Click the button
    try {
        await page.click('#btn-write-letter-hero');
        console.log("Button clicked!");
        await new Promise(r => setTimeout(r, 1000));

        // Log final visible section
        const className = await page.evaluate(() => document.querySelector('#letter-page').className);
        console.log("Letter page classes:", className);
    } catch (e) {
        console.log("Click error:", e.message);
    }
    await browser.close();
})();

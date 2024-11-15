const {Builder, By, Key, until} = require('selenium-webdriver');
const TurndownService = require('turndown');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');

async function searchGoogle(keyword) {
    // Create a new browser instance
    let driver = await new Builder().forBrowser('chrome').build();
    let scrapeResults = [];
    
    try {
        // Navigate to Google
        await driver.get('https://www.google.com');
        
        // Find the search box and enter keyword
        let searchBox = await driver.findElement(By.name('q'));
        await searchBox.sendKeys(keyword, Key.RETURN);
        
        // Wait for search results to load
        await driver.wait(until.elementLocated(By.css('div.g')), 10000);
        
        // Get top 10 search results
        const searchResults = await driver.findElements(By.css('div.g'));
        
        for(let i = 0; i < Math.min(3, searchResults.length); i++) {
            try {
                // Get title and link elements
                const titleElement = await searchResults[i].findElement(By.css('h3'));
                const linkElement = await searchResults[i].findElement(By.css('a'));
                
                // Extract text and href
                const title = await titleElement.getText();
                const link = await linkElement.getAttribute('href');

                if (title) {
                    scrapeResults.push({
                        title, link
                    });
                }
            } catch (error) {
                console.log(`Could not extract result #${i + 1}`);
            }
        }
    } finally {
        await driver.quit();
    }

    return scrapeResults.map((item) => {
        return `Title: ${item.title}\nLink: ${item.link}`;
    }).join('\n\n');
}

async function scrapeToMarkdown(url) {
    let driver = await new Builder().forBrowser('chrome').build();
    let markdown = '';
    
    try {
        await driver.get(url);
        await driver.wait(until.elementLocated(By.css('body')), 10000);
        
        // Get the page content
        const html = await driver.getPageSource();
        const dom = new JSDOM(html, { url });
        const document = dom.window.document;

        // Remove all script tags first
        document.querySelectorAll('script').forEach(script => script.remove());

        // Try to find main content directly first
        let mainContent = document.querySelector('article') || 
                         document.querySelector('.post') || 
                         document.querySelector('.article') ||
                         document.querySelector('main');

        // If we can't find main content, use Readability as fallback
        if (!mainContent) {
            console.log('Main content not found, using Readability...');
            const reader = new Readability(document);
            const article = reader.parse();
            
            if (!article) {
                throw new Error('Could not parse content with Readability');
            }

            // Create a temporary container for the Readability content
            mainContent = document.createElement('div');
            mainContent.innerHTML = article.content;
        }

        // Get the title
        let title = '';
        const titleElement = document.querySelector('h1') || 
                           mainContent.querySelector('h1');
        
        if (titleElement) {
            title = titleElement.textContent.trim();
            // Remove title from content if it exists there
            if (mainContent.contains(titleElement)) {
                titleElement.remove();
            }
        } else {
            // Try to get title from Readability
            const reader = new Readability(document.cloneNode(true));
            const article = reader.parse();
            if (article && article.title) {
                title = article.title;
            }
        }

        let markdownContent = '';
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced'
        });

        // Process the content node by node
        for (const node of Array.from(mainContent.childNodes)) {
            if (node.nodeName === 'PRE' && node.querySelector('code')) {
                const codeEl = node.querySelector('code');
                const language = codeEl.className.match(/language-(\w+)/) || 
                               node.className.match(/language-(\w+)/) ||
                               codeEl.className.match(/(\w+)/) || ['', ''];
                
                const codeContent = codeEl.textContent.trim()
                    .replace(/\u200B/g, '') // Remove zero-width spaces
                    .replace(/\uFEFF/g, ''); // Remove byte order marks
                markdownContent += `\n\`\`\`${language[1]}\n${codeContent}\n\`\`\`\n\n`;
            } else if (node.nodeType === 1) { // Element node
                const fragment = document.createElement('div');
                fragment.appendChild(node.cloneNode(true));
                // Clean the fragment
                fragment.querySelectorAll('script').forEach(script => script.remove());
                fragment.querySelectorAll('[data-br]').forEach(el => el.remove());
                
                const md = turndownService.turndown(fragment.innerHTML);
                if (md.trim()) {
                    markdownContent += md + '\n\n';
                }
            }
        }

        // Add title and content
        markdown = title ? `# ${title}\n\n${markdownContent}` : markdownContent;
        
        // Clean up any extra newlines and clean the content
        markdown = markdown
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\u200B/g, '')
            .replace(/\uFEFF/g, '')
            .trim();
        
    } catch (error) {
        console.error('Error scraping the page:', error);
        throw error;
    } finally {
        await driver.quit();
    }
    
    return markdown;
}

module.exports = {
    searchGoogle,
    scrapeToMarkdown
};

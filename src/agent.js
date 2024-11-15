const { Assistant, Tool, Thread } = require('experts');
const { scrapeToMarkdown , searchGoogle} = require('./scraper');
const { getRedditMarkdownText} = require('./reddit');

class RedditTool extends Tool {
  constructor() {
    super({
      name: "Reddit Tool",
      instructions: "Use this tool to fetch markdown from Reddit",
      llm: false,
      parentsTools: [
        {
          type: "function",
          function: {
            name: "getRedditMarkdownText",
            description: "Fetch Reddit markdown content",
            parameters: {
              type: "object",
              properties: {
                url: { type: "string", description: "The Reddit URL" }
              },
              required: ["url"]
            }
          }
        }
      ]
    });
  }

  async ask(message) {
    const {url} = JSON.parse(message);
    console.log('Fetching markdown from Reddit:', url);
    const result = await getRedditMarkdownText(url);
    console.log('Reddit results:', result);
    return result;
  }

}


// First, create tools for scraping and searching
class ScraperTool extends Tool {
  constructor() {
    super({
      name: "Web Scraper Tool",
      instructions: "Use this tool to scrape web content and convert it to markdown",
      llm: false,
      parentsTools: [
        {
          type: "function",
          function: {
            name: "scrapeToMarkdown",
            description: "Scrapes a webpage and converts it to markdown format",
            parameters: {
              type: "object",
              properties: {
                url: { type: "string", description: "The URL to scrape" }
              },
              required: ["url"]
            }
          }
        }
      ]
    });
  }

  async ask(message) {
    const { url } = JSON.parse(message);
    console.log('Get markdown content:', url);
    return await scrapeToMarkdown(url);
  }
}

class SearchTool extends Tool {
  constructor() {
    super({
      name: "Google Search Tool",
      instructions: "Use this tool to perform Google searches",
      llm: false,
      parentsTools: [
        {
          type: "function",
          function: {
            name: "searchGoogle",
            description: "Performs a Google search and returns results",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string", description: "The search query" }
              },
              required: ["query"]
            }
          }
        }
      ]
    });
  }

  async ask(message) {
    const { query } = JSON.parse(message);
    console.log('Seaching on Google:', query);
    return await searchGoogle(query);
  }
}

// Create main research assistant
class ResearchAssistant extends Assistant {
  constructor() {
    super({
      name: "Research Assistant",
      instructions: `You are a research assistant that can search the web and extract information.
        When you need to find information:
        1. Use searchGoogle to find relevant pages
        2. Use scrapeToMarkdown to extract content from those pages
        3. Analyze and summarize the information found
        
        Always be thorough and accurate in your research.`,
      model: "gpt-4o",
      temperature: 0.7
    });

    // Add tools to the assistant
    this.addAssistantTool(SearchTool);
    this.addAssistantTool(ScraperTool);
    this.addAssistantTool(RedditTool);
  }
}

// Export the assistant for use
module.exports = {
  ResearchAssistant,
  createResearchSession: async () => {
    const assistant = await ResearchAssistant.create();
    const thread = await Thread.create();
    return { assistant, thread };
  }
};

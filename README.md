# Selenium Agent

Let's have a fun with LLM agent using selenium as a tool to scrape web content.

## Description

Selenium Agent is a research assistant that can search the web and extract information from various sources, including Google and Reddit. It utilizes web scraping techniques to gather data and present it in a user-friendly markdown format.

## Installation Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/selenium-agent.git
   cd selenium-agent
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

Please set the `OPENAI_API_KEY` environment variable with your OpenAI API key.

To run the Selenium Agent, execute:
```bash
node src/index.js
```

You can then interact with the assistant by providing tasks or questions.

## Dependencies
- selenium-webdriver
- turndown
- @mozilla/readability
- jsdom

## Contributing Guidelines

Contributions are welcome! Please submit a pull request or open an issue for discussion.

## License

This project is licensed under the MIT License.
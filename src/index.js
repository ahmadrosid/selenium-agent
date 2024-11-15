const { createResearchSession } = require('./agent');

async function main() {
  console.log('Welcome to the Selenium Agent! We are glad to have you here.');
  const { assistant, thread } = await createResearchSession();

  assistant.on("textDelta", (delta) => {
    process.stdout.write(delta.value);
  });
  let result = null;
  while (true) {
    if (!result) {
        process.stdout.write('Give me a Task: ');
    } else {
        process.stdout.write("\nQuestion: ");
    }
    const question = await new Promise((resolve) => {
      process.stdin.once('data', (data) => resolve(data.toString().trim()));
    });
    if (question === 'exit') break;
    const response = await assistant.ask(question, thread.id, {});
    result = response;
  }
}

main().catch(console.error);

const { processTranslations } = require("./lib/translate");
const dotenv = require("dotenv");
const argv = require("yargs").argv;

if (argv.apiKey) {
  process.env.OPENAI_API_KEY = argv.apiKey;
} else {
  dotenv.config();
}

processTranslations();

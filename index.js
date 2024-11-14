const { processTranslations } = require("./lib/translate");
const dotenv = require("dotenv");
const argv = require("yargs").argv;

dotenv.config();

const localesDir = argv.localesDir || process.env.LOCALES_DIR || "./i18n/";
const openAiApiKey =
  argv.apiKey || process.env.OPENAI_API_KEY || "YOUR_OPENAI_API_KEY";
const openAiModel = argv.model || process.env.OPENAI_MODEL || "gpt-3.5-turbo";

processTranslations(localesDir, openAiApiKey, openAiModel);
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const dotenv = require("dotenv");
const argv = require("yargs").argv;

dotenv.config();

const defaultLang = JSON.parse(fs.readFileSync("./i18n/en.json", "utf8")); // Adjust to your default language file
const localesDir = argv.localesDir || process.env.LOCALES_DIR || "./i18n/";
const openAiApiKey =
  argv.apiKey || process.env.OPENAI_API_KEY || "YOUR_OPENAI_API_KEY";
const openAiModel = argv.model || process.env.OPENAI_MODEL || "gpt-3.5-turbo";

async function translateText(text, targetLanguage) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: openAiModel,
        messages: [
          {
            role: "system",
            content: `Translate the following text to ${targetLanguage}:`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        max_tokens: 60,
        temperature: 0.3,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiApiKey}`,
        },
      }
    );
    if (
      response.data &&
      response.data.choices &&
      response.data.choices[0] &&
      response.data.choices[0].message
    ) {
      return response.data.choices[0].message.content.trim();
    } else {
      console.error("Unexpected API response structure:", response.data);
      return text; // Fallback to the original text if translation fails
    }
  } catch (error) {
    console.error(
      "Translation API Error:",
      error.response ? error.response.data : error.message
    );
    return text; // Fallback to the original text if translation fails
  }
}

async function findAndTranslateMissingKeys(
  defaultObj,
  targetObj,
  targetLang,
  basePath = ""
) {
  let filledKeys = {};

  for (let key in defaultObj) {
    const fullPath = basePath ? `${basePath}.${key}` : key;

    if (
      typeof defaultObj[key] === "object" &&
      !Array.isArray(defaultObj[key])
    ) {
      filledKeys[key] = await findAndTranslateMissingKeys(
        defaultObj[key],
        targetObj[key] || {},
        targetLang,
        fullPath
      );
    } else if (!(key in targetObj)) {
      console.log(`Translating missing key "${fullPath}" to ${targetLang}...`);
      filledKeys[key] = await translateText(defaultObj[key], targetLang);
    } else {
      filledKeys[key] = targetObj[key];
    }
  }

  return filledKeys;
}

function beautifyJson(filePath) {
  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const beautifiedContent = JSON.stringify(content, null, 2);
  fs.writeFileSync(filePath, beautifiedContent, "utf8");
  console.log(`${filePath} has been beautified.`);
}

(async () => {
  const files = fs
    .readdirSync(localesDir)
    .filter((file) => file.endsWith(".json") && file !== "en.json");

  for (const file of files) {
    const localePath = path.join(localesDir, file);
    const targetLang = file.split(".")[0]; // Assumes file name is like "fr.json" for French

    console.log(`Checking if file exists: ${localePath}`);
    if (fs.existsSync(localePath)) {
      console.log(`File exists: ${localePath}`);
      const targetLangContent = JSON.parse(fs.readFileSync(localePath, "utf8"));
      console.log(`Processing ${file}...`);

      const completeContent = await findAndTranslateMissingKeys(
        defaultLang,
        targetLangContent,
        targetLang
      );

      // Save the resulting JSON with no missing keys
      fs.writeFileSync(
        localePath,
        JSON.stringify(completeContent, null, 2),
        "utf8"
      );
      console.log(`Missing keys in ${file} have been filled and saved.`);

      // Beautify the JSON
      beautifyJson(localePath);
    } else {
      console.warn(`File ${localePath} does not exist.`);
    }
  }

  console.log("All language files have been processed.");
})();
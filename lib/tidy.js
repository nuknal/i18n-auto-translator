const fs = require("fs");
const path = require("path");
const argv = require("yargs").argv;

const localesDir =
  argv.localesDir ||
  process.env.LOCALES_DIR ||
  path.join(__dirname, "../i18n/");

function beautifyJson(filePath) {
  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const beautifiedContent = JSON.stringify(content, null, 2);
  fs.writeFileSync(filePath, beautifiedContent, "utf8");
  console.log(`${filePath} has been beautified.`);
}

function tidyAllJsonFiles() {
  const files = fs
    .readdirSync(localesDir)
    .filter((file) => file.endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(localesDir, file);
    beautifyJson(filePath);
  }

  console.log("All JSON files have been tidied up.");
}

tidyAllJsonFiles();
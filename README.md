# i18n-auto-translator

## Description

i18n-auto-translator is a powerful tool designed to automatically translate i18n JSON files using various AI language models (OpenAI, Anthropic Claude). This package helps you maintain multilingual support in your applications by filling in missing translations and tidying up your JSON files.

## Installation

To install the package, you need to have Node.js and npm installed on your machine. Then, you can install the dependencies by running:

```sh
npm install
```

## Usage

### Translating JSON Files

To translate your i18n JSON files, you can use the following script:

```sh
# Note: Use -- before arguments when using npm run
npm run translate -- --apiKey=YOUR_API_KEY --localesDir=./path/to/your/i18n --model=gpt-3.5-turbo --provider=openai --languages=fr,es,de

# Enable debug mode for more detailed logs
DEBUG=true npm run translate -- --provider=bedrock --model=anthropic.claude-v2 --languages=fr,es,de
```

Or using the shorter argument aliases:

```sh
npm run translate -k YOUR_API_KEY -d ./path/to/your/i18n -m gpt-3.5-turbo -p openai -l fr,es,de
```

To see all available options:
```sh
npm run translate -- --help
```

This script will:
1. Create language files (if they don't exist) for each specified language
2. Process each language file and translate any missing keys
3. Maintain existing translations
4. Beautify the JSON output

If no languages are specified, the script will process all existing JSON files in the locales directory.

You can also use `npx` to run the translation script without installing the package globally:

```sh
npx i18n-auto-translator translate --apiKey=YOUR_API_KEY --localesDir=./path/to/your/i18n --model=gpt-3.5-turbo --provider=openai --languages=fr,es,de
```

### Tidying Up JSON Files

To tidy up your JSON files and ensure they are properly formatted, you can use the following script:

```sh
npm run tidy --localesDir=./path/to/your/i18n
```

This script will beautify all JSON files in the specified `localesDir` directory, making them easier to read and maintain.

Alternatively, you can use `npx` to run the tidy script without installing the package globally:

```sh
npx i18n-auto-translator tidy --localesDir=./path/to/your/i18n
```

### Using `npx`

`npx` is a tool that comes with npm (since version 5.2.0) and allows you to run commands from npm packages without globally installing them. This can be useful for running scripts like the ones provided by `i18n-auto-translator` without polluting your global npm installation.

## Configuration

The package uses environment variables to configure the AI provider settings. You can either pass these as command-line arguments or set them in a `.env` file in the root directory of your project:

```
AI_API_KEY=your_api_key
AI_MODEL=gpt-3.5-turbo
AI_PROVIDER=openai
LOCALES_DIR=./path/to/your/i18n
TARGET_LANGUAGES=fr,es,de  # Optional: comma-separated list of target languages
```

### Supported AI Providers

#### OpenAI
- Provider: `openai`
- Models: gpt-3.5-turbo, gpt-4, etc.
- API Key: OpenAI API key

#### Anthropic Claude
- Provider: `claude`
- Models: claude-instant-1, claude-2, etc.
- API Key: Anthropic API key

#### Amazon Bedrock
- Provider: `bedrock`
- Models: 
  - `anthropic.claude-v2`
  - `anthropic.claude-instant-v1`
  - `amazon.titan-text-express-v1`
- Credentials: AWS Access Key ID and Secret Access Key
- Region: AWS Region where Bedrock is available

Example using Claude:
```sh
npm run translate -k YOUR_ANTHROPIC_KEY -m claude-2 -p claude -d ./path/to/your/i18n -l fr,es,de
```

Example using Amazon Bedrock:
```sh
# Using long arguments
npm run translate -- \
  --provider=bedrock \
  --model=anthropic.claude-v2 \
  --awsAccessKey=YOUR_AWS_ACCESS_KEY \
  --awsSecretKey=YOUR_AWS_SECRET_KEY \
  --awsRegion=us-east-1 \
  --languages=fr,es,de

# Using short arguments
npm run translate -- \
  -p bedrock \
  -m anthropic.claude-v2 \
  --awsAccessKey=YOUR_AWS_ACCESS_KEY \
  --awsSecretKey=YOUR_AWS_SECRET_KEY \
  --awsRegion=us-east-1 \
  -l fr,es,de

# With debug mode
DEBUG=true npm run translate -- \
  --provider=bedrock \
  --model=anthropic.claude-v2 \
  --awsAccessKey=YOUR_AWS_ACCESS_KEY \
  --awsSecretKey=YOUR_AWS_SECRET_KEY \
  --awsRegion=us-east-1 \
  --languages=fr,es,de
```

You can also configure AWS credentials using environment variables:
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AI_PROVIDER=bedrock
AI_MODEL=anthropic.claude-v2
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Created by Tarik Ermis. For any inquiries, please contact [tarik@n3tz.io](mailto:tarik@n3tz.io).

# i18n-auto-translator

## Description

i18n-auto-translator is a powerful tool designed to automatically translate i18n JSON files using OpenAI's GPT-3.5-turbo model. This package helps you maintain multilingual support in your applications by filling in missing translations and tidying up your JSON files.

## Installation

To install the package, you need to have Node.js and npm installed on your machine. Then, you can install the dependencies by running:

```sh
npm install
```

## Usage

### Translating JSON Files

To translate your i18n JSON files, you can use the following script:

```sh
npm run translate --apiKey=YOUR_OPENAI_API_KEY --localesDir=./path/to/your/i18n --model=gpt-3.5-turbo
```

This script will process all JSON files in the specified `localesDir` directory, translating any missing keys using the OpenAI API. Make sure to replace `YOUR_OPENAI_API_KEY` with your actual OpenAI API key.

Alternatively, you can use `npx` to run the translation script without installing the package globally:

```sh
npx i18n-auto-translator translate --apiKey=YOUR_OPENAI_API_KEY --localesDir=./path/to/your/i18n --model=gpt-3.5-turbo
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

The package uses environment variables to configure the OpenAI API key and model. You can either pass these as command-line arguments or set them in a `.env` file in the root directory of your project:

```
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo
LOCALES_DIR=./path/to/your/i18n
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Created by Tarik Ermis. For any inquiries, please contact [tarik@n3tz.io](mailto:tarik@n3tz.io).
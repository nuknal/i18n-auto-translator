#!/usr/bin/env node

const { processTranslations } = require('./lib/translate')
const dotenv = require('dotenv')
const argv = require('yargs')
  .option('languages', {
    alias: 'l',
    describe: 'Comma-separated list of target languages (e.g., fr,es,de)',
    type: 'string',
    coerce: (val) => {
      if (!val) return []
      const langs = val
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean)
      console.log('Parsed languages:', langs)
      return langs
    },
  })
  .option('apiKey', {
    alias: 'k',
    describe: 'API key for the selected provider',
    type: 'string',
  })
  .option('provider', {
    alias: 'p',
    describe: 'AI provider (openai, claude, or bedrock)',
    type: 'string',
  })
  .option('model', {
    alias: 'm',
    describe: 'Model to use for translations',
    type: 'string',
  })
  .option('localesDir', {
    alias: 'd',
    describe: 'Directory containing locale files',
    type: 'string',
  })
  .option('awsAccessKey', {
    describe: 'AWS Access Key ID for Bedrock',
    type: 'string',
  })
  .option('awsSecretKey', {
    describe: 'AWS Secret Access Key for Bedrock',
    type: 'string',
  })
  .option('awsRegion', {
    describe: 'AWS Region for Bedrock',
    type: 'string',
  })
  .help().argv

dotenv.config()

const localesDir = argv.localesDir || process.env.LOCALES_DIR || './i18n/'
const aiApiKey = argv.apiKey || process.env.AI_API_KEY || 'YOUR_API_KEY'
const aiModel = argv.model || process.env.AI_MODEL || 'deepseek-chat'
const aiProvider = argv.provider || process.env.AI_PROVIDER || 'openai'
const targetLanguages = argv.languages || [
  'zh-CN',
  'zh-TW',
  'ja',
  'ko',
  'fr',
  'es',
  'de',
  'ar',
  'ru',
  'tr',
]

if (targetLanguages.length === 0) {
  console.log(
    'No target languages specified. Using existing language files in the locales directory.'
  )
} else {
  console.log(`Target languages: ${targetLanguages.join(', ')}`)
}

processTranslations(localesDir, aiApiKey, aiModel, aiProvider, targetLanguages)

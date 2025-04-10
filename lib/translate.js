const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dotenv = require('dotenv')
const argv = require('yargs').argv
const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require('@aws-sdk/client-bedrock-runtime')

dotenv.config()

const localesDir = argv.localesDir || process.env.LOCALES_DIR || './i18n/'
const defaultLang = JSON.parse(
  fs.readFileSync(path.join(localesDir, `en.json`), 'utf8')
) // Adjust to your default language file
const aiProvider = argv.provider || process.env.AI_PROVIDER || 'openai'
const aiModel = argv.model || process.env.AI_MODEL || 'deepseek-chat'

// Language code to full name mapping
const languageNames = {
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ar: 'Arabic',
  tr: 'Turkish',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  // Add more as needed
}

// Provider-specific credentials
const credentials = {
  openai: {
    apiKey: argv.apiKey || process.env.OPENAI_API_KEY || process.env.AI_API_KEY,
  },
  claude: {
    apiKey: argv.apiKey || process.env.CLAUDE_API_KEY || process.env.AI_API_KEY,
  },
  bedrock: {
    accessKey: argv.awsAccessKey || process.env.AWS_ACCESS_KEY_ID,
    secretKey: argv.awsSecretKey || process.env.AWS_SECRET_ACCESS_KEY,
    region: argv.awsRegion || process.env.AWS_REGION || 'us-east-1',
  },
}

async function translateWithOpenAI(text, targetLanguage, model, apiKey) {
  try {
    const targetLang =
      languageNames[targetLanguage.toLowerCase()] || targetLanguage
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text to ${targetLang}. Only provide the direct translation, no additional text.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        max_tokens: 600,
        temperature: 0.3,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    )
    if (response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content.trim()
    }
    throw new Error('Unexpected API response structure')
  } catch (error) {
    throw error
  }
}

async function translateWithClaude(text, targetLanguage, model, apiKey) {
  try {
    const targetLang =
      languageNames[targetLanguage.toLowerCase()] || targetLanguage
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: `You are a professional translator. Translate the following text to ${targetLang}. Only provide the direct translation, no additional text: ${text}`,
          },
        ],
        max_tokens: 60,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      }
    )
    if (response.data?.content) {
      return response.data.content.trim()
    }
    throw new Error('Unexpected API response structure')
  } catch (error) {
    throw error
  }
}

async function translateWithBedrock(
  text,
  targetLanguage,
  model,
  accessKey,
  secretKey,
  region
) {
  try {
    const client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    })

    const targetLang =
      languageNames[targetLanguage.toLowerCase()] || targetLanguage

    const prompt = `You are a professional translator. Your task is to translate the following text from English to ${targetLang}. Only output the direct translation, nothing else.

Text to translate: "${text}"

Important:
- Only output the direct translation
- No explanations or additional text
- No quotes unless they are part of the original text
- No prefixes like "Here's the translation" or "Translation:"
- No language indicators like "In French:" or "French translation:"`

    // Prepare the request based on the model
    let body
    if (model.startsWith('anthropic.claude')) {
      body = {
        prompt: `\n\nHuman: ${prompt}\n\nAssistant: `,
        max_tokens_to_sample: 2048,
        temperature: 0.1,
        top_p: 1,
        stop_sequences: ['\n\nHuman:'],
        anthropic_version: 'bedrock-2023-05-31',
      }
    } else if (model.startsWith('amazon.titan')) {
      body = {
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: 1000,
          temperature: 0.1,
          topP: 1,
          stopSequences: ['\n'],
        },
      }
    } else {
      throw new Error(`Unsupported Bedrock model: ${model}`)
    }

    try {
      const command = new InvokeModelCommand({
        modelId: model,
        body: Buffer.from(JSON.stringify(body)),
        contentType: 'application/json',
        accept: '*/*',
      })

      const response = await client.send(command)
      const responseBody = JSON.parse(new TextDecoder().decode(response.body))

      if (process.env.DEBUG) {
        console.log('Bedrock response:', JSON.stringify(responseBody, null, 2))
      }

      // Extract completion based on model type
      let translation
      if (model.startsWith('anthropic.claude')) {
        translation = responseBody.completion?.trim()
      } else if (model.startsWith('amazon.titan')) {
        translation = responseBody.results?.[0]?.outputText?.trim()
      }

      if (!translation) {
        throw new Error('No translation found in response')
      }

      // Clean up the translation
      translation = translation
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/^(Here'?s?\s*(is\s*)?)?the\s*translation\s*:?\s*/i, '') // Remove various forms of prefixes
        .replace(/^(En|In|The)\s+\w+(\s+translation)?:?\s*/i, '') // Remove language prefixes
        .replace(/^Translation\s*:?\s*/i, '') // Remove "Translation:" prefix
        .replace(/^I'll translate this\s*:?\s*/i, '') // Remove "I'll translate this" prefix
        .replace(/^Translated text\s*:?\s*/i, '') // Remove "Translated text:" prefix
        .replace(/^Direct translation\s*:?\s*/i, '') // Remove "Direct translation:" prefix
        .trim()

      return translation
    } catch (error) {
      console.error('Bedrock translation error:', error)
      console.error('Request body:', JSON.stringify(body, null, 2))
      throw error
    }
  } catch (error) {
    throw error
  }
}

async function translateText(text, targetLanguage) {
  try {
    const provider = aiProvider.toLowerCase()
    if (!credentials[provider]) {
      throw new Error(`Unsupported AI provider: ${provider}`)
    }

    switch (provider) {
      case 'openai':
        return await translateWithOpenAI(
          text,
          targetLanguage,
          aiModel,
          credentials.openai.apiKey
        )
      case 'claude':
        return await translateWithClaude(
          text,
          targetLanguage,
          aiModel,
          credentials.claude.apiKey
        )
      case 'bedrock':
        const { accessKey, secretKey, region } = credentials.bedrock
        return await translateWithBedrock(
          text,
          targetLanguage,
          aiModel,
          accessKey,
          secretKey,
          region
        )
      default:
        throw new Error(`Unsupported AI provider: ${provider}`)
    }
  } catch (error) {
    console.error(
      'Translation API Error:',
      error.response ? error.response.data : error.message
    )
    return text // Fallback to the original text if translation fails
  }
}

async function findAndTranslateMissingKeys(
  defaultObj,
  targetObj,
  targetLang,
  basePath = ''
) {
  let filledKeys = {}

  for (let key in defaultObj) {
    const fullPath = basePath ? `${basePath}.${key}` : key

    if (
      typeof defaultObj[key] === 'object' &&
      !Array.isArray(defaultObj[key])
    ) {
      // 处理嵌套对象
      filledKeys[key] = await findAndTranslateMissingKeys(
        defaultObj[key],
        targetObj[key] || {},
        targetLang,
        fullPath
      )
    } else if (Array.isArray(defaultObj[key])) {
      // 处理数组类型
      if (!(key in targetObj) || !Array.isArray(targetObj[key])) {
        // 如果目标对象中不存在该键或者不是数组，则创建一个新数组
        console.log(`Translating array key "${fullPath}" to ${targetLang}...`)
        filledKeys[key] = []
        // 翻译数组中的每个元素
        for (let i = 0; i < defaultObj[key].length; i++) {
          const item = defaultObj[key][i]
          const itemPath = `${fullPath}[${i}]`

          if (typeof item === 'object' && !Array.isArray(item)) {
            // 如果数组元素是对象，递归处理
            filledKeys[key][i] = await findAndTranslateMissingKeys(
              item,
              (targetObj[key] && targetObj[key][i]) || {},
              targetLang,
              itemPath
            )
          } else if (typeof item === 'string') {
            // 如果数组元素是字符串，直接翻译
            console.log(
              `Translating array item "${itemPath}" to ${targetLang}...`
            )
            filledKeys[key][i] = await translateText(item, targetLang)
          } else {
            // 其他类型（数字、布尔值等）直接复制
            filledKeys[key][i] = item
          }
        }
      } else {
        // 如果目标对象中已存在该数组，则保留现有翻译，并处理缺失的元素
        filledKeys[key] = [...targetObj[key]]
        // 确保目标数组长度与源数组相同
        while (filledKeys[key].length < defaultObj[key].length) {
          const i = filledKeys[key].length
          const item = defaultObj[key][i]
          const itemPath = `${fullPath}[${i}]`

          if (typeof item === 'object' && !Array.isArray(item)) {
            // 如果数组元素是对象，递归处理
            filledKeys[key][i] = await findAndTranslateMissingKeys(
              item,
              {},
              targetLang,
              itemPath
            )
          } else if (typeof item === 'string') {
            // 如果数组元素是字符串，直接翻译
            console.log(
              `Translating missing array item "${itemPath}" to ${targetLang}...`
            )
            filledKeys[key][i] = await translateText(item, targetLang)
          } else {
            // 其他类型（数字、布尔值等）直接复制
            filledKeys[key][i] = item
          }
        }
      }
    } else if (!(key in targetObj)) {
      // 处理普通值（字符串、数字等）
      console.log(`Translating missing key "${fullPath}" to ${targetLang}...`)
      filledKeys[key] = await translateText(defaultObj[key], targetLang)
    } else {
      // 如果目标对象中已存在该键，则保留现有翻译
      filledKeys[key] = targetObj[key]
    }
  }

  return filledKeys
}

function beautifyJson(filePath) {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const beautifiedContent = JSON.stringify(content, null, 2)
  fs.writeFileSync(filePath, beautifiedContent, 'utf8')
  console.log(`${filePath} has been beautified.`)
}

async function processTranslations(
  localesDir,
  _,
  aiModel,
  aiProvider,
  targetLanguages
) {
  console.log(`Using provider: ${aiProvider}`)
  console.log(`Using model: ${aiModel}`)
  // Handle target languages
  if (!targetLanguages || targetLanguages.length === 0) {
    const files = fs
      .readdirSync(localesDir)
      .filter((file) => file.endsWith('.json') && file !== 'en.json')
    targetLanguages = files.map((file) => file.split('.')[0])
    console.log(
      'No target languages specified, using existing files:',
      targetLanguages
    )
  } else {
    console.log('Target languages:', targetLanguages)
  }

  // Create target language files if they don't exist
  for (const lang of targetLanguages) {
    const filePath = path.join(localesDir, `${lang}.json`)
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '{}', 'utf8')
      console.log(`Created new language file: ${filePath}`)
    }
  }

  // Process each target language
  for (const targetLang of targetLanguages) {
    const filePath = path.join(localesDir, `${targetLang}.json`)
    console.log(`Processing ${targetLang}...`)

    const targetLangContent = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const completeContent = await findAndTranslateMissingKeys(
      defaultLang,
      targetLangContent,
      targetLang
    )

    // Save the resulting JSON with no missing keys
    fs.writeFileSync(filePath, JSON.stringify(completeContent, null, 2), 'utf8')
    console.log(`Missing keys in ${targetLang} have been filled and saved.`)

    // Beautify the JSON
    beautifyJson(filePath)
  }

  console.log('All language files have been processed.')
}

module.exports = { processTranslations }

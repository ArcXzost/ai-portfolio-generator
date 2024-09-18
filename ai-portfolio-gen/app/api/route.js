import { IncomingForm } from 'formidable'
import { promises as fs } from 'fs'
import { Configuration, OpenAIApi } from "openai"
import pdf from 'pdf-parse'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = new IncomingForm()
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        resolve([fields, files])
      })
    })

    const apiKey = fields.apiKey
    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API key is required' })
    }

    const configuration = new Configuration({ apiKey })
    const openai = new OpenAIApi(configuration)

    const file = files.file
    const dataBuffer = await fs.readFile(file.filepath)
    const data = await pdf(dataBuffer)
    const pdfText = data.text

    // Generate resume content
    const resumeContent = await generateResumeContent(openai, pdfText)

    // Generate HTML structure
    const htmlStructure = await generateHTMLStructure(openai, resumeContent)

    // Generate CSS styles
    const cssStyles = await generateCSSStyles(openai)

    res.status(200).json({
      resumeContent,
      htmlStructure,
      cssStyles
    })

  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'An error occurred while processing your request' })
  }
}

async function generateResumeContent(openai, pdfText) {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `Extract and summarize the key information from this LinkedIn profile:\n\n${pdfText}\n\nProvide the information in a structured format suitable for a resume, including sections like Summary, Experience, Education, and Skills.`,
    max_tokens: 500,
    temperature: 0.5,
  })
  return response.data.choices[0].text.trim()
}

async function generateHTMLStructure(openai, resumeContent) {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `Create a modern, semantic HTML structure for this resume content:\n\n${resumeContent}\n\nUse appropriate HTML5 tags and add classes for styling.`,
    max_tokens: 1000,
    temperature: 0.5,
  })
  return response.data.choices[0].text.trim()
}

async function generateCSSStyles(openai) {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: "Create modern, responsive CSS styles for a dark AI-themed resume. Use CSS variables for easy customization. Include styles for layout, typography, and subtle AI-inspired design elements.",
    max_tokens: 1000,
    temperature: 0.5,
  })
  return response.data.choices[0].text.trim()
}
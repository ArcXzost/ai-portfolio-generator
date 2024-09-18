"use client"
import { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import PortfolioPreview from '@/app/components/PortfolioPreview';

export default function ResumeGenerator() {
  const [file, setFile] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [resumeData, setResumeData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState('preview')

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleApiKeyChange = (event) => {
    setApiKey(event.target.value)
  }

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(event.target.result)
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)

    if (!file) {
      alert('Please select a file')
      setIsLoading(false)
      return
    }

    try {
      let base64File = await convertToBase64(file)
      base64File = base64File.substring(base64File.indexOf(',') + 1)

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey, base64File }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResumeData(data)
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred while processing your request')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf"
          required
          disabled={isLoading}
        />
        <input
          type="text"
          placeholder="Enter your OpenAI API Key"
          value={apiKey}
          onChange={handleApiKeyChange}
          required
          disabled={isLoading}
        />
        <button type="submit" disabled={!file || !apiKey || isLoading}>
          {isLoading ? 'Generating...' : 'Generate Resume'}
        </button>
      </form>

      {resumeData && (
        <div className="resume-container">
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('preview')}
              className={viewMode === 'preview' ? 'active' : ''}
            >
              Preview
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={viewMode === 'code' ? 'active' : ''}
            >
              Code
            </button>
          </div>

          {viewMode === 'preview' ? (
            <PortfolioPreview htmlStructure={resumeData.htmlStructure} cssStyles={resumeData.cssStyles} />
          ) : (
            <div className="resume-code">
              <h3>HTML</h3>
              <SyntaxHighlighter language="html" style={vscDarkPlus}>
                {resumeData.htmlStructure}
              </SyntaxHighlighter>

              <h3>CSS</h3>
              <SyntaxHighlighter language="css" style={vscDarkPlus}>
                {resumeData.cssStyles}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

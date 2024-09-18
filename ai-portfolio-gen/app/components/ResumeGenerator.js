"use client"
import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function ResumeGenerator() {
  const [file, setFile] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [resumeData, setResumeData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState('preview')

  const handleFileChange = (event) => {
    setFile(event.target.files[0])
  }

  const handleApiKeyChange = (event) => {
    setApiKey(event.target.value)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('apiKey', apiKey)

    try {
      const response = await fetch('/api', {
        method: 'POST',
        body: formData,
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
        <input type="file" onChange={handleFileChange} accept=".pdf" required />
        <input 
          type="text" 
          placeholder="Enter your OpenAI API Key" 
          value={apiKey} 
          onChange={handleApiKeyChange}
          required
        />
        <button type="submit" disabled={!file || !apiKey || isLoading}>
          {isLoading ? 'Generating...' : 'Generate Resume'}
        </button>
      </form>

      {resumeData && (
        <div className="resume-container">
          <div className="view-toggle">
            <button onClick={() => setViewMode('preview')} className={viewMode === 'preview' ? 'active' : ''}>
              Preview
            </button>
            <button onClick={() => setViewMode('code')} className={viewMode === 'code' ? 'active' : ''}>
              Code
            </button>
          </div>

          {viewMode === 'preview' ? (
            <div className="resume-preview" dangerouslySetInnerHTML={{ __html: resumeData.htmlStructure }} />
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
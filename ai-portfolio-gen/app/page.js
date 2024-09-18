import Head from 'next/head'
import ResumeGenerator from '@/app/components/ResumeGenerator'

export default function Home() {
  return (
    <div>
      <Head>
        <title>AI Resume Generator</title>
        <meta name="description" content="Generate your resume using AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>AI Resume Generator</h1>
        <ResumeGenerator />
      </main>
    </div>
  )
}
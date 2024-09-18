import Head from 'next/head'
import ResumeGenerator from '@/app/components/ResumeGenerator'

export default function Home() {
  return (
    <div>
      <Head>
        <title>AI Portfolio Generator</title>
        <meta name="description" content="Generate your portfolio website using AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>AI Portfolio Generator</h1>
        <ResumeGenerator />
      </main>
    </div>
  )
}
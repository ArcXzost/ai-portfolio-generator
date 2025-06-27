'use client'
import Head from 'next/head'
import ResumeGenerator from './components/ResumeGenerator'

export default function Home() {
  return (
    <div>
      <Head>
        <title>ArcNest</title>
        <meta name="description" content="Generate your portfolio website using AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>ArcNest</h1>
        <ResumeGenerator />
      </main>
    </div>
  )
}
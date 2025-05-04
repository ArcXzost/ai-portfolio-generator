'use client'
import Head from 'next/head'
import ResumeGenerator from './components/ResumeGenerator'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    fetch('/')
      .then((response) => response.text())
      .then((data) => console.log('RSC Payload:', data))
      .catch((error) => console.error('RSC Payload Error:', error));
  }, []);

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
# ArcNest - AI-Powered Resume to Portfolio Generator

ArcNest is an innovative tool designed to transform your resume into a beautiful, customizable portfolio website—**automatically**. By leveraging advanced AI, ArcNest generates clean, production-ready HTML and CSS code from your resume, allowing you to preview, edit, and deploy your portfolio with ease.

---

## Project Goal

The primary goal of ArcNest is to **empower users to create professional portfolio websites from their resumes with minimal effort and no coding required**. Many professionals have up-to-date resumes but lack the time or expertise to build a modern portfolio site. ArcNest bridges this gap by automating the process, ensuring that anyone can showcase their skills and experience online.

---

## How ArcNest Achieves This

### 1. **AI-Powered Code Generation**

- **Resume Upload:** Users upload their resume in PDF format.
- **Text Extraction:** The app extracts text from the PDF using a backend API.
- **Example Analysis:** ArcNest searches for and analyzes real-world portfolio examples to inform the design and structure.
- **Iterative Section Generation:** The AI generates the portfolio in logical sections (layout, header, about, skills, projects, etc.), building up the site step by step.

### 2. **Iterative Generation & Context Overlap**

#### **Why Iterative Generation?**

- **Token Limitations:** Large Language Models (LLMs) like Gemini or GPT have context window limits. Generating an entire site in one go can exceed these limits, leading to incomplete or low-quality output.
- **Quality & Structure:** By generating the site section-by-section, we ensure each part is well-structured, coherent, and stylistically consistent.
- **Customization:** Iterative generation allows for dynamic customization and feedback at each step.

#### **How Context Overlapping Works**

- **Progressive Context:** Each new section is generated with knowledge of the previously generated sections. The current state of the portfolio (HTML and CSS) is passed as context to the AI for each new generation step.
- **Seamless Integration:** This overlapping context ensures that new sections fit naturally with the existing content, maintaining design and code consistency throughout the site.
- **Example:** When generating the "projects" section, the AI receives the current HTML/CSS (including header, about, etc.) so it can match styles, layout, and avoid code conflicts.

### 3. **Customization and Real-Time Preview**

- **Edit Code:** Users can edit the generated HTML and CSS directly in the app.
- **Live Preview:** Changes are reflected instantly, allowing for rapid iteration and personalization.

### 4. **Deployment**

- **GitHub Integration:** With a single click, users can deploy their portfolio to GitHub Pages, making it live on the web.
- **No Database Required:** All data is processed in-memory or via APIs, making deployment and scaling simple.

---

## Why This Approach?

- **Accessibility:** No coding skills required.
- **Quality:** AI leverages real-world examples and iterative refinement for professional results.
- **Efficiency:** Automates a process that would otherwise take hours or days.
- **Customization:** Users retain full control over the final code and design.

---

## Technologies Used

- **Next.js:** React framework for server-side rendering and API routes.
- **Google Generative AI:** For AI-powered code generation.
- **GitHub API:** For authentication and deployment.
- **React Syntax Highlighter:** For syntax highlighting in the code editor.

---

## How It Works

1. **Upload Your Resume:** Upload your resume in PDF format.
2. **AI Generates Code:** The AI processes your resume and generates HTML and CSS code for your portfolio, section by section.
3. **Customize:** Edit the generated code directly in the app.
4. **Deploy:** Sign in with GitHub and deploy your portfolio to GitHub Pages.

---

## Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/ArcXzost/ai-portfolio-generator.git
   cd ai-portfolio-generator
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables:**
   Create a `.env.local` file in the root directory and add the following:
   ```bash
   GOOGLE_API_KEY=your_google_api_key
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/callback
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. **Open the App:**
   Visit `http://localhost:3000` in your browser.

---

## Usage

1. **Upload Your Resume:**
   - Click the "Upload Resume" button and select your PDF file.
   - Wait for the AI to process your resume and generate the code.

2. **Preview and Edit:**
   - Toggle between "Preview" and "Code" views.
   - Edit the HTML and CSS directly in the code section.

3. **Deploy to GitHub:**
   - Click "Sign in with GitHub" to authenticate.
   - Click "Deploy to GitHub Pages" to publish your portfolio.

---

## Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


# ArcNest - AI-Powered Resume to Portfolio Generator

ArcNest is an innovative tool that transforms your resume into a stunning, customizable portfolio website. Powered by AI, it generates clean HTML and CSS code, allowing you to deploy your portfolio directly to GitHub Pages with just a few clicks.

## Features

- **AI-Powered Code Generation**: Converts your resume PDF into a fully functional portfolio website.
- **Customizable Code**: Edit the generated HTML and CSS directly in the app.
- **GitHub Integration**: Deploy your portfolio to GitHub Pages with ease.
- **Real-Time Preview**: See changes instantly as you edit your code.
- **Syntax Highlighting**: Clean and readable code display for easy editing.

## How It Works

1. **Upload Your Resume**: Upload your resume in PDF format.
2. **AI Generates Code**: The AI processes your resume and generates HTML and CSS code for your portfolio.
3. **Customize**: Edit the generated code directly in the app.
4. **Deploy**: Sign in with GitHub and deploy your portfolio to GitHub Pages.

## Prerequisites

Before running the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/resucraft.git
   cd resucraft
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env.local` file in the root directory and add the following:
   ```bash
   GOOGLE_API_KEY=your_google_api_key
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/callback
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. **Open the App**:
   Visit `http://localhost:3000` in your browser.

## Usage

1. **Upload Your Resume**:
   - Click the "Upload Resume" button and select your PDF file.
   - Wait for the AI to process your resume and generate the code.

2. **Preview and Edit**:
   - Toggle between "Preview" and "Code" views.
   - Edit the HTML and CSS directly in the code section.

3. **Deploy to GitHub**:
   - Click "Sign in with GitHub" to authenticate.
   - Click "Deploy to GitHub Pages" to publish your portfolio.

## Folder Structure

resucraft/
├── app/ # Next.js app directory
│ ├── api/ # API routes
│ ├── components/ # React components
│ ├── globals.css # Global styles
│ └── page.js # Main page
├── public/ # Static assets
├── .env.local # Environment variables
├── package.json # Project dependencies
└── README.md # This file

## Technologies Used

- **Next.js**: React framework for server-side rendering and API routes.
- **Google Generative AI**: For AI-powered code generation.
- **GitHub API**: For authentication and deployment.
- **React Syntax Highlighter**: For syntax highlighting in the code editor.

## Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


# Gemini Cost Estimator

A professional, developer-focused tool for estimating and analyzing Google Gemini API call costs. This tool allows you to select various Gemini models, provide multi-modal attachments, and receive a detailed breakdown of token usage, execution metadata, and estimated pricing.

## Features

- **Multi-Model Support**: Compare costs across Gemini 3 (Flash/Pro), Gemini 2.5, and specialized models like Imagen (Image Gen) and Veo (Video Gen).
- **Thinking Budget Analysis**: Specifically designed to handle the "Thinking" modality introduced in the latest Gemini models.
- **Multi-modal Breakdown**: Detailed cost estimation for Text, Audio, Video, and Image inputs.
- **History Management**: 
  - Save full execution history as a JSON file.
  - Load history with conflict resolution (Append or Replace).
  - Assign titles to specific analyses for better organization.
- **Developer Metadata**: View the raw JSON response from the API and the internal request configuration used.

## Setup Instructions

### Prerequisites
- Node.js installed.
- A valid Google Gemini API Key. You can get one at [Google AI Studio](https://aistudio.google.com/).

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration
The application requires an environment variable to authenticate with the Gemini API. 

1. Create a `.env.local` file in the root directory:
   ```bash
   touch .env.local
   ```
2. Add your API key:
   ```env
   API_KEY=your_gemini_api_key_here
   ```

### Running the Project
```bash
npm start
```
The application will be available at `http://localhost:3000`.

## About the Author

**Sela Mador-Haim**
- **Email**: selama@gmail.com
- **GitHub**: [github.com/selama1](https://github.com/selama1)
- **Music**: [losttrackmusic.com](https://www.losttrackmusic.com/)
- **Role**: Software Architect & AI Researcher
- **Description**: Specialized in building intuitive developer tools and high-performance AI integrations.

---
*Disclaimer: This tool provides estimates based on public pricing data. Always verify costs in the Google Cloud Console or AI Studio billing dashboard.*

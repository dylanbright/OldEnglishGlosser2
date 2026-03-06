# Hwæt! Old English Glosser

An interactive, AI-powered philological tool designed for students and scholars of Old English. This application provides instant morphological analysis, definitions, and etymological data for ancient texts.

## Overview

The **Hwæt! Glosser** allows users to paste Old English text (e.g., *Beowulf*, *The Wanderer*) and receive a word-by-word gloss. It uses the Anthropic Claude API (Haiku for speed, Sonnet as fallback) to perform deep philological analysis, with a "Deep Check" feature that cross-references scholarly sources like the Bosworth-Toller dictionary.

## Features

- **Gloss Entire Text**: Automatically segments text into tokens and provides grammar, lemma, translation, and etymology for every word.
- **Gloss Words On Demand**: Load text without an upfront API call, then analyze individual words as needed.
- **Deep Check**: Re-analyze any word with a dedicated AI call for more accurate philological data.
- **Philological Keyboard**: A custom toolbar for inserting Old English characters (æ, þ, ð, ƿ) and macrons (ā, ē, ī, etc.).
- **Study List**: Flag difficult words to create a custom study list with Anki CSV export.
- **Persistence**: Save your analysis as JSON and reload it later. Append additional analysis files to an existing session.
- **Responsive Design**: A parchment-themed UI that works across desktop and mobile.

## Requirements

### Anthropic API Key
This application requires an Anthropic API key.
- Obtain a key from [Anthropic Console](https://console.anthropic.com/).
- Create a `.env` file in the project root with: `ANTHROPIC_API_KEY=your-key-here`

### Environment
- **Runtime**: Node.js (for Vite dev server)
- **Dependencies**:
  - React 19
  - Vite 6
  - Tailwind CSS
  - Lucide React

## Installation & Setup

1. **Clone the project**:
   ```bash
   git clone https://github.com/dylanbright/OldEnglishGlosser2.git
   cd OldEnglishGlosser2
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure your API key**:
   ```bash
   echo "ANTHROPIC_API_KEY=your-key-here" > .env
   ```
4. **Start the dev server**:
   ```bash
   npm run dev
   ```
5. **Open** `http://localhost:3000` in your browser.

The Vite dev server proxies `/anthropic-api` requests to the Anthropic API, so no separate backend is needed.

## Usage Guide

1. **Input Text**: Paste your Old English text into the main textarea. Use the character toolbar for special characters.
2. **Choose a mode**:
   - **Gloss Entire Text**: Sends the full text to Claude for bulk analysis. Long texts are automatically chunked by word count to stay within API limits.
   - **Gloss Words On Demand**: Loads the text immediately and lets you analyze individual words by clicking them.
3. **Explore**: Click any word in the analyzed text to see its details in the side panel (lemma, part of speech, morphology, etymology).
4. **Deep Check**: Click "Analyze with AI" in the panel to re-analyze a word with a dedicated API call.
5. **Study**: Flag words with the bookmark icon, then export your flagged words as CSV for Anki.

## Technical Architecture

- **AI Models**: Claude Haiku (primary, for speed) with Claude Sonnet as fallback. Retry logic handles transient failures.
- **Chunking**: Text is split into chunks of ~20 words to prevent output token limit truncation. Whitespace and newlines are preserved.
- **API Proxy**: Vite dev server proxies requests to `api.anthropic.com` to avoid CORS issues in the browser.
- **Persistence**: Client-side JSON serialization for save/load without a backend database.
- **Aesthetics**: Custom Tailwind theme with a "Parchment" color palette and serif typography.

---
*"Swa scribende gesceap hweorfað gleomen gumena geond grund fela..."*

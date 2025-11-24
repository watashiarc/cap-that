# CapThat

<img width="1387" height="833" alt="cap-that-screenshot" src="https://github.com/user-attachments/assets/d9f98a26-19ce-49fc-9b71-4601f6e8ac17" />

**CapThat** is a lightweight, no-nonsense screen recorder that runs entirely in your browser. Capture your screen, microphone, and system audio—no installs, no setup.

## Features

- Simple UI: A clean interface that stays out of your way.
- WebM Recording: Fast, browser-native screen and audio capture.
- MP4 Conversion: Convert to MP4 in the browser using FFmpeg WASM.
- Session Gallery: Review and manage your recordings instantly.
- Audio Options: Choose whether to record microphone and/or system audio.

## Getting Started

This is a web-based application built with React and Vite.

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository or download the source code.
2. Install the dependencies:

```bash
npm install
```

### Running the App

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

## Usage

1. **Record**: Click the large record button. Select the screen, window, or tab you want to share.
2. **Control**: Pause or stop the recording using the floating controls.
3. **Review**: Once finished, preview your video instantly.
4. **Export**: Save to your library, then download as `.webm` (instant) or convert to `.mp4` (compatible).

## Privacy

CapThat processes all video and audio locally within your browser. No data is sent to external servers for processing.

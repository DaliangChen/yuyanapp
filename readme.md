# YuYan (语言)

**🔗 Live Demo:** [https://daliangchen.github.io/yuyanapp/](https://daliangchen.github.io/yuyanapp/)

**YuYan** is a lightweight, local-first web application designed for intensive language listening and vocabulary acquisition using YouTube videos and custom subtitles.

Built with a zero-backend architecture, all your video lists, subtitle alignments, and vocabulary progress are stored locally in your browser via IndexedDB (`localforage`), with full JSON import/export support.

## ✨ Key Features

* **Interactive Subtitle Player**: Synchronizes YouTube playback with local `.srt` or `.vtt` subtitles. Click any subtitle card to jump directly to that timestamp.
* **Smart "Skip Familiar" Mode**: Automatically skips video segments where you already know all the words, allowing you to focus purely on sentences containing unfamiliar vocabulary.
* **Inline Vocabulary Tracking**: Automatically tokenizes sentences into words. Click any highlighted word tag during playback to mark it as learned/familiar in real time.
* **Bilingual Subtitle Alignment**: Import a secondary `.srt` translation file with matching timestamps to display bilingual subtitles side-by-side.
* **Built-in Vocabulary Manager**: Filter words by status (`All`, `Review`, `Passed`), search your vocabulary bank, and listen to native pronunciation via the Web Speech API.
* **Local-First & Portable**: No account or server required. Easily back up or transfer your entire learning progress using the one-click JSON `Import` / `Export` feature.

## 🚀 Getting Started

Open the web app directly in your browser: **[https://daliangchen.github.io/yuyanapp/](https://daliangchen.github.io/yuyanapp/)**

### Prerequisites & Browser Compatibility

* **Recommended Browsers**: Desktop **Chrome**, **Edge**, or other Chromium-based browsers. *(Note: This app relies on the File System Access API for local file handling and `Intl.Segmenter` for word tokenization; Firefox, Safari, and mobile browsers are currently not fully supported).*
* **Language Configuration**: Currently configured for **German (`de-DE`)** tokenization and Text-to-Speech (TTS) pronunciation.

### Usage Workflow

1. **Add Videos**:
   * Click **Add** and enter a YouTube **Video ID** (e.g., for `https://www.youtube.com/watch?v=dQw4w9WgXcQ`, the ID is `dQw4w9WgXcQ`) along with a custom note.
   * Alternatively, use **Paste Video List** to batch-import videos from your clipboard using the format: `video_id | note` (one per line).

2. **Load Subtitles**:
   * Click **Load** under the `Srt` column to attach a local `.srt` or `.vtt` transcript file.
   * *(Optional)* Click **Edit** next to a loaded subtitle, then click **Add Translation** to import a translated `.srt` file. Ensure the translation file has the exact same entry count, indices, and timestamps as the original transcript.

3. **Start Learning**:
   * Click a Video ID to launch the player.
   * Toggle **⏭ Skip familiar** to bypass sentences without new words.
   * Use `Space` to play/pause, or click any green word badge to mark it as known.

## 🛠️ Tech Stack

* **UI & State**: [Preact](https://preactjs.com/) + [Preact Signals](https://github.com/preactjs/signals)
* **Styling**: [Pico CSS](https://picocss.com/)
* **Storage**: [localForage](https://github.com/localForage/localForage) (IndexedDB)
* **Media**: YouTube IFrame Player API & Web Speech API

## ⚠️ Known Limitations

* **Manual Subtitle Sourcing**: You must provide your own `.srt`/`.vtt` files (e.g., extracted via tools like `yt-dlp`).
* **Hardcoded Language**: Word segmentation and TTS pronunciation are currently hardcoded to `de-DE`.
* **Strict Translation Matching**: Bilingual subtitle imports require strict 1-to-1 timestamp matching with the primary subtitle file.

## 📄 License

MIT License. Feel free to fork, modify, and adapt it to your target language!
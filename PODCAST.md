# Self-Hosted Podcast Audio & RSS Feed Infrastructure

This document outlines the self-hosted podcast architecture for **Catholic Book Chat**, utilizing **Cloudflare R2** for cost-effective audio storage, a **Cloudflare Worker** for high-performance audio delivery (supporting Range requests), and automated build-time **RSS feed generation** served statically by Cloudflare Pages.

---

## Architecture Diagram

```
                              ┌────────────────────────────────┐
                              │    GitHub / Git Repository     │
                              └────────────────────────────────┘
                                              │
                                              ▼ (Git Push)
┌────────────────────────┐    ┌────────────────────────────────┐
│      episodes.js       │──▶ │    Cloudflare Pages Build      │
│      podcast.js        │    │  (Prebuild: generate-feed.js)  │
└────────────────────────┘    └────────────────────────────────┘
                                              │
                                              ▼
┌────────────────────────┐    ┌────────────────────────────────┐
│   Cloudflare Worker    │    │        Cloudflare Pages        │
│    (audio/* request)   │    │      (Serves /feed.xml & site) │
└────────────────────────┘    └────────────────────────────────┘
           │                                   ▲
           ▼ (Fetch Object)                    │
┌────────────────────────┐                     │
│      Cloudflare R2     │◀────────────────────┘ (RSS Feed Link)
│  (catholic-book-chat-  │
│         audio)         │◀──────────────────── Apple Podcasts / Spotify
└────────────────────────┘                      (Poll feed.xml for updates)
```

---

## Part 1: Initial Infrastructure Setup (One-time)

### 1. Create the R2 Bucket
You can create the bucket either via the Cloudflare Dashboard or using `wrangler`:
```bash
npx wrangler r2 bucket create catholic-book-chat-audio
```

### 2. Bind R2 Bucket to Pages Functions
The audio-serving route is built directly into the site using **Cloudflare Pages Functions** (under `functions/audio/[file].js`).
1. Go to the **Cloudflare Dashboard** ➜ *Workers & Pages* ➜ select your Pages project (`catholic-book-chat`).
2. Click the **Settings** tab at the top.
3. In the left-hand menu of the Settings tab, click **Functions**.
4. Scroll down to the **R2 bucket bindings** section.
5. Click **Add binding**.
6. Set **Variable name** to `PODCAST_BUCKET`.
7. Set **R2 bucket** to `catholic-book-chat-audio`.
8. Click **Save**. (If your project is already deployed, redeploy it for the binding to take effect).

### 3. Submit the RSS Feed
Once your site is built and deployed, your podcast RSS feed will be publicly available at `https://yourdomain.com/feed.xml`.
Submit this URL to the main directories:
- **Apple Podcasts**: [Apple Podcasts Connect](https://podcastsconnect.apple.com/)
- **Spotify**: [Spotify for Podcasters](https://podcasters.spotify.com/)
- **Amazon Music / Audible**: [Amazon Music Podcaster Dashboard](https://podcasters.amazon.com/)

---

## Part 2: Publishing a New Episode (Per-Episode Workflow)

### Step 1: Prepare the Audio File
- Format: **MP3**
- Bitrate: **96 kbps - 128 kbps** (Mono is recommended for talk podcasts to save space and bandwidth, 128 kbps Stereo is also fine).
- File name convention: **Kebab-case**, e.g., `the-great-divorce-chapter-2.mp3`

### Step 2: Get File Size and Duration
To generate a valid RSS enclosure tag, you need the file size in bytes and the duration in `HH:MM:SS` format.
- **File size (bytes)**:
  - On macOS: Right-click file ➜ *Get Info* ➜ Note the size in bytes (e.g., `21,760,000 bytes`).
  - Terminal: `stat -f %z filename.mp3`
- **Duration**: Note the play length of the audio file (e.g., `00:22:40`).

### Step 3: Add Metadata to the Code
Add the episode object to the top of the array in [data/episodes.js](file:///Volumes/Patriot%202TB/catholic-book-chat/data/episodes.js):

```javascript
  {
    slug: 'the-great-divorce-chapter-2',
    title: 'The Great Divorce — Chapter 2',
    subtitle: 'Discussion on chapter 2 reflections',
    description: 'A detailed summary of the episode content for Apple Podcasts and Spotify listeners...',
    publishDate: '2026-07-15T12:00:00Z', // ISO Format
    duration: '00:22:40',               // HH:MM:SS
    fileSize: 21760000,                  // Bytes
    audioFile: 'the-great-divorce-chapter-2.mp3', // Exact filename in R2
    showNotes: [
      'Show note bullet 1.',
      'Show note bullet 2.',
    ],
  },
```

### Step 4: Upload Audio File to R2
Upload the MP3 file to your Cloudflare R2 bucket:
- **Via Wrangler CLI**:
  ```bash
  npx wrangler r2 object put catholic-book-chat-audio/the-great-divorce-chapter-2.mp3 --file=./path/to/the-great-divorce-chapter-2.mp3
  ```
- **Via Cloudflare Dashboard**:
  Go to R2 ➜ Select `catholic-book-chat-audio` bucket ➜ Click *Upload* ➜ Select your `.mp3` file

### Step 5: Deploy the Web Application
Commit your changes to Git and push to your repository:
```bash
git add data/episodes.js
git commit -m "feat: publish episode 4 (The Great Divorce Ch. 2)"
git push origin main
```
Cloudflare Pages will automatically trigger a new build. During the build process, `npm run prebuild` will run [scripts/generate-feed.js](file:///Volumes/Patriot%202TB/catholic-book-chat/scripts/generate-feed.js), regenerating a fresh `feed.xml` containing the new episode.

Apple Podcasts, Spotify, and other platforms will poll this RSS feed automatically (usually within a few hours) and distribute the new episode to listeners.

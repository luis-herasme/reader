import { randomBytes, createHash } from "node:crypto";
import { WebSocket } from "ws";

// Protocol markers and synthesis settings.
const TURN_END_MARKER = "Path:turn.end";
const AUDIO_PATH_MARKER = "Path:audio\r\n";
const OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";

// Static values required to look like Edge's read-aloud client.
const CHROMIUM_FULL_VERSION = "143.0.3650.75";
const BING_SPEECH_HOST = "speech.platform.bing.com";
const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split(".")[0];
const EDGE_EXTENSION_ORIGIN =
  "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold";
const EDGE_TTS_URL =
  "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";

// Static websocket headers that match the real Edge read-aloud extension.
const EDGE_WEBSOCKET_HEADERS = {
  Pragma: "no-cache",
  "Cache-Control": "no-cache",
  "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Accept-Language": "en-US,en;q=0.9",
};

// Timing values used for the websocket lifecycle and Sec-MS-GEC clock math.
const WEBSOCKET_TIMEOUT = 15_000;
const SEC_MS_GEC_ROUNDING_TICKS = 3_000_000_000n;
const WINDOWS_FILE_TIME_TICKS_PER_SECOND = 10_000_000n;
const WINDOWS_FILE_TIME_EPOCH_SECONDS = 11_644_473_600n;

// XML entity replacements for SSML text content.
const XML_ESCAPE_MAP: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
  "'": "&apos;",
};

type ClientMessageOptions = {
  body: string;
  path: string;
  requestId?: string;
  contentType: string;
};

type RejectSynthesis = (error: Error) => void;

type ResolveSynthesis = (audioBuffer: Buffer) => void;

type SsmlOptions = {
  text: string;
  voice: string;
};

type SynthesizeOptions = {
  input: string;
  voice: string;
};

// Mutable state shared across websocket callbacks for one synthesis request.
type SynthesisSession = {
  input: string;
  voice: string;
  reject: RejectSynthesis;
  resolve: ResolveSynthesis;
  timeout: ReturnType<typeof setTimeout> | null;
  isSettled: boolean;
  websocket: WebSocket;
  audioChunks: Buffer[];
};

const SPEECH_CONFIG_PAYLOAD = JSON.stringify({
  context: {
    synthesis: {
      audio: {
        metadataoptions: {
          sentenceBoundaryEnabled: "false",
          wordBoundaryEnabled: "true",
        },
        outputFormat: OUTPUT_FORMAT,
      },
    },
  },
});

// This message is the same for every request, so build it once.
const SPEECH_CONFIG_MESSAGE = buildClientMessage({
  body: SPEECH_CONFIG_PAYLOAD,
  path: "speech.config",
  contentType: "application/json; charset=utf-8",
});

function createRequestId(): string {
  return randomBytes(16).toString("hex");
}

// Microsoft expects Sec-MS-GEC to be the SHA-256 hash of the current
// Windows FILETIME tick count, rounded down to a 5-minute boundary,
// followed by the trusted client token.
function generateSecMsGecValue(): string {
  const currentUnixTimeSeconds = BigInt(Math.floor(Date.now() / 1_000));
  const currentWindowsFileTimeSeconds =
    currentUnixTimeSeconds + WINDOWS_FILE_TIME_EPOCH_SECONDS;
  const currentWindowsFileTimeTicks =
    currentWindowsFileTimeSeconds * WINDOWS_FILE_TIME_TICKS_PER_SECOND;
  const roundedWindowsFileTimeTicks =
    currentWindowsFileTimeTicks -
    (currentWindowsFileTimeTicks % SEC_MS_GEC_ROUNDING_TICKS);
  const hash = createHash("sha256");
  hash.update(`${roundedWindowsFileTimeTicks}${TRUSTED_CLIENT_TOKEN}`, "ascii");
  return hash.digest("hex").toUpperCase();
}

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (character) => XML_ESCAPE_MAP[character]);
}

function buildWebSocketUrl(): string {
  const queryParameters = new URLSearchParams({
    TrustedClientToken: TRUSTED_CLIENT_TOKEN,
    "Sec-MS-GEC": generateSecMsGecValue(),
    "Sec-MS-GEC-Version": SEC_MS_GEC_VERSION,
  });

  return `${EDGE_TTS_URL}?${queryParameters.toString()}`;
}

// The websocket text protocol uses HTTP-like headers, a blank line,
// and then the message body.
function buildClientMessage({
  body,
  path,
  requestId,
  contentType,
}: ClientMessageOptions): string {
  const headers: string[] = [];

  if (requestId) {
    headers.push(`X-RequestId:${requestId}`);
  }

  headers.push(`Content-Type:${contentType}`);
  headers.push(`Path:${path}`);
  headers.push("");
  headers.push(body);

  return headers.join("\r\n");
}

function buildSsml({ text, voice }: SsmlOptions): string {
  return [
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">`,
    `  <voice name="${voice}">`,
    `    <prosody rate="default" pitch="default" volume="default">`,
    `      ${escapeXml(text)}`,
    `    </prosody>`,
    `  </voice>`,
    `</speak>`,
  ].join("");
}

function buildSsmlMessage(options: SsmlOptions): string {
  return buildClientMessage({
    body: buildSsml(options),
    path: "ssml",
    requestId: createRequestId(),
    contentType: "application/ssml+xml",
  });
}

function createWebSocket(): WebSocket {
  return new WebSocket(buildWebSocketUrl(), {
    host: BING_SPEECH_HOST,
    origin: EDGE_EXTENSION_ORIGIN,
    headers: EDGE_WEBSOCKET_HEADERS,
  });
}

// Binary audio frames still include protocol headers before the MP3 bytes.
function extractAudioChunk(messageData: Buffer): Buffer | null {
  const audioMarkerIndex = messageData.indexOf(AUDIO_PATH_MARKER);

  if (audioMarkerIndex === -1) {
    return null;
  }

  return messageData.subarray(audioMarkerIndex + AUDIO_PATH_MARKER.length);
}

function createSynthesisSession(
  { input, voice }: SynthesizeOptions,
  resolve: ResolveSynthesis,
  reject: RejectSynthesis,
): SynthesisSession {
  return {
    input,
    voice,
    reject,
    resolve,
    timeout: null,
    isSettled: false,
    websocket: createWebSocket(),
    audioChunks: [],
  };
}

function clearSynthesisTimeout(session: SynthesisSession): void {
  if (!session.timeout) {
    return;
  }

  clearTimeout(session.timeout);
  session.timeout = null;
}

function closeWebSocket(websocket: WebSocket): void {
  if (
    websocket.readyState === WebSocket.CONNECTING ||
    websocket.readyState === WebSocket.OPEN
  ) {
    websocket.close();
  }
}

function finishSynthesis(session: SynthesisSession): void {
  if (session.isSettled) {
    return;
  }

  session.isSettled = true;
  clearSynthesisTimeout(session);
  closeWebSocket(session.websocket);
  session.resolve(Buffer.concat(session.audioChunks));
}

function failSynthesis(session: SynthesisSession, error: Error): void {
  if (session.isSettled) {
    return;
  }

  session.isSettled = true;
  clearSynthesisTimeout(session);
  closeWebSocket(session.websocket);
  session.reject(error);
}

function handleSynthesisTimeout(session: SynthesisSession): void {
  failSynthesis(session, new Error("Edge TTS timed out"));
}

function startSynthesisTimeout(session: SynthesisSession): void {
  session.timeout = setTimeout(
    handleSynthesisTimeout,
    WEBSOCKET_TIMEOUT,
    session,
  );
}

function sendSynthesisRequest(session: SynthesisSession): void {
  session.websocket.send(SPEECH_CONFIG_MESSAGE);
  session.websocket.send(
    buildSsmlMessage({ text: session.input, voice: session.voice }),
  );
}

// The service streams binary audio chunks and finishes with a text
// frame containing `Path:turn.end`.
function handleWebSocketMessage(
  session: SynthesisSession,
  messageData: Buffer,
  isBinary: boolean,
): void {
  if (isBinary) {
    const audioChunk = extractAudioChunk(messageData);

    if (audioChunk) {
      session.audioChunks.push(audioChunk);
    }

    return;
  }

  const message = messageData.toString();

  if (message.includes(TURN_END_MARKER)) {
    finishSynthesis(session);
  }
}

function handleWebSocketClose(session: SynthesisSession, code: number): void {
  if (session.isSettled) {
    return;
  }

  failSynthesis(
    session,
    new Error(`Edge TTS connection closed before completion (code ${code})`),
  );
}

function handleWebSocketError(session: SynthesisSession, error: Error): void {
  failSynthesis(session, error);
}

function attachWebSocketListeners(session: SynthesisSession): void {
  session.websocket.on("open", sendSynthesisRequest.bind(undefined, session));
  session.websocket.on(
    "message",
    handleWebSocketMessage.bind(undefined, session),
  );
  session.websocket.on("close", handleWebSocketClose.bind(undefined, session));
  session.websocket.on("error", handleWebSocketError.bind(undefined, session));
}

export function synthesize({
  input,
  voice,
}: SynthesizeOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const session = createSynthesisSession({ input, voice }, resolve, reject);

    startSynthesisTimeout(session);
    attachWebSocketListeners(session);
  });
}

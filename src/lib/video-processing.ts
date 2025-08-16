export interface VideoProcessingOptions {
  quality?: number; // 0-100
  width?: number;
  height?: number;
  fps?: number;
  bitrate?: number; // in bits per second
  format?: "webm" | "mp4";
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}

export function shouldConvertToWebM(file: File): boolean {
  // Convert all video files to WebM for better compression
  return isVideoFile(file) && file.type !== "video/webm";
}

export async function convertVideoToWebM(
  buffer: Buffer,
  options: VideoProcessingOptions = {}
): Promise<Buffer> {
  // Only process on server side
  if (typeof window !== "undefined") {
    throw new Error("Video processing is only available on the server side");
  }

  // For now, we'll implement a simpler approach that accepts the original file
  // but logs that conversion should happen. In a production environment,
  // you would want to use a proper video processing service or library.

  console.log("Video conversion requested with options:", options);
  console.log("Original video size:", buffer.length, "bytes");

  // For now, return the original buffer
  // TODO: Implement proper video conversion using a video processing service
  // This could be done by:
  // 1. Using a cloud video processing service (like AWS MediaConvert, Google Cloud Video Intelligence)
  // 2. Using a dedicated video processing microservice
  // 3. Using a simpler video processing library that works well with Next.js

  return buffer;
}

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      resolve(video.duration);
    };

    video.onerror = () => {
      reject(new Error("Could not load video metadata"));
    };

    video.src = URL.createObjectURL(file);
  });
}

export function validateVideoFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    "video/mp4",
    "video/webm",
    "video/avi",
    "video/mov",
    "video/quicktime",
    "video/x-msvideo",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error:
        "Invalid video format. Please upload MP4, WebM, AVI, or MOV files.",
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "Video file is too large. Maximum size is 50MB.",
    };
  }

  return { isValid: true };
}

// Client-side video compression using Canvas API (for thumbnails)
export async function createVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    video.onloadedmetadata = () => {
      // Set canvas size
      canvas.width = 320;
      canvas.height = 240;

      // Seek to 1 second to get a good frame
      video.currentTime = 1;
    };

    video.onseeked = () => {
      // Draw the video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
      resolve(thumbnail);
    };

    video.onerror = () => {
      reject(new Error("Could not load video for thumbnail"));
    };

    video.src = URL.createObjectURL(file);
  });
}

// Simple video compression using MediaRecorder API (client-side only)
export async function compressVideoClientSide(
  file: File,
  options: VideoProcessingOptions = {}
): Promise<File> {
  if (typeof window === "undefined") {
    throw new Error(
      "Client-side video compression is only available in the browser"
    );
  }

  const { width, height } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    video.onloadedmetadata = () => {
      // Set canvas size
      canvas.width = width || video.videoWidth;
      canvas.height = height || video.videoHeight;

      // Start recording
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: "video/webm" });
        const compressedFile = new File(
          [compressedBlob],
          file.name.replace(/\.[^/.]+$/, ".webm"),
          {
            type: "video/webm",
            lastModified: Date.now(),
          }
        );
        resolve(compressedFile);
      };

      mediaRecorder.onerror = (error) => {
        reject(error);
      };

      // Start recording
      mediaRecorder.start();

      // Play video and draw frames
      video.play();
      const drawFrame = () => {
        if (!video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        } else {
          mediaRecorder.stop();
        }
      };
      drawFrame();
    };

    video.onerror = () => {
      reject(new Error("Could not load video for compression"));
    };

    video.src = URL.createObjectURL(file);
  });
}

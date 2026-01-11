
/**
 * Converts a File object to a Base64 string.
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Extracts distributed frames from a video file for temporal analysis.
 * Uses a hidden HTML5 Video element and Canvas API.
 */
export const extractFramesFromVideo = (file: File, frameCount: number = 4): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    const frames: string[] = [];
    
    video.onloadedmetadata = () => {
      const duration = video.duration;
      let currentStep = 0;

      const captureFrame = () => {
         // Distribute frames between 10% and 90% to avoid black start/end frames
         const percent = 0.1 + (currentStep * (0.8 / Math.max(1, frameCount - 1)));
         // Safety check for very short videos
         video.currentTime = Math.min(duration * 0.99, Math.max(0.0, duration * percent));
      };

      video.onseeked = () => {
         const canvas = document.createElement('canvas');
         // Scale down slightly to ensure we don't send massive payloads, 
         // but keep enough detail for forensics. Max width 1920.
         const scale = Math.min(1, 1920 / video.videoWidth);
         canvas.width = video.videoWidth * scale;
         canvas.height = video.videoHeight * scale;
         
         const ctx = canvas.getContext('2d');
         if (ctx) {
             ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
             frames.push(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
         }

         currentStep++;
         if (currentStep < frameCount) {
             captureFrame();
         } else {
             URL.revokeObjectURL(video.src);
             resolve(frames);
         }
      };

      video.onerror = () => {
         URL.revokeObjectURL(video.src);
         reject(new Error("Video frame extraction failed"));
      };

      // Start the loop
      captureFrame();
    };
    
    video.onerror = () => reject(new Error("Could not load video metadata"));
  });
};

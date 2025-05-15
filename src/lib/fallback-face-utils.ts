// This is a fallback implementation that doesn't rely on face-api.js models
// It's useful for development when the models aren't available

// Simulate a face detection result
export function simulateFaceDetection() {
    // Create a mock descriptor (128-dimensional vector)
    const mockDescriptor = Array(128)
      .fill(0)
      .map(() => Math.random() * 0.5)
  
    return {
      detection: {
        box: {
          x: 100,
          y: 100,
          width: 200,
          height: 200,
        },
      },
      landmarks: {
        positions: Array(68)
          .fill(0)
          .map((_, i) => ({
            x: 100 + (i % 10) * 20,
            y: 100 + Math.floor(i / 10) * 20,
          })),
        shift: () => ({ x: 0, y: 0 }),
      },
      descriptor: new Float32Array(mockDescriptor),
      align: () => ({}),
    }
  }
  
  // Draw a simulated face detection on canvas
  export function drawSimulatedFace(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")
    if (!ctx) return
  
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  
    // Draw face box
    ctx.strokeStyle = "green"
    ctx.lineWidth = 2
    ctx.strokeRect(100, 100, 200, 200)
  
    // Draw landmarks
    ctx.fillStyle = "blue"
    for (let i = 0; i < 68; i++) {
      ctx.beginPath()
      ctx.arc(100 + (i % 10) * 20, 100 + Math.floor(i / 10) * 20, 2, 0, 2 * Math.PI)
      ctx.fill()
    }
  }
  
// Fallback implementation for when face-api.js is not available
// This provides basic face detection using a simple algorithm

interface FaceDetection {
  detection: {
    box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  landmarks: {
    positions: Array<{ x: number; y: number }>;
  };
  descriptor: Float32Array;
}

// Simple skin color detection based on RGB values
function isSkinColor(r: number, g: number, b: number): boolean {
  const threshold = 0.6;
  const rRatio = r / (r + g + b);
  const gRatio = g / (r + g + b);
  const bRatio = b / (r + g + b);
  
  return rRatio > threshold && gRatio < threshold && bRatio < threshold;
}

// Generate a mock face descriptor (128-dimensional vector)
function generateMockDescriptor(): Float32Array {
  return new Float32Array(
    Array(128)
      .fill(0)
      .map(() => Math.random() * 0.5)
  );
}

// Basic face detection using skin color and simple heuristics
export async function detectFaceFallback(videoElement: HTMLVideoElement): Promise<FaceDetection | null> {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  // Draw current video frame
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  
  // Simple face detection using skin color
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = 0;
  let maxY = 0;
  let skinPixels = 0;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (isSkinColor(r, g, b)) {
        skinPixels++;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  // If we found enough skin pixels, consider it a face
  const faceArea = (maxX - minX) * (maxY - minY);
  const skinRatio = skinPixels / faceArea;
  
  if (skinRatio > 0.3 && faceArea > 1000) {
    // Generate mock landmarks (68 points)
    const landmarks = Array(68).fill(0).map((_, i) => ({
      x: minX + (maxX - minX) * (0.3 + 0.4 * Math.random()),
      y: minY + (maxY - minY) * (0.3 + 0.4 * Math.random())
    }));
    
    return {
      detection: {
        box: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        }
      },
      landmarks: {
        positions: landmarks
      },
      descriptor: generateMockDescriptor()
    };
  }
  
  return null;
}

// Draw the fallback face detection on canvas
export function drawFallbackDetection(
  canvas: HTMLCanvasElement,
  videoElement: HTMLVideoElement,
  detection: FaceDetection | null
): void {
  if (!detection) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw video frame
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  
  // Draw face box
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  ctx.strokeRect(
    detection.detection.box.x,
    detection.detection.box.y,
    detection.detection.box.width,
    detection.detection.box.height
  );
  
  // Draw landmarks
  ctx.fillStyle = '#00ffff';
  detection.landmarks.positions.forEach(point => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
    ctx.fill();
  });
}

// Calculate similarity between two face descriptors
export function calculateFaceSimilarity(desc1: Float32Array, desc2: Float32Array): number {
  // Simple cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < desc1.length; i++) {
    dotProduct += desc1[i] * desc2[i];
    norm1 += desc1[i] * desc1[i];
    norm2 += desc2[i] * desc2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}
  
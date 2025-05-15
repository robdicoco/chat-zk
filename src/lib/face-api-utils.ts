import * as faceapi from 'face-api.js';

// Initialize face-api models
let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;
  
  try {
    // Load the required models
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models')
    ]);
    modelsLoaded = true;
    console.log('Face-api models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api models:', error);
    throw new Error('Failed to load face recognition models');
  }
}

// Function to detect face and get descriptor
export async function detectFace(videoElement: HTMLVideoElement) {
  if (!modelsLoaded) {
    await loadModels();
  }

  try {
    // Detect all faces with landmarks and descriptors
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections || detections.length === 0) {
      return null;
    }

    // For enrollment, we only want one face
    if (detections.length > 1) {
      throw new Error('Multiple faces detected. Please ensure only one face is visible.');
    }

    const detection = detections[0];
    return {
      detection: detection.detection,
      landmarks: detection.landmarks,
      descriptor: detection.descriptor,
      alignedRect: detection.alignedRect
    };
  } catch (error) {
    console.error('Face detection error:', error);
    throw error;
  }
}

// Function to draw detection on canvas
export function drawDetection(
  canvas: HTMLCanvasElement,
  videoElement: HTMLVideoElement,
  detection: any
) {
  if (!detection) return;

  const displaySize = { width: canvas.width, height: canvas.height };
  
  // Clear canvas
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw video frame
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Get the actual video dimensions
  const imageDimensions = {
    width: videoElement.videoWidth || canvas.width,
    height: videoElement.videoHeight || canvas.height
  };

  // Create a proper detection object that face-api.js drawing functions expect
  const faceDetection = new faceapi.FaceDetection(
    detection.detection.score,
    detection.detection.box,
    imageDimensions
  );

  // Create a proper landmarks object
  const faceLandmarks = new faceapi.FaceLandmarks68(
    detection.landmarks.positions,
    imageDimensions
  );

  // Create a combined detection with landmarks
  const withLandmarks: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }> = {
    detection: faceDetection,
    landmarks: faceLandmarks,
    unshiftedLandmarks: faceLandmarks,
    alignedRect: faceDetection
  };

  // Resize the detection to match canvas size
  const resizedDetection = faceapi.resizeResults(withLandmarks, displaySize);

  // Draw face detection box
  faceapi.draw.drawDetections(canvas, [resizedDetection.detection]);

  // Draw face landmarks
  faceapi.draw.drawFaceLandmarks(canvas, [resizedDetection]);
}

// Function to capture a single frame from video
export function captureFrame(videoElement: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// Function to get face descriptor from an image
export async function getFaceDescriptorFromImage(image: HTMLImageElement | HTMLCanvasElement) {
  if (!modelsLoaded) {
    await loadModels();
  }

  try {
    const detections = await faceapi
      .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections || detections.length === 0) {
      return null;
    }

    if (detections.length > 1) {
      throw new Error('Multiple faces detected in image');
    }

    return detections[0].descriptor;
  } catch (error) {
    console.error('Error getting face descriptor from image:', error);
    throw error;
  }
}

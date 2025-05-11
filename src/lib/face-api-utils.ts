// This file now only uses our mock implementation without any face-api.js dependency
import { mockDetectFace, drawMockFaceDetection } from "./mock-face-recognition"

// Function to detect face and get descriptor
export async function detectFace(videoElement: HTMLVideoElement) {
  console.log("Using mock face detection")
  const mockResult = await mockDetectFace(videoElement)

  // Return a structure that mimics what face-api.js would return
  // but is actually just our mock data
  return {
    detection: {
      box: mockResult.boundingBox,
    },
    landmarks: {
      positions: [],
      shift: () => ({ x: 0, y: 0 }),
    },
    descriptor: mockResult.descriptor,
    alignedRect: {
      box: mockResult.boundingBox,
    },
    draw: (canvas: HTMLCanvasElement) => {
      drawMockFaceDetection(canvas, videoElement, mockResult.boundingBox)
    },
  }
}

// Function to draw detection on canvas
export function drawDetection(canvas: HTMLCanvasElement, videoElement: HTMLVideoElement, detection: any) {
  drawMockFaceDetection(canvas, videoElement, detection.detection.box)
}

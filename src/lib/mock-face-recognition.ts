// This is a complete mock implementation for facial recognition

// Generate a random face descriptor (128-dimensional vector)
export function generateRandomFaceDescriptor(): Float32Array {
    return new Float32Array(
      Array(128)
        .fill(0)
        .map(() => Math.random() * 0.5),
    )
  }
  
  // Simulate face detection with a delay
  export async function mockDetectFace(videoElement: HTMLVideoElement): Promise<{
    descriptor: Float32Array
    boundingBox: { x: number; y: number; width: number; height: number }
  }> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
  
    // Get video dimensions
    const videoWidth = videoElement.videoWidth || 640
    const videoHeight = videoElement.videoHeight || 480
  
    // Return a mock face detection result
    return {
      descriptor: generateRandomFaceDescriptor(),
      boundingBox: {
        x: videoWidth * 0.25,
        y: videoHeight * 0.2,
        width: videoWidth * 0.5,
        height: videoHeight * 0.6,
      },
    }
  }
  
  // Draw a mock face detection on canvas
  export function drawMockFaceDetection(
    canvas: HTMLCanvasElement,
    videoElement: HTMLVideoElement,
    boundingBox: { x: number; y: number; width: number; height: number },
  ): void {
    const ctx = canvas.getContext("2d")
    if (!ctx) return
  
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  
    // Draw video frame on canvas
    try {
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
    } catch (error) {
      console.error("Error drawing video to canvas:", error)
    }
  
    // Draw face bounding box
    ctx.strokeStyle = "#00ff00"
    ctx.lineWidth = 2
    ctx.strokeRect(
      boundingBox.x * (canvas.width / (videoElement.videoWidth || 640)),
      boundingBox.y * (canvas.height / (videoElement.videoHeight || 480)),
      boundingBox.width * (canvas.width / (videoElement.videoWidth || 640)),
      boundingBox.height * (canvas.height / (videoElement.videoHeight || 480)),
    )
  
    // Draw some mock facial landmarks
    ctx.fillStyle = "#00ffff"
    const centerX = (boundingBox.x + boundingBox.width / 2) * (canvas.width / (videoElement.videoWidth || 640))
    const centerY = (boundingBox.y + boundingBox.height / 2) * (canvas.height / (videoElement.videoHeight || 480))
    const scale = (boundingBox.width * (canvas.width / (videoElement.videoWidth || 640))) / 100
  
    // Eyes
    const eyeDistance = 25 * scale
    ctx.beginPath()
    ctx.arc(centerX - eyeDistance, centerY - 10 * scale, 3 * scale, 0, 2 * Math.PI)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(centerX + eyeDistance, centerY - 10 * scale, 3 * scale, 0, 2 * Math.PI)
    ctx.fill()
  
    // Nose
    ctx.beginPath()
    ctx.arc(centerX, centerY + 10 * scale, 3 * scale, 0, 2 * Math.PI)
    ctx.fill()
  
    // Mouth
    ctx.beginPath()
    ctx.arc(centerX - 15 * scale, centerY + 30 * scale, 3 * scale, 0, 2 * Math.PI)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(centerX, centerY + 35 * scale, 3 * scale, 0, 2 * Math.PI)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(centerX + 15 * scale, centerY + 30 * scale, 3 * scale, 0, 2 * Math.PI)
    ctx.fill()
  }
  
  // Simulate face similarity comparison
  export function calculateFaceSimilarity(face1: Float32Array | number[], face2: Float32Array | number[]): number {
    // In a real implementation, this would calculate cosine similarity
    // For the mock implementation, we'll return a random high similarity value
    return 0.85 + Math.random() * 0.15 // Random value between 0.85 and 1.0
  }
  
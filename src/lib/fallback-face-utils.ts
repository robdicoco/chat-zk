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
  
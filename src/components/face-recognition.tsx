"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Loader2, Camera, Check, AlertTriangle, Shield } from "lucide-react"
import { detectFace, drawDetection } from "@/lib/face-api-utils"
import { generatePoseidonHash } from "@/lib/zk-utils"

interface FaceRecognitionProps {
  onSuccess: () => void;
  onCancel: () => void;
  purpose?: string;  // Optional purpose for the verification
}

export default function FaceRecognition({ onSuccess, onCancel, purpose = "authentication" }: FaceRecognitionProps) {
  const { user, verifyFace } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [verificationSuccess, setVerificationSuccess] = useState(false)
  const [error, setError] = useState("")
  const [faceDetection, setFaceDetection] = useState<any>(null)
  const [similarityScore, setSimilarityScore] = useState<number | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize component
  useEffect(() => {
    // Short timeout to simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => {
      clearTimeout(timer)
      // Clean up camera stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        const tracks = stream.getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  // Draw face detection on canvas when available
  useEffect(() => {
    if (faceDetection && canvasRef.current && videoRef.current) {
      drawDetection(canvasRef.current, videoRef.current, faceDetection)
    }
  }, [faceDetection])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
        setError("")
      }
    } catch (err) {
      setError("Failed to access camera. Please ensure camera permissions are granted.")
    }
  }

  const captureAndVerifyFace = async () => {
    if (!videoRef.current || !canvasRef.current || !user) return

    setIsCapturing(true)
    setError("")

    try {
      // Detect face using face-api.js
      const detection = await detectFace(videoRef.current)
      setFaceDetection(detection)

      if (!detection) {
        setError("No face detected. Please ensure your face is clearly visible.")
        setIsCapturing(false)
        return
      }

      // Process facial features for verification
      setIsProcessing(true)

      // Get face descriptor and convert to array
      const faceDescriptor = Array.from(detection.descriptor)

      try {
        // Store descriptor for ZK proof generation
        localStorage.setItem('faceDescriptor', JSON.stringify(faceDescriptor))

        // Generate commitment for ZK proof
        const commitment = await generatePoseidonHash(faceDescriptor)
        localStorage.setItem('faceCommitment', commitment)

        // Verify face against stored data
        const isValid = await verifyFace(faceDescriptor)

        if (isValid) {
          setVerificationSuccess(true)
          // Store verification timestamp
          localStorage.setItem('lastVerification', new Date().toISOString())
        } else {
          setError("Face verification failed. Please try again.")
        }

        setIsProcessing(false)
        setIsCapturing(false)

        // Stop camera
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream
          const tracks = stream.getTracks()
          tracks.forEach((track) => track.stop())
        }
      } catch (err) {
        console.error("Face verification error:", err)
        setError("Failed to verify face. Please try again.")
        setIsProcessing(false)
        setIsCapturing(false)
      }
    } catch (err) {
      console.error("Face capture error:", err)
      setError("Failed to capture face. Please try again.")
      setIsCapturing(false)
    }
  }

  const handleSuccess = () => {
    // Clear sensitive data from localStorage after successful verification
    localStorage.removeItem('faceDescriptor')
    localStorage.removeItem('faceCommitment')
    onSuccess()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-900 p-4">
      <Card className="w-full max-w-md bg-blue-800 border-purple-500">
        <CardHeader>
          <CardTitle className="text-white">Face Verification</CardTitle>
          <CardDescription className="text-gray-300">
            Verify your identity for {purpose}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400 mb-2" />
              <span className="text-gray-300">Initializing facial recognition...</span>
            </div>
          ) : verificationSuccess ? (
            <Alert className="bg-green-900/20 border-green-500">
              <Shield className="h-4 w-4 text-green-400" />
              <AlertTitle className="text-green-400">Verification Successful</AlertTitle>
              <AlertDescription className="text-gray-300">
                Your identity has been verified. You can now proceed with {purpose}.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  width={640}
                  height={480}
                  className={`w-full h-full object-cover ${!isCameraActive ? "hidden" : ""}`}
                />
                <canvas 
                  ref={canvasRef} 
                  width={640} 
                  height={480} 
                  className="absolute top-0 left-0 w-full h-full" 
                />
                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <Camera className="h-12 w-12 mb-2" />
                    <p>Camera access required</p>
                  </div>
                )}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                    <Loader2 className="h-12 w-12 animate-spin mb-2" />
                    <p>Verifying identity...</p>
                    <p className="text-xs mt-2 max-w-xs text-center text-gray-300">
                      Processing facial data securely
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-500">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertTitle className="text-red-400">Error</AlertTitle>
                  <AlertDescription className="text-gray-300">{error}</AlertDescription>
                </Alert>
              )}

              {similarityScore !== null && !verificationSuccess && (
                <Alert className="bg-yellow-900/20 border-yellow-500">
                  <AlertTitle className="text-yellow-400">Verification Score</AlertTitle>
                  <AlertDescription className="text-gray-300">
                    Similarity: {(similarityScore * 100).toFixed(1)}%
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-gray-400">
                <p className="font-medium mb-1">Security Notice:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your facial data is processed securely</li>
                  <li>Zero-knowledge proofs protect your privacy</li>
                  <li>Verification data is cleared after use</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {!verificationSuccess && !isCameraActive && !isLoading && (
            <Button 
              onClick={startCamera} 
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Start Camera
            </Button>
          )}
          {isCameraActive && !isCapturing && !isProcessing && !verificationSuccess && (
            <Button 
              onClick={captureAndVerifyFace} 
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Verify Face
            </Button>
          )}
          {verificationSuccess && (
            <Button 
              onClick={handleSuccess}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Continue
            </Button>
          )}
          {!verificationSuccess && (
            <Button 
              onClick={onCancel}
              variant="outline"
              className="w-full border-purple-500 text-purple-400 hover:bg-purple-900/20"
            >
              Cancel
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 
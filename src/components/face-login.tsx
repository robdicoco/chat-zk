"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Loader2, Camera, Check, AlertTriangle } from "lucide-react"
import { detectFace, drawDetection } from "@/lib/face-api-utils"
import { getFaceData } from "@/lib/face-storage"
import { cosineSimilarity } from "@/lib/face-api-utils"

interface FaceLoginProps {
  onSuccess: () => void;
  onBack: () => void;
}

export default function FaceLogin({ onSuccess, onBack }: FaceLoginProps) {
  const { verifyFace } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [verificationSuccess, setVerificationSuccess] = useState(false)
  const [error, setError] = useState("")
  const [faceDetection, setFaceDetection] = useState<any>(null)
  const [storedFaceData, setStoredFaceData] = useState<{ descriptor: number[], commitment: string } | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize component
  useEffect(() => {
    // Check for stored face data
    const faceData = getFaceData()
    if (!faceData) {
      setError("No face data found. Please enroll your face first.")
      setIsLoading(false)
      return
    }
    setStoredFaceData(faceData)

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

  const verifyFaceCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !storedFaceData) return

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

      // Get face descriptor
      const attemptDescriptor = Array.from(detection.descriptor)

      try {
        // Calculate similarity with stored descriptor
        const similarity = cosineSimilarity(storedFaceData.descriptor, attemptDescriptor)
        const isMatch = similarity >= 0.6 // Using same threshold as face-api.js

        if (isMatch) {
          // Verify the commitment on the backend
          await verifyFace(storedFaceData.commitment)
          setVerificationSuccess(true)
          onSuccess()
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-900 p-4">
      <Card className="w-full max-w-md bg-blue-800 border-purple-500">
        <CardHeader>
          <CardTitle className="text-white">ZK Face Verification</CardTitle>
          <CardDescription className="text-gray-300">
            Verify your identity using zero-knowledge face verification
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
              <Check className="h-4 w-4 text-green-400" />
              <AlertTitle className="text-green-400">Verification Successful</AlertTitle>
              <AlertDescription className="text-gray-300">
                Your identity has been verified using zero-knowledge proofs.
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
                    <p>Verifying face...</p>
                    <p className="text-xs mt-2 max-w-xs text-center text-gray-300">
                      Your facial data is being verified locally and securely
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

              <div className="text-sm text-gray-400">
                <p className="font-medium mb-1">Privacy Notice:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your facial data is processed locally on your device</li>
                  <li>Only a cryptographic commitment is sent to the server</li>
                  <li>Zero-Knowledge Proofs ensure your privacy during verification</li>
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
              onClick={verifyFaceCapture} 
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Verify Face
            </Button>
          )}
          {!verificationSuccess && (
            <Button 
              onClick={onBack}
              variant="outline"
              className="w-full border-purple-500 text-purple-400 hover:bg-purple-900/20"
            >
              Back
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 
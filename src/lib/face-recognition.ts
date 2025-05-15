import * as faceapi from 'face-api.js';
import { detectFace, getFaceDescriptorFromImage } from './face-api-utils';
import { detectFaceFallback, calculateFaceSimilarity } from './fallback-face-utils';

// Constants
const FACE_MATCH_THRESHOLD = 0.6; // Threshold for face matching (0-1)
const MAX_FACE_DISTANCE = 0.6; // Maximum distance between faces to be considered a match

// Types
export interface FaceDescriptor {
  descriptor: Float32Array;
  label?: string;
}

export interface FaceMatch {
  label: string;
  distance: number;
}

// Class to handle face recognition
export class FaceRecognition {
  private faceMatcher: faceapi.FaceMatcher | null = null;
  private knownFaces: FaceDescriptor[] = [];
  private useFallback: boolean = false;

  constructor(useFallback: boolean = false) {
    this.useFallback = useFallback;
  }

  // Add a new face to the known faces database
  async addFace(descriptor: Float32Array, label?: string): Promise<void> {
    this.knownFaces.push({ descriptor, label });
    this.updateFaceMatcher();
  }

  // Update the face matcher with current known faces
  private updateFaceMatcher(): void {
    if (this.useFallback) return;

    const labeledDescriptors = this.knownFaces.map(face => 
      new faceapi.LabeledFaceDescriptors(
        face.label || 'unknown',
        [face.descriptor]
      )
    );

    if (labeledDescriptors.length > 0) {
      this.faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, MAX_FACE_DISTANCE);
    }
  }

  // Find the best matching face from known faces
  async findBestMatch(descriptor: Float32Array): Promise<FaceMatch | null> {
    if (this.useFallback) {
      return this.findBestMatchFallback(descriptor);
    }

    if (!this.faceMatcher || this.knownFaces.length === 0) {
      return null;
    }

    const match = this.faceMatcher.findBestMatch(descriptor);
    if (match.distance > MAX_FACE_DISTANCE) {
      return null;
    }

    return {
      label: match.label,
      distance: match.distance
    };
  }

  // Fallback implementation for face matching
  private async findBestMatchFallback(descriptor: Float32Array): Promise<FaceMatch | null> {
    if (this.knownFaces.length === 0) {
      return null;
    }

    let bestMatch: FaceMatch | null = null;
    let bestSimilarity = -1;

    for (const face of this.knownFaces) {
      const similarity = calculateFaceSimilarity(descriptor, face.descriptor);
      if (similarity > bestSimilarity && similarity > FACE_MATCH_THRESHOLD) {
        bestSimilarity = similarity;
        bestMatch = {
          label: face.label || 'unknown',
          distance: 1 - similarity // Convert similarity to distance
        };
      }
    }

    return bestMatch;
  }

  // Verify if a face matches a specific known face
  async verifyFace(
    currentDescriptor: Float32Array,
    targetLabel: string
  ): Promise<boolean> {
    const match = await this.findBestMatch(currentDescriptor);
    return match !== null && match.label === targetLabel && match.distance <= MAX_FACE_DISTANCE;
  }

  // Detect and process a face from a video element
  async processVideoFace(videoElement: HTMLVideoElement): Promise<FaceDescriptor | null> {
    try {
      const detection = this.useFallback
        ? await detectFaceFallback(videoElement)
        : await detectFace(videoElement);

      if (!detection) {
        return null;
      }

      return {
        descriptor: detection.descriptor
      };
    } catch (error) {
      console.error('Error processing video face:', error);
      return null;
    }
  }

  // Detect and process a face from an image
  async processImageFace(image: HTMLImageElement | HTMLCanvasElement): Promise<FaceDescriptor | null> {
    try {
      const descriptor = await getFaceDescriptorFromImage(image);
      if (!descriptor) {
        return null;
      }

      return { descriptor };
    } catch (error) {
      console.error('Error processing image face:', error);
      return null;
    }
  }

  // Get all known faces
  getKnownFaces(): FaceDescriptor[] {
    return [...this.knownFaces];
  }

  // Clear all known faces
  clearKnownFaces(): void {
    this.knownFaces = [];
    this.faceMatcher = null;
  }
} 
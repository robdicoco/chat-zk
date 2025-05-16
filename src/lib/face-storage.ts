interface FaceData {
  descriptor: number[];
  commitment: string;
  timestamp: number;
}

const FACE_DATA_KEY = 'zk_face_data';

export const storeFaceData = (descriptor: number[], commitment: string): void => {
  const faceData: FaceData = {
    descriptor,
    commitment,
    timestamp: Date.now()
  };
  localStorage.setItem(FACE_DATA_KEY, JSON.stringify(faceData));
};

export const getFaceData = (): FaceData | null => {
  const data = localStorage.getItem(FACE_DATA_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as FaceData;
  } catch {
    return null;
  }
};

export const clearFaceData = (): void => {
  localStorage.removeItem(FACE_DATA_KEY);
}; 
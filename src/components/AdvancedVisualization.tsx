'use client';

import { useEffect, useRef } from 'react';
import { DetectionResult } from '@/hooks/useTensorFlowDetection';

interface AdvancedVisualizationProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  detectionResult: DetectionResult;
}

// PoseNet keypoint connections
const POSE_CONNECTIONS = [
  ['leftEye', 'rightEye'],
  ['leftEye', 'nose'],
  ['rightEye', 'nose'],
  ['leftEar', 'leftEye'],
  ['rightEar', 'rightEye'],
  ['leftEar', 'leftShoulder'],
  ['rightEar', 'rightShoulder'],
  ['leftShoulder', 'rightShoulder'],
  ['leftShoulder', 'leftElbow'],
  ['rightShoulder', 'rightElbow'],
  ['leftElbow', 'leftWrist'],
  ['rightElbow', 'rightWrist'],
  ['leftShoulder', 'leftHip'],
  ['rightShoulder', 'rightHip'],
  ['leftHip', 'rightHip'],
  ['leftHip', 'leftKnee'],
  ['rightHip', 'rightKnee'],
  ['leftKnee', 'leftAnkle'],
  ['rightKnee', 'rightAnkle'],
];

// Hand landmark connections
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
  [0, 9], [9, 10], [10, 11], [11, 12], // Middle finger
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring finger
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
];

export const AdvancedVisualization: React.FC<AdvancedVisualizationProps> = ({
  canvasRef,
  videoRef,
  detectionResult,
}) => {
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const drawVisualization = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw pose detection
      if (detectionResult.pose) {
        drawPose(ctx, detectionResult.pose, canvas.width, canvas.height);
      }

      // Draw face detection
      if (detectionResult.faces.length > 0) {
        detectionResult.faces.forEach(face => {
          drawFace(ctx, face, canvas.width, canvas.height);
        });
      }

      // Draw hand detection
      if (detectionResult.hands.length > 0) {
        detectionResult.hands.forEach(hand => {
          drawHand(ctx, hand, canvas.width, canvas.height);
        });
      }

      animationFrameRef.current = requestAnimationFrame(drawVisualization);
    };

    drawVisualization();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [detectionResult, canvasRef, videoRef]);

  const drawPose = (
    ctx: CanvasRenderingContext2D,
    pose: DetectionResult['pose'],
    canvasWidth: number,
    canvasHeight: number
  ) => {
    if (!pose) return;

    // Draw keypoints
    pose.keypoints.forEach(keypoint => {
      if (keypoint.score > 0.3) {
        const x = keypoint.position.x;
        const y = keypoint.position.y;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = getKeypointColor(keypoint.part);
        ctx.fill();
        
        // Draw keypoint label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(keypoint.part, x + 6, y - 6);
      }
    });

    // Draw connections
    POSE_CONNECTIONS.forEach(([part1, part2]) => {
      const kp1 = pose.keypoints.find(kp => kp.part === part1);
      const kp2 = pose.keypoints.find(kp => kp.part === part2);
      
      if (kp1 && kp2 && kp1.score > 0.3 && kp2.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(kp1.position.x, kp1.position.y);
        ctx.lineTo(kp2.position.x, kp2.position.y);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  const drawFace = (
    ctx: CanvasRenderingContext2D,
    face: DetectionResult['faces'][0],
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Draw face bounding box
    const x = face.box.xMin * canvasWidth;
    const y = face.box.yMin * canvasHeight;
    const width = (face.box.xMax - face.box.xMin) * canvasWidth;
    const height = (face.box.yMax - face.box.yMin) * canvasHeight;
    
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    
    // Draw face landmarks
    if (face.landmarks) {
      face.landmarks.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x * canvasWidth, y * canvasHeight, 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff6b6b';
        ctx.fill();
      });
    }
    
    // Draw confidence score
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '12px Arial';
    ctx.fillText(`${Math.round(face.score * 100)}%`, x, y - 5);
  };

  const drawHand = (
    ctx: CanvasRenderingContext2D,
    hand: DetectionResult['hands'][0],
    canvasWidth: number,
    canvasHeight: number
  ) => {
    const color = hand.handedness === 'Left' ? '#4ecdc4' : '#45b7d1';
    
    // Draw hand landmarks
    hand.landmarks.forEach((landmark, index) => {
      const x = landmark.x * canvasWidth;
      const y = landmark.y * canvasHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Draw landmark index
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial';
      ctx.fillText(index.toString(), x + 4, y - 4);
    });
    
    // Draw hand connections
    HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const start = hand.landmarks[startIdx];
      const end = hand.landmarks[endIdx];
      
      ctx.beginPath();
      ctx.moveTo(start.x * canvasWidth, start.y * canvasHeight);
      ctx.lineTo(end.x * canvasWidth, end.y * canvasHeight);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    // Draw hand label
    const wrist = hand.landmarks[0];
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(
      `${hand.handedness} Hand: ${Math.round(hand.score * 100)}%`,
      wrist.x * canvasWidth,
      wrist.y * canvasHeight - 20
    );
  };

  const getKeypointColor = (part: string): string => {
    const colors: { [key: string]: string } = {
      // Face
      nose: '#ff6b6b',
      leftEye: '#4ecdc4',
      rightEye: '#4ecdc4',
      leftEar: '#45b7d1',
      rightEar: '#45b7d1',
      
      // Upper body
      leftShoulder: '#96ceb4',
      rightShoulder: '#96ceb4',
      leftElbow: '#feca57',
      rightElbow: '#feca57',
      leftWrist: '#ff9ff3',
      rightWrist: '#ff9ff3',
      
      // Lower body
      leftHip: '#54a0ff',
      rightHip: '#54a0ff',
      leftKnee: '#5f27cd',
      rightKnee: '#5f27cd',
      leftAnkle: '#00d2d3',
      rightAnkle: '#00d2d3',
    };
    
    return colors[part] || '#ffffff';
  };

  return null; // This component only handles drawing, no UI elements
};

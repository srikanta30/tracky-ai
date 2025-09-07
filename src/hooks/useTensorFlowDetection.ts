'use client';

import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as posenet from '@tensorflow-models/posenet';
import * as handpose from '@tensorflow-models/handpose';
import * as blazeface from '@tensorflow-models/blazeface';

// Pose detection interfaces
export interface PoseKeypoint {
  position: { x: number; y: number };
  score: number;
  part: string;
}

export interface PoseDetection {
  keypoints: PoseKeypoint[];
  score: number;
}

// Face detection interfaces
export interface FaceDetectionResult {
  box: {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  };
  landmarks?: number[][];
  score: number;
}

// Hand detection interfaces
export interface HandKeypoint {
  x: number;
  y: number;
  z?: number;
}

export interface HandDetection {
  landmarks: HandKeypoint[];
  score: number;
  handedness: 'Left' | 'Right';
}

// Combined detection result
export interface DetectionResult {
  pose?: PoseDetection;
  faces: FaceDetectionResult[];
  hands: HandDetection[];
  timestamp: number;
}

// Behavior metrics
export interface BehaviorMetrics {
  // Posture metrics
  posture: {
    confidence: number;
    stability: number;
    alignment: number;
    slouching: number;
  };
  
  // Attention metrics
  attention: {
    level: number;
    focus: number;
    engagement: number;
    distraction: number;
  };
  
  // Hand activity
  handActivity: {
    leftHandActive: boolean;
    rightHandActive: boolean;
    gestureIntensity: number;
    handMovement: number;
  };
  
  // Face analysis
  faceAnalysis: {
    confidence: number;
    eyeContact: number;
    headMovement: number;
    facialExpression: string;
  };
  
  // Overall metrics
  overall: {
    confidence: number;
    engagement: number;
    activity: number;
    stability: number;
  };
}

export const useTensorFlowDetection = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<{
  poseNet?: posenet.PoseNet;
  faceDetector?: blazeface.BlazeFaceModel;
  handDetector?: handpose.HandPose;
  }>({});
  
  const [metrics, setMetrics] = useState<BehaviorMetrics>({
    posture: { confidence: 0, stability: 0, alignment: 0, slouching: 0 },
    attention: { level: 0, focus: 0, engagement: 0, distraction: 0 },
    handActivity: { leftHandActive: false, rightHandActive: false, gestureIntensity: 0, handMovement: 0 },
    faceAnalysis: { confidence: 0, eyeContact: 0, headMovement: 0, facialExpression: 'neutral' },
    overall: { confidence: 0, engagement: 0, activity: 0, stability: 0 },
  });

  const previousResults = useRef<DetectionResult | null>(null);
  const metricsHistory = useRef<BehaviorMetrics[]>([]);
  const maxHistoryLength = 10;

  useEffect(() => {
    const initializeModels = async () => {
      try {
        await tf.ready();
        
        // Load all models in parallel
        const [poseNet, faceDetector, handDetector] = await Promise.all([
          posenet.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            inputResolution: { width: 640, height: 480 },
            multiplier: 0.75,
          }),
          blazeface.load(),
          handpose.load(),
        ]);

        setModels({ poseNet, faceDetector, handDetector });
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing TensorFlow models:', err);
        setError('Failed to initialize AI models');
        setIsLoading(false);
      }
    };

    initializeModels();
  }, []);

  const detectAll = async (videoElement: HTMLVideoElement): Promise<DetectionResult> => {
    if (!models.poseNet || !models.faceDetector || !models.handDetector) {
      return { faces: [], hands: [], timestamp: Date.now() };
    }

    try {
      // Run all detections in parallel
      const [poses, faces, hands] = await Promise.all([
        models.poseNet!.estimatePoses(videoElement, { 
          flipHorizontal: false,
          decodingMethod: 'single-person'
        }),
        models.faceDetector!.estimateFaces(videoElement),
        models.handDetector!.estimateHands(videoElement),
      ]);
      
      const pose = poses && poses.length > 0 ? poses[0] : null;

      const result: DetectionResult = {
        pose: pose ? {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          keypoints: pose.keypoints.map((kp: any) => ({
            position: { x: kp.position.x, y: kp.position.y },
            score: kp.score,
            part: kp.part,
          })),
          score: pose.score || 0,
        } : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        faces: (faces as any[]).map((face: any) => ({
          box: {
            xMin: face.topLeft[0],
            yMin: face.topLeft[1],
            xMax: face.bottomRight[0],
            yMax: face.bottomRight[1],
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          landmarks: face.landmarks?.map((lm: any) => [lm[0], lm[1]]),
          score: face.probability || 0,
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hands: (hands as any[]).map((hand: any) => ({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          landmarks: hand.landmarks.map((lm: any) => ({ x: lm.x, y: lm.y, z: lm.z })),
          score: hand.score || 0,
          handedness: hand.handedness as 'Left' | 'Right',
        })),
        timestamp: Date.now(),
      };

      // Calculate behavior metrics
      const newMetrics = calculateBehaviorMetrics(result, previousResults.current);
      const smoothedMetrics = smoothMetrics(newMetrics);
      setMetrics(smoothedMetrics);
      
      previousResults.current = result;
      return result;
    } catch (err) {
      console.error('Error during detection:', err);
      return { faces: [], hands: [], timestamp: Date.now() };
    }
  };

  const calculateBehaviorMetrics = (
    current: DetectionResult,
    previous: DetectionResult | null
  ): BehaviorMetrics => {
    // Calculate posture metrics from pose detection
    const posture = calculatePostureMetrics(current.pose);
    
    // Calculate attention metrics from pose detection instead of face detection
    const attention = calculateAttentionMetrics(current.faces, previous?.faces, current.pose, previous?.pose);
    
    // Calculate hand activity metrics
    const handActivity = calculateHandActivityMetrics(current.hands, previous?.hands);
    
    // Calculate face analysis metrics using pose data
    const faceAnalysis = calculateFaceAnalysisMetrics(current.faces, previous?.faces, current.pose, previous?.pose);
    
    // Calculate overall metrics
    const overall = calculateOverallMetrics(posture, attention, handActivity, faceAnalysis);

    return {
      posture,
      attention,
      handActivity,
      faceAnalysis,
      overall,
    };
  };

  const calculatePostureMetrics = (pose?: PoseDetection) => {
    if (!pose || pose.keypoints.length === 0) {
      return { confidence: 0, stability: 0, alignment: 0, slouching: 0 };
    }

    const keypoints = pose.keypoints;
    const confidence = pose.score * 100;

    // Calculate spine alignment (nose to hip)
    const nose = keypoints.find(kp => kp.part === 'nose');
    const leftHip = keypoints.find(kp => kp.part === 'leftHip');
    const rightHip = keypoints.find(kp => kp.part === 'rightHip');
    
    let alignment = 0;
    let slouching = 0;
    
    if (nose && leftHip && rightHip) {
      const hipCenter = {
        x: (leftHip.position.x + rightHip.position.x) / 2,
        y: (leftHip.position.y + rightHip.position.y) / 2,
      };
      
      // Calculate spine angle
      const spineAngle = Math.atan2(nose.position.y - hipCenter.y, Math.abs(nose.position.x - hipCenter.x));
      const idealAngle = Math.PI / 2; // 90 degrees (vertical)
      const angleDeviation = Math.abs(spineAngle - idealAngle);
      
      alignment = Math.max(0, 100 - (angleDeviation * 180 / Math.PI) * 2);
      slouching = Math.min(100, (angleDeviation * 180 / Math.PI) * 2);
    }

    // Calculate stability (movement of key points)
    let stability = 50; // Default moderate stability
    if (previousResults.current?.pose) {
      const prevKeypoints = previousResults.current.pose.keypoints;
      let totalMovement = 0;
      let validPoints = 0;
      
      keypoints.forEach(currentKp => {
        const prevKp = prevKeypoints.find(pkp => pkp.part === currentKp.part);
        if (prevKp) {
          const movement = Math.sqrt(
            Math.pow(currentKp.position.x - prevKp.position.x, 2) +
            Math.pow(currentKp.position.y - prevKp.position.y, 2)
          );
          totalMovement += movement;
          validPoints++;
        }
      });
      
      if (validPoints > 0) {
        const avgMovement = totalMovement / validPoints;
        stability = Math.max(0, 100 - avgMovement);
      }
    }

    return {
      confidence: Math.round(confidence),
      stability: Math.round(stability),
      alignment: Math.round(alignment),
      slouching: Math.round(slouching),
    };
  };

  const calculateAttentionMetrics = (
    currentFaces: FaceDetectionResult[],
    previousFaces?: FaceDetectionResult[],
    currentPose?: PoseDetection,
    previousPose?: PoseDetection
  ) => {
    // Calculate attention based on both face detection and pose detection
    const hasFace = currentFaces.length > 0;
    const hasPose = currentPose && currentPose.keypoints.length > 0;
    
    if (!hasFace && !hasPose) {
      return { level: 0, focus: 0, engagement: 0, distraction: 0 };
    }

    let level = 0;
    let focus = 0;
    let engagement = 0;
    let distraction = 0;

    // Face-based attention calculation
    if (hasFace) {
      const face = currentFaces[0];
      const faceSize = (face.box.xMax - face.box.xMin) * (face.box.yMax - face.box.yMin);
      const faceCenterX = (face.box.xMin + face.box.xMax) / 2;
      const faceCenterY = (face.box.yMin + face.box.yMax) / 2;
      
      // Calculate attention level based on face size and position
      const sizeScore = Math.min(100, faceSize * 1000);
      const positionScore = Math.max(0, 100 - Math.sqrt(
        Math.pow(faceCenterX - 0.5, 2) + Math.pow(faceCenterY - 0.5, 2)
      ) * 200);
      
      level = Math.round((sizeScore + positionScore) / 2);
      focus = Math.round(level * 0.9);
      engagement = Math.round(level * 0.8);
      
      // Calculate distraction based on face movement
      if (previousFaces && previousFaces.length > 0) {
        const prevFace = previousFaces[0];
        const movement = Math.sqrt(
          Math.pow(faceCenterX - (prevFace.box.xMin + prevFace.box.xMax) / 2, 2) +
          Math.pow(faceCenterY - (prevFace.box.yMin + prevFace.box.yMax) / 2, 2)
        );
        distraction = Math.min(100, movement * 100);
      }
    }

    // Pose-based attention calculation (as fallback or enhancement)
    if (hasPose) {
      const keypoints = currentPose.keypoints;
      
      // Calculate attention level based on pose confidence and keypoint visibility
      const visibleKeypoints = keypoints.filter(kp => kp.score > 0.3).length;
      const totalKeypoints = keypoints.length;
      const visibilityScore = (visibleKeypoints / totalKeypoints) * 100;
      
      // Calculate focus based on head position (nose and eyes)
      const nose = keypoints.find(kp => kp.part === 'nose');
      const leftEye = keypoints.find(kp => kp.part === 'leftEye');
      const rightEye = keypoints.find(kp => kp.part === 'rightEye');
      
      let poseFocus = 0;
      if (nose && leftEye && rightEye) {
        // Calculate if head is facing forward (eyes and nose are aligned)
        const eyeCenterX = (leftEye.position.x + rightEye.position.x) / 2;
        const eyeCenterY = (leftEye.position.y + rightEye.position.y) / 2;
        const noseToEyeDistance = Math.sqrt(
          Math.pow(nose.position.x - eyeCenterX, 2) + Math.pow(nose.position.y - eyeCenterY, 2)
        );
        poseFocus = Math.max(0, 100 - noseToEyeDistance * 2);
      }
      
      // Calculate engagement based on pose stability
      let poseEngagement = visibilityScore * 0.7;
      if (previousPose) {
        const stability = calculatePoseStability(currentPose, previousPose);
        poseEngagement += stability * 0.3;
      }
      
      // Calculate distraction based on pose movement
      let poseDistraction = 0;
      if (previousPose) {
        const movement = calculatePoseMovement(currentPose, previousPose);
        poseDistraction = Math.min(100, movement * 10);
      }

      // Combine face and pose metrics (weighted average)
      if (hasFace) {
        level = Math.round((level + visibilityScore) / 2);
        focus = Math.round((focus + poseFocus) / 2);
        engagement = Math.round((engagement + poseEngagement) / 2);
        distraction = Math.round((distraction + poseDistraction) / 2);
      } else {
        level = Math.round(visibilityScore);
        focus = Math.round(poseFocus);
        engagement = Math.round(poseEngagement);
        distraction = Math.round(poseDistraction);
      }
    }

    return {
      level,
      focus,
      engagement,
      distraction,
    };
  };

  const calculatePoseStability = (current: PoseDetection, previous: PoseDetection): number => {
    const currentKeypoints = current.keypoints;
    const previousKeypoints = previous.keypoints;
    
    let totalMovement = 0;
    let validPoints = 0;
    
    currentKeypoints.forEach(currentKp => {
      const prevKp = previousKeypoints.find(pkp => pkp.part === currentKp.part);
      if (prevKp && currentKp.score > 0.3 && prevKp.score > 0.3) {
        const movement = Math.sqrt(
          Math.pow(currentKp.position.x - prevKp.position.x, 2) +
          Math.pow(currentKp.position.y - prevKp.position.y, 2)
        );
        totalMovement += movement;
        validPoints++;
      }
    });
    
    if (validPoints === 0) return 50; // Default moderate stability
    
    const avgMovement = totalMovement / validPoints;
    return Math.max(0, 100 - avgMovement * 2);
  };

  const calculatePoseMovement = (current: PoseDetection, previous: PoseDetection): number => {
    const currentKeypoints = current.keypoints;
    const previousKeypoints = previous.keypoints;
    
    let totalMovement = 0;
    let validPoints = 0;
    
    currentKeypoints.forEach(currentKp => {
      const prevKp = previousKeypoints.find(pkp => pkp.part === currentKp.part);
      if (prevKp && currentKp.score > 0.3 && prevKp.score > 0.3) {
        const movement = Math.sqrt(
          Math.pow(currentKp.position.x - prevKp.position.x, 2) +
          Math.pow(currentKp.position.y - prevKp.position.y, 2)
        );
        totalMovement += movement;
        validPoints++;
      }
    });
    
    if (validPoints === 0) return 0;
    
    return totalMovement / validPoints;
  };

  const calculateHandActivityMetrics = (
    currentHands: HandDetection[],
    previousHands?: HandDetection[]
  ) => {
    const leftHand = currentHands.find(h => h.handedness === 'Left');
    const rightHand = currentHands.find(h => h.handedness === 'Right');
    
    const leftHandActive = leftHand ? leftHand.score > 0.5 : false;
    const rightHandActive = rightHand ? rightHand.score > 0.5 : false;
    
    // Calculate gesture intensity based on hand movement
    let gestureIntensity = 0;
    let handMovement = 0;
    
    if (leftHand && previousHands) {
      const prevLeftHand = previousHands.find(h => h.handedness === 'Left');
      if (prevLeftHand) {
        const movement = calculateHandMovement(leftHand.landmarks, prevLeftHand.landmarks);
        handMovement += movement;
        gestureIntensity += movement;
      }
    }
    
    if (rightHand && previousHands) {
      const prevRightHand = previousHands.find(h => h.handedness === 'Right');
      if (prevRightHand) {
        const movement = calculateHandMovement(rightHand.landmarks, prevRightHand.landmarks);
        handMovement += movement;
        gestureIntensity += movement;
      }
    }
    
    gestureIntensity = Math.min(100, gestureIntensity * 10);
    handMovement = Math.min(100, handMovement * 5);

    return {
      leftHandActive,
      rightHandActive,
      gestureIntensity: Math.round(gestureIntensity),
      handMovement: Math.round(handMovement),
    };
  };

  const calculateHandMovement = (current: HandKeypoint[], previous: HandKeypoint[]): number => {
    if (current.length !== previous.length) return 0;
    
    let totalMovement = 0;
    for (let i = 0; i < current.length; i++) {
      const movement = Math.sqrt(
        Math.pow(current[i].x - previous[i].x, 2) +
        Math.pow(current[i].y - previous[i].y, 2)
      );
      totalMovement += movement;
    }
    
    return totalMovement / current.length;
  };

  const calculateFaceAnalysisMetrics = (
    currentFaces: FaceDetectionResult[],
    previousFaces?: FaceDetectionResult[],
    currentPose?: PoseDetection,
    previousPose?: PoseDetection
  ) => {
    // Use face detection data when available, fallback to pose data
    const hasFace = currentFaces.length > 0;
    const hasPose = currentPose && currentPose.keypoints.length > 0;
    
    if (!hasFace && !hasPose) {
      return { confidence: 0, eyeContact: 0, headMovement: 0, facialExpression: 'neutral' };
    }

    let confidence = 0;
    let eyeContact = 0;
    let headMovement = 0;
    let facialExpression = 'neutral';

    // Face-based analysis
    if (hasFace) {
      const face = currentFaces[0];
      confidence = Math.round(face.score * 100);
      
      // Calculate eye contact based on face position
      const faceCenterX = (face.box.xMin + face.box.xMax) / 2;
      eyeContact = Math.max(0, 100 - Math.abs(faceCenterX - 0.5) * 200);
      
      // Calculate head movement
      if (previousFaces && previousFaces.length > 0) {
        const prevFace = previousFaces[0];
        const movement = Math.sqrt(
          Math.pow(faceCenterX - (prevFace.box.xMin + prevFace.box.xMax) / 2, 2) +
          Math.pow((face.box.yMin + face.box.yMax) / 2 - (prevFace.box.yMin + prevFace.box.yMax) / 2, 2)
        );
        headMovement = Math.min(100, movement * 100);
      }
      
      // Simple facial expression detection based on face landmarks
      if (face.landmarks && face.landmarks.length >= 6) {
        // Basic expression detection using eye and mouth landmarks
        const mouthLeft = face.landmarks[3];
        const mouthRight = face.landmarks[4];
        const mouthCenter = face.landmarks[5];
        
        // Calculate mouth openness
        const mouthWidth = Math.sqrt(
          Math.pow(mouthRight[0] - mouthLeft[0], 2) + Math.pow(mouthRight[1] - mouthLeft[1], 2)
        );
        const mouthHeight = Math.abs(mouthCenter[1] - (mouthLeft[1] + mouthRight[1]) / 2);
        
        if (mouthHeight > mouthWidth * 0.3) {
          facialExpression = 'surprised';
        } else if (mouthHeight > mouthWidth * 0.1) {
          facialExpression = 'happy';
        } else {
          facialExpression = 'neutral';
        }
      }
    }

    // Pose-based analysis (as fallback or enhancement)
    if (hasPose) {
      const keypoints = currentPose.keypoints;
      const nose = keypoints.find(kp => kp.part === 'nose');
      const leftEye = keypoints.find(kp => kp.part === 'leftEye');
      const rightEye = keypoints.find(kp => kp.part === 'rightEye');
      
      // Calculate confidence based on face keypoint visibility
      const faceKeypoints = [nose, leftEye, rightEye].filter(kp => kp && kp.score > 0.3);
      const poseConfidence = Math.round((faceKeypoints.length / 3) * 100);
      
      // Calculate eye contact based on head position
      let poseEyeContact = 0;
      if (nose && leftEye && rightEye) {
        const eyeCenterX = (leftEye.position.x + rightEye.position.x) / 2;
        const eyeCenterY = (leftEye.position.y + rightEye.position.y) / 2;
        const noseToEyeDistance = Math.sqrt(
          Math.pow(nose.position.x - eyeCenterX, 2) + Math.pow(nose.position.y - eyeCenterY, 2)
        );
        poseEyeContact = Math.max(0, 100 - noseToEyeDistance * 5);
      }
      
      // Calculate head movement
      let poseHeadMovement = 0;
      if (previousPose && nose) {
        const prevNose = previousPose.keypoints.find(kp => kp.part === 'nose');
        if (prevNose) {
          const movement = Math.sqrt(
            Math.pow(nose.position.x - prevNose.position.x, 2) +
            Math.pow(nose.position.y - prevNose.position.y, 2)
          );
          poseHeadMovement = Math.min(100, movement * 10);
        }
      }

      // Combine face and pose metrics
      if (hasFace) {
        confidence = Math.round((confidence + poseConfidence) / 2);
        eyeContact = Math.round((eyeContact + poseEyeContact) / 2);
        headMovement = Math.round((headMovement + poseHeadMovement) / 2);
      } else {
        confidence = poseConfidence;
        eyeContact = Math.round(poseEyeContact);
        headMovement = Math.round(poseHeadMovement);
      }
    }

    return {
      confidence,
      eyeContact: Math.round(eyeContact),
      headMovement: Math.round(headMovement),
      facialExpression,
    };
  };

  const calculateOverallMetrics = (
    posture: BehaviorMetrics['posture'],
    attention: BehaviorMetrics['attention'],
    handActivity: BehaviorMetrics['handActivity'],
    faceAnalysis: BehaviorMetrics['faceAnalysis']
  ) => {
    const confidence = Math.round((posture.confidence + faceAnalysis.confidence) / 2);
    const engagement = Math.round((attention.engagement + handActivity.gestureIntensity) / 2);
    const activity = Math.round((handActivity.handMovement + attention.level) / 2);
    const stability = Math.round((posture.stability + (100 - attention.distraction)) / 2);

    return {
      confidence,
      engagement,
      activity,
      stability,
    };
  };

  const smoothMetrics = (newMetrics: BehaviorMetrics): BehaviorMetrics => {
    metricsHistory.current.push(newMetrics);
    
    if (metricsHistory.current.length > maxHistoryLength) {
      metricsHistory.current.shift();
    }
    
    const weights = metricsHistory.current.map((_, index) => index + 1);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    const smoothedMetrics: BehaviorMetrics = {
      posture: { confidence: 0, stability: 0, alignment: 0, slouching: 0 },
      attention: { level: 0, focus: 0, engagement: 0, distraction: 0 },
      handActivity: { leftHandActive: false, rightHandActive: false, gestureIntensity: 0, handMovement: 0 },
      faceAnalysis: { confidence: 0, eyeContact: 0, headMovement: 0, facialExpression: 'neutral' },
      overall: { confidence: 0, engagement: 0, activity: 0, stability: 0 },
    };
    
    // Calculate weighted averages
    metricsHistory.current.forEach((metric, index) => {
      const weight = weights[index] / totalWeight;
      
      // Posture metrics
      smoothedMetrics.posture.confidence += metric.posture.confidence * weight;
      smoothedMetrics.posture.stability += metric.posture.stability * weight;
      smoothedMetrics.posture.alignment += metric.posture.alignment * weight;
      smoothedMetrics.posture.slouching += metric.posture.slouching * weight;
      
      // Attention metrics
      smoothedMetrics.attention.level += metric.attention.level * weight;
      smoothedMetrics.attention.focus += metric.attention.focus * weight;
      smoothedMetrics.attention.engagement += metric.attention.engagement * weight;
      smoothedMetrics.attention.distraction += metric.attention.distraction * weight;
      
      // Hand activity metrics
      smoothedMetrics.handActivity.gestureIntensity += metric.handActivity.gestureIntensity * weight;
      smoothedMetrics.handActivity.handMovement += metric.handActivity.handMovement * weight;
      
      // Face analysis metrics
      smoothedMetrics.faceAnalysis.confidence += metric.faceAnalysis.confidence * weight;
      smoothedMetrics.faceAnalysis.eyeContact += metric.faceAnalysis.eyeContact * weight;
      smoothedMetrics.faceAnalysis.headMovement += metric.faceAnalysis.headMovement * weight;
      
      // Overall metrics
      smoothedMetrics.overall.confidence += metric.overall.confidence * weight;
      smoothedMetrics.overall.engagement += metric.overall.engagement * weight;
      smoothedMetrics.overall.activity += metric.overall.activity * weight;
      smoothedMetrics.overall.stability += metric.overall.stability * weight;
    });
    
    // Round all values
    smoothedMetrics.posture.confidence = Math.round(smoothedMetrics.posture.confidence);
    smoothedMetrics.posture.stability = Math.round(smoothedMetrics.posture.stability);
    smoothedMetrics.posture.alignment = Math.round(smoothedMetrics.posture.alignment);
    smoothedMetrics.posture.slouching = Math.round(smoothedMetrics.posture.slouching);
    
    smoothedMetrics.attention.level = Math.round(smoothedMetrics.attention.level);
    smoothedMetrics.attention.focus = Math.round(smoothedMetrics.attention.focus);
    smoothedMetrics.attention.engagement = Math.round(smoothedMetrics.attention.engagement);
    smoothedMetrics.attention.distraction = Math.round(smoothedMetrics.attention.distraction);
    
    smoothedMetrics.handActivity.leftHandActive = newMetrics.handActivity.leftHandActive;
    smoothedMetrics.handActivity.rightHandActive = newMetrics.handActivity.rightHandActive;
    smoothedMetrics.handActivity.gestureIntensity = Math.round(smoothedMetrics.handActivity.gestureIntensity);
    smoothedMetrics.handActivity.handMovement = Math.round(smoothedMetrics.handActivity.handMovement);
    
    smoothedMetrics.faceAnalysis.confidence = Math.round(smoothedMetrics.faceAnalysis.confidence);
    smoothedMetrics.faceAnalysis.eyeContact = Math.round(smoothedMetrics.faceAnalysis.eyeContact);
    smoothedMetrics.faceAnalysis.headMovement = Math.round(smoothedMetrics.faceAnalysis.headMovement);
    smoothedMetrics.faceAnalysis.facialExpression = newMetrics.faceAnalysis.facialExpression;
    
    smoothedMetrics.overall.confidence = Math.round(smoothedMetrics.overall.confidence);
    smoothedMetrics.overall.engagement = Math.round(smoothedMetrics.overall.engagement);
    smoothedMetrics.overall.activity = Math.round(smoothedMetrics.overall.activity);
    smoothedMetrics.overall.stability = Math.round(smoothedMetrics.overall.stability);
    
    return smoothedMetrics;
  };

  const resetMetrics = () => {
    metricsHistory.current = [];
    setMetrics({
      posture: { confidence: 0, stability: 0, alignment: 0, slouching: 0 },
      attention: { level: 0, focus: 0, engagement: 0, distraction: 0 },
      handActivity: { leftHandActive: false, rightHandActive: false, gestureIntensity: 0, handMovement: 0 },
      faceAnalysis: { confidence: 0, eyeContact: 0, headMovement: 0, facialExpression: 'neutral' },
      overall: { confidence: 0, engagement: 0, activity: 0, stability: 0 },
    });
  };

  return {
    isLoading,
    error,
    models,
    detectAll,
    metrics,
    resetMetrics,
  };
};

'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { 
  Camera, 
  CameraOff, 
  Play, 
  Pause, 
  RotateCcw, 
  Eye, 
  Brain, 
  Activity,
  Zap,
  Smile,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  User,
  Hand,
  Target,
  Gauge,
  ActivityIcon,
  Focus,
  Shield,
  Move,
  Heart,
  Sparkles,
  Layers,
  Cpu,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useTensorFlowDetection, DetectionResult } from '@/hooks/useTensorFlowDetection';
import { AdvancedVisualization } from '@/components/AdvancedVisualization';

export default function AdvancedBehaviorTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult>({ faces: [], hands: [], timestamp: Date.now() });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  
  const { isLoading, error, detectAll, metrics, resetMetrics } = useTensorFlowDetection();
  const animationFrameRef = useRef<number | undefined>(undefined);

  const startCamera = async () => {
    try {
      setIsInitializingCamera(true);
      setCameraError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
      }

      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error('Camera access requires HTTPS. Please access this site via HTTPS or localhost.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setStream(mediaStream);
        setIsStreaming(true);
        setIsPaused(false);
        setCameraError(null);
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      
      let errorMessage = 'Failed to access camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Camera permission was denied. Please allow camera access and refresh the page.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found. Please connect a camera and try again.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application. Please close other applications using the camera.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Camera constraints cannot be satisfied. Trying with lower resolution...';
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play();
            setStream(fallbackStream);
            setIsStreaming(true);
            setIsPaused(false);
            setCameraError(null);
            return;
          }
        } catch (fallbackErr) {
          errorMessage += ' Fallback also failed.';
        }
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Unknown error occurred. Please check your camera and browser permissions.';
      }
      
      setCameraError(errorMessage);
    } finally {
      setIsInitializingCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
      setIsPaused(false);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const togglePause = () => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  const handleResetMetrics = () => {
    resetMetrics();
  };

  const processFrame = async () => {
    if (!videoRef.current || !isStreaming || isPaused) return;

    try {
      const result = await detectAll(videoRef.current);
      setDetectionResult(result);
    } catch (error) {
      console.error('Error in processFrame:', error);
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  useEffect(() => {
    if (isStreaming && !isPaused) {
      processFrame();
    }
  }, [isStreaming, isPaused]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header Skeleton */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div>
                  <Skeleton className="h-6 w-24 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content Skeleton */}
          <div className="xl:col-span-3">
            <Card className="overflow-hidden shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative bg-slate-900 rounded-lg overflow-hidden aspect-video">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="relative mb-4">
                        <Spinner className="h-12 w-12 text-blue-600 mx-auto" />
                        <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-pulse"></div>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Initializing Advanced AI Models</h3>
                      <p className="text-slate-400">Loading PoseNet, BlazeFace, and HandPose models...</p>
                      <div className="mt-4 flex justify-center">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Panel Skeleton */}
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl font-semibold text-slate-900 mb-2">
              AI Models Initialization Error
            </CardTitle>
            <CardDescription className="text-slate-600 mb-6">
              {error}
            </CardDescription>
            <Button onClick={() => window.location.reload()} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Tracky AI</h1>
                <p className="text-sm text-slate-600">Advanced Behavior Analytics</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                variant={detectionResult.faces.length > 0 ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                {detectionResult.faces.length > 0 ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3 opacity-50" />
                )}
                {detectionResult.faces.length} Face{detectionResult.faces.length !== 1 ? 's' : ''}
              </Badge>
              
              <Badge variant="outline" className="flex items-center gap-1">
                <Hand className="w-3 h-3" />
                {detectionResult.hands.length} Hand{detectionResult.hands.length !== 1 ? 's' : ''}
              </Badge>
              
              <Badge variant="outline" className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {detectionResult.pose ? "Pose" : "No Pose"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Camera View */}
        <div className="xl:col-span-3">
          <Card className="overflow-hidden shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-600" />
                Advanced AI Analysis
              </CardTitle>
              <CardDescription>
                Real-time pose, face, and hand detection with comprehensive behavior analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative bg-slate-900 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-auto"
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
                
                {/* Advanced Visualization */}
                <AdvancedVisualization
                  canvasRef={canvasRef}
                  videoRef={videoRef}
                  detectionResult={detectionResult}
                />
                
                {/* Camera Error Display */}
                {cameraError && (
                  <div className="absolute top-4 left-4 right-4">
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-red-800 mb-1">Camera Error</h4>
                            <p className="text-sm text-red-700">{cameraError}</p>
                            <div className="mt-2 flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setCameraError(null)}
                                className="text-red-700 border-red-300 hover:bg-red-100"
                              >
                                Dismiss
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={startCamera}
                                className="text-red-700 border-red-300 hover:bg-red-100"
                              >
                                Retry
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {/* Camera Controls */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex justify-center gap-2">
                    {!isStreaming ? (
                      <Button 
                        onClick={startCamera} 
                        size="lg"
                        disabled={isInitializingCamera}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                      >
                        {isInitializingCamera ? (
                          <>
                            <Spinner className="w-5 h-5 mr-2" />
                            Initializing...
                          </>
                        ) : (
                          <>
                            <Camera className="w-5 h-5 mr-2" />
                            Start AI Analysis
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          onClick={togglePause} 
                          variant="secondary"
                          size="lg"
                          className="bg-white/90 hover:bg-white text-slate-900"
                        >
                          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                        </Button>
                        <Button 
                          onClick={stopCamera} 
                          variant="destructive"
                          size="lg"
                        >
                          <CameraOff className="w-5 h-5 mr-2" />
                          Stop
                        </Button>
                        <Button 
                          onClick={handleResetMetrics} 
                          variant="outline"
                          size="lg"
                          className="bg-white/90 hover:bg-white text-slate-900"
                        >
                          <RotateCcw className="w-5 h-5 mr-2" />
                          Reset
                        </Button>
                        <Button 
                          onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)} 
                          variant="outline"
                          size="lg"
                          className="bg-white/90 hover:bg-white text-slate-900"
                        >
                          <BarChart3 className="w-5 h-5 mr-2" />
                          {showAdvancedMetrics ? 'Hide' : 'Show'} Details
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Metrics Panel */}
        <div className="space-y-4">
          {/* Overall Status */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="relative">
                  <Gauge className="w-5 h-5 text-purple-600" />
                  {isStreaming && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                Overall Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Confidence</span>
                <Badge 
                  variant={metrics.overall.confidence > 70 ? "default" : metrics.overall.confidence > 40 ? "secondary" : "destructive"}
                  className="flex items-center gap-1"
                >
                  <TrendingUp className="w-3 h-3" />
                  {metrics.overall.confidence}%
                </Badge>
              </div>
              <Progress value={metrics.overall.confidence} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Engagement</span>
                <Badge variant="outline">{metrics.overall.engagement}%</Badge>
              </div>
              <Progress value={metrics.overall.engagement} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Activity</span>
                <Badge variant="outline">{metrics.overall.activity}%</Badge>
              </div>
              <Progress value={metrics.overall.activity} className="h-2" />
            </CardContent>
          </Card>

          {/* Posture Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Posture Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Stability</span>
                <Badge variant="outline">{metrics.posture.stability}%</Badge>
              </div>
              <Progress value={metrics.posture.stability} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Alignment</span>
                <Badge variant="outline">{metrics.posture.alignment}%</Badge>
              </div>
              <Progress value={metrics.posture.alignment} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Slouching</span>
                <Badge variant={metrics.posture.slouching > 50 ? "destructive" : "secondary"}>
                  {metrics.posture.slouching}%
                </Badge>
              </div>
              <Progress value={metrics.posture.slouching} className="h-2" />
            </CardContent>
          </Card>

          {/* Attention Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Focus className="w-5 h-5 text-green-600" />
                Attention Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Level</span>
                <Badge variant="outline">{metrics.attention.level}%</Badge>
              </div>
              <Progress value={metrics.attention.level} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Focus</span>
                <Badge variant="outline">{metrics.attention.focus}%</Badge>
              </div>
              <Progress value={metrics.attention.focus} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Distraction</span>
                <Badge variant={metrics.attention.distraction > 50 ? "destructive" : "secondary"}>
                  {metrics.attention.distraction}%
                </Badge>
              </div>
              <Progress value={metrics.attention.distraction} className="h-2" />
            </CardContent>
          </Card>

          {/* Hand Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Hand className="w-5 h-5 text-orange-600" />
                Hand Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Left Hand</span>
                <Badge variant={metrics.handActivity.leftHandActive ? "default" : "secondary"}>
                  {metrics.handActivity.leftHandActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Right Hand</span>
                <Badge variant={metrics.handActivity.rightHandActive ? "default" : "secondary"}>
                  {metrics.handActivity.rightHandActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Gesture Intensity</span>
                <Badge variant="outline">{metrics.handActivity.gestureIntensity}%</Badge>
              </div>
              <Progress value={metrics.handActivity.gestureIntensity} className="h-2" />
            </CardContent>
          </Card>

          {/* Face Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-pink-600" />
                Face Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Eye Contact</span>
                <Badge variant="outline">{metrics.faceAnalysis.eyeContact}%</Badge>
              </div>
              <Progress value={metrics.faceAnalysis.eyeContact} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Head Movement</span>
                <Badge variant="outline">{metrics.faceAnalysis.headMovement}%</Badge>
              </div>
              <Progress value={metrics.faceAnalysis.headMovement} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Expression</span>
                <Badge variant="outline" className="capitalize">{metrics.faceAnalysis.facialExpression}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Confidence</span>
                <Badge variant="outline">{metrics.faceAnalysis.confidence}%</Badge>
              </div>
              <Progress value={metrics.faceAnalysis.confidence} className="h-2" />
            </CardContent>
          </Card>

          {/* Advanced Metrics Toggle */}
          {showAdvancedMetrics && (
            <>
              {/* Detection Counts */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    Detection Counts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Faces Detected</span>
                    <Badge variant="outline">{detectionResult.faces.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Hands Detected</span>
                    <Badge variant="outline">{detectionResult.hands.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Pose Detected</span>
                    <Badge variant={detectionResult.pose ? "default" : "secondary"}>
                      {detectionResult.pose ? "Yes" : "No"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Model Performance */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-cyan-600" />
                    Model Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">PoseNet</span>
                    <Badge variant={detectionResult.pose ? "default" : "secondary"}>
                      {detectionResult.pose ? `${Math.round(detectionResult.pose.score * 100)}%` : "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">BlazeFace</span>
                    <Badge variant={detectionResult.faces.length > 0 ? "default" : "secondary"}>
                      {detectionResult.faces.length > 0 ? `${Math.round(detectionResult.faces[0].score * 100)}%` : "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">HandPose</span>
                    <Badge variant={detectionResult.hands.length > 0 ? "default" : "secondary"}>
                      {detectionResult.hands.length > 0 ? `${Math.round(detectionResult.hands[0].score * 100)}%` : "N/A"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Camera, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import AdvancedBehaviorTracker from '@/components/AdvancedBehaviorTracker';

export default function Home() {
  const [selectedTracker, setSelectedTracker] = useState<'advanced' | null>(null);

  if (selectedTracker === 'advanced') {
    return <AdvancedBehaviorTracker />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Tracky AI</h1>
          <p className="text-lg text-slate-600">Multimodal Learner Behavior Tracking</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Advanced TensorFlow Option */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500" onClick={() => setSelectedTracker('advanced')}>
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Advanced AI Behavior Tracker</CardTitle>
              <CardDescription className="text-base">
                Comprehensive behavior analysis using PoseNet, Face Detection, and HandPose models
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600" />
                    Pose Detection
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">Full body pose estimation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">Posture analysis & alignment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">Movement stability tracking</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-pink-600" />
                    Face Analysis
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">Multi-face detection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">Eye contact analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">Head movement tracking</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-600" />
                    Hand Tracking
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">21-point hand landmarks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">Gesture recognition</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">Hand activity analysis</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    AI Analytics
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">Attention & focus metrics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">Engagement scoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">Real-time visualization</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-center gap-4">
                  <Badge variant="default" className="text-sm px-3 py-1">
                    <Zap className="w-3 h-3 mr-1" />
                    TensorFlow.js
                  </Badge>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    <Camera className="w-3 h-3 mr-1" />
                    Real-time Processing
                  </Badge>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    <Brain className="w-3 h-3 mr-1" />
                    Multi-Model AI
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 mb-4">
            Advanced AI-powered behavior tracking with comprehensive pose, face, and hand analysis.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-4">
            <AlertCircle className="w-3 h-3" />
            <span>Requires camera access and modern browser with WebGL support</span>
          </div>
          
          {/* Camera Troubleshooting */}
          <Card className="bg-blue-50 border-blue-200 max-w-2xl mx-auto">
            <CardContent className="p-4">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Camera Troubleshooting
              </h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Make sure you're using HTTPS or localhost (camera access requires secure context)</p>
                <p>• Allow camera permissions when prompted by your browser</p>
                <p>• Close other applications that might be using your camera</p>
                <p>• Try refreshing the page if camera access fails</p>
                <p>• Use Chrome, Firefox, or Safari for best compatibility</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

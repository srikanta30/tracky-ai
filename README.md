# Tracky AI - Realtime Multimodal Learner Behavior Tracking

<img width="882" height="533" alt="Screenshot 2025-09-10 at 11 02 40 PM" src="https://github.com/user-attachments/assets/e539b6e0-145c-4293-9011-497320cc3db0" />


A Next.js application that uses TensorFlow.js to track learner behavior in real-time through webcam analysis. The app provides live metrics for attention, engagement, eye contact, head movement, and emotion detection.

## Features

- **Real-time Face Detection**: Uses TensorFlow.js MediaPipe Face Mesh for accurate facial landmark detection
- **Behavior Metrics**: Tracks attention, engagement, eye contact, and head movement
- **Emotion Recognition**: Analyzes facial expressions to determine dominant emotions
- **Live Camera UI**: Clean, modern interface that looks like a video call application
- **Real-time Overlays**: Visual indicators showing face detection and landmarks
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **TensorFlow.js** for AI/ML capabilities
- **shadcn/ui** for modern UI components
- **Tailwind CSS** for styling
- **MediaPipe Face Mesh** for facial landmark detection

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:3000`

4. **Allow camera access** when prompted

5. **Click "Start Camera"** to begin behavior tracking

## How It Works

### Face Detection
The application uses TensorFlow.js with MediaPipe Face Mesh to detect facial landmarks in real-time. This provides 468 3D facial landmarks that are used for various calculations.

### Behavior Metrics

- **Attention**: Calculated based on head position and eye contact
- **Engagement**: Derived from facial expressions and movement patterns
- **Eye Contact**: Estimated based on eye position relative to camera center
- **Head Movement**: Tracks movement between frames
- **Emotion Analysis**: Basic emotion detection based on facial landmark positions

### Real-time Processing
The application processes video frames at 30fps, updating metrics and overlays in real-time. The face detection runs on the client-side using WebGL acceleration.

## Components

- `BehaviorTracker`: Main component handling camera and UI
- `useFaceDetection`: Custom hook for TensorFlow.js integration
- Real-time metrics display with progress bars
- Camera controls (start/stop/pause/reset)

## Browser Requirements

- Modern browser with WebGL support
- Camera access permissions
- HTTPS (required for camera access in production)

## Limitations

- Emotion detection is simplified and may not be as accurate as dedicated emotion recognition models
- Eye contact calculation is basic and could be improved with gaze tracking
- Performance depends on device capabilities and camera quality

## Future Enhancements

- Integration with more sophisticated emotion recognition models
- Gaze tracking for more accurate eye contact detection
- Data persistence and analytics
- Multi-person detection
- Customizable alert thresholds
- Export functionality for behavior reports

## License

MIT License - feel free to use this project for educational or commercial purposes.

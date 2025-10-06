import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Circle, Clock, MousePointer } from 'lucide-react';
import recorder from '../utils/recorder';
import apiService from '../services/api';

const RecordingControls = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update recording status periodically
  useEffect(() => {
    let interval;
    
    if (isRecording) {
      interval = setInterval(() => {
        const status = recorder.getStatus();
        setInteractionCount(status.interactionCount);
        setDuration(status.duration);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startRecording = () => {
    recorder.startRecording();
    setIsRecording(true);
    setRecordingStatus('recording');
    setInteractionCount(0);
    setDuration(0);
  };

  const stopRecording = async () => {
    const interactions = recorder.stopRecording();
    setIsRecording(false);
    setRecordingStatus('stopped');
    
    if (interactions.length === 0) {
      alert('No interactions recorded. Please try recording some actions.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Send recording to backend for processing
      const response = await apiService.createRecording(interactions, {
        title: `Recording ${new Date().toLocaleString()}`,
        interactionCount: interactions.length,
        duration: duration
      });
      
      console.log('Recording submitted:', response);
      
      // Poll for completion
      apiService.pollRecordingStatus(response.id, (recording) => {
        console.log('Recording status update:', recording);
        
        if (recording.status === 'completed') {
          setIsProcessing(false);
          setRecordingStatus('completed');
          onRecordingComplete && onRecordingComplete(recording);
        } else if (recording.status === 'error') {
          setIsProcessing(false);
          setRecordingStatus('error');
          console.error('Recording processing failed:', recording.error);
        }
      });
      
    } catch (error) {
      console.error('Failed to submit recording:', error);
      setIsProcessing(false);
      setRecordingStatus('error');
      alert('Failed to submit recording. Please check if the backend server is running.');
    }
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (recordingStatus) {
      case 'recording': return 'bg-red-500';
      case 'stopped': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (isProcessing) return 'Processing...';
    switch (recordingStatus) {
      case 'recording': return 'Recording';
      case 'stopped': return 'Stopped';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Circle className={`w-4 h-4 ${getStatusColor()}`} />
          Browser Recorder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge variant={isRecording ? "destructive" : "secondary"}>
            {getStatusText()}
          </Badge>
          {isProcessing && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          )}
        </div>

        {/* Recording Stats */}
        {(isRecording || recordingStatus) && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{formatDuration(duration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-muted-foreground" />
              <span>{interactionCount} actions</span>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isRecording ? (
            <Button 
              onClick={startRecording} 
              className="flex-1"
              disabled={isProcessing}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button 
              onClick={stopRecording} 
              variant="destructive" 
              className="flex-1"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground">
          {!isRecording ? (
            "Click 'Start Recording' and perform actions in your browser. The recorder will capture clicks, typing, navigation, and scrolling."
          ) : (
            "Recording in progress... Perform your browser actions normally. Click 'Stop Recording' when finished."
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecordingControls;

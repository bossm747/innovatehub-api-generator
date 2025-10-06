import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  MousePointer, 
  Eye, 
  Trash2, 
  RefreshCw,
  Calendar,
  Globe,
  Zap,
  AlertCircle
} from 'lucide-react';
import apiService from '../services/api';

const RecordingsList = ({ onSelectRecording, selectedRecordingId }) => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAllRecordings();
      setRecordings(data);
    } catch (error) {
      console.error('Failed to load recordings:', error);
      setError('Failed to load recordings. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing': return <RefreshCw className="w-3 h-3 animate-spin" />;
      case 'completed': return <Zap className="w-3 h-3" />;
      case 'error': return <AlertCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading recordings...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadRecordings} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="w-5 h-5" />
            Recorded Automations
          </CardTitle>
          <Button onClick={loadRecordings} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recordings.length === 0 ? (
          <div className="text-center py-8">
            <MousePointer className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No recordings yet</p>
            <p className="text-sm text-muted-foreground">
              Start recording browser interactions to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedRecordingId === recording.id ? 'border-primary bg-muted/30' : 'border-border'
                }`}
                onClick={() => onSelectRecording(recording.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(recording.status)}>
                      {getStatusIcon(recording.status)}
                      <span className="ml-1 capitalize">{recording.status}</span>
                    </Badge>
                    {recording.metadata?.title && (
                      <span className="font-medium text-sm">
                        {recording.metadata.title}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecording(recording.id);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(recording.createdAt)}</span>
                  </div>
                  
                  {recording.metadata?.interactionCount && (
                    <div className="flex items-center gap-2">
                      <MousePointer className="w-4 h-4" />
                      <span>{recording.metadata.interactionCount} actions</span>
                    </div>
                  )}
                  
                  {recording.metadata?.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{Math.ceil(recording.metadata.duration / 1000)}s</span>
                    </div>
                  )}
                  
                  {recording.metadata?.url && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span className="truncate">
                        {new URL(recording.metadata.url).hostname}
                      </span>
                    </div>
                  )}
                </div>

                {recording.status === 'error' && recording.error && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Error:</span>
                    </div>
                    <p className="mt-1">{recording.error}</p>
                  </div>
                )}

                {recording.status === 'completed' && recording.automationPackage && (
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>✅ Scripts generated</span>
                    <span>📊 Analysis complete</span>
                    <span>📖 Documentation ready</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecordingsList;

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Copy, 
  Code, 
  Server, 
  Cloud, 
  FileCode,
  Rocket,
  Settings,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const APIExporter = ({ recording }) => {
  const [apiPackage, setApiPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedContent, setCopiedContent] = useState(null);

  useEffect(() => {
    if (recording && recording.automationPackage) {
      generateAPIPackage();
    }
  }, [recording]);

  const generateAPIPackage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3001/api/export/recordings/${recording.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ format: 'all' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate API package');
      }
      
      const data = await response.json();
      setApiPackage(data);
    } catch (error) {
      console.error('Error generating API package:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (content, type) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedContent(type);
      setTimeout(() => setCopiedContent(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadFile = async (format) => {
    try {
      const response = await fetch(`http://localhost:3001/api/export/recordings/${recording.id}/download/${format}`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${apiPackage.metadata.name}_${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  if (!recording || !recording.automationPackage) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No automation available for API export</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating API package...</p>
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
          <Button onClick={generateAPIPackage} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!apiPackage) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <Button onClick={generateAPIPackage}>
            <Rocket className="w-4 h-4 mr-2" />
            Generate API
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatCode = (code) => {
    return code.split('\n').map((line, index) => (
      <div key={index} className="flex">
        <span className="text-muted-foreground text-xs w-8 text-right mr-4 select-none">
          {index + 1}
        </span>
        <span className="flex-1 font-mono text-sm">{line}</span>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* API Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            API Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Name: {apiPackage.metadata.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Parameters: {apiPackage.metadata.parameters.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Ready for deployment</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            {apiPackage.metadata.description}
          </p>

          {/* Parameters */}
          <div className="space-y-2">
            <h4 className="font-medium">API Parameters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {apiPackage.metadata.parameters.map((param, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Badge variant={param.required ? "default" : "secondary"} className="text-xs">
                    {param.name}
                  </Badge>
                  <span className="text-muted-foreground">
                    {param.type} {param.required && '(required)'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Generated APIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="express" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="express">Express.js</TabsTrigger>
              <TabsTrigger value="fastapi">FastAPI</TabsTrigger>
              <TabsTrigger value="flask">Flask</TabsTrigger>
              <TabsTrigger value="openapi">OpenAPI</TabsTrigger>
            </TabsList>
            
            {Object.entries(apiPackage.apis).map(([format, code]) => (
              <TabsContent key={format} value={format} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{format.toUpperCase()}</Badge>
                    <Badge variant="outline">
                      {format === 'openapi' ? 'JSON' : format === 'express' ? 'JavaScript' : 'Python'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(
                        format === 'openapi' ? JSON.stringify(code, null, 2) : code, 
                        format
                      )}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copiedContent === format ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(format)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4 max-h-96 overflow-auto">
                  <pre className="text-sm">
                    {format === 'openapi' ? 
                      formatCode(JSON.stringify(code, null, 2)) : 
                      formatCode(code)
                    }
                  </pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Deployment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Deployment Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(apiPackage.deployment).map(([platform, config]) => (
              <div key={platform} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium capitalize">{platform}</h4>
                  <Badge variant="outline">{platform}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Deploy your API to {platform} with one-click configuration
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(
                      typeof config === 'string' ? config : JSON.stringify(config, null, 2),
                      `deploy-${platform}`
                    )}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copiedContent === `deploy-${platform}` ? 'Copied!' : 'Copy Config'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Open deployment documentation
                      window.open(`https://docs.${platform}.com`, '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Docs
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5" />
            Usage Examples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
            </TabsList>
            
            {Object.entries(apiPackage.examples).map(([lang, example]) => (
              <TabsContent key={lang} value={lang} className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{lang.toUpperCase()}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(example, `example-${lang}`)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copiedContent === `example-${lang}` ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm whitespace-pre-wrap">{example}</pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5" />
            API Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 max-h-64 overflow-auto">
            <pre className="text-sm whitespace-pre-wrap">
              {apiPackage.documentation}
            </pre>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(apiPackage.documentation, 'docs')}
            >
              <Copy className="w-4 h-4 mr-2" />
              {copiedContent === 'docs' ? 'Copied!' : 'Copy Docs'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const blob = new Blob([apiPackage.documentation], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${apiPackage.metadata.name}_docs.md`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Docs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIExporter;

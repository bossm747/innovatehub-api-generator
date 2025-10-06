import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Download, 
  Play, 
  FileCode, 
  Zap, 
  Settings, 
  Clock,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

const ScriptViewer = ({ recording }) => {
  const [copiedScript, setCopiedScript] = useState(null);

  if (!recording || !recording.automationPackage) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <FileCode className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No automation script available</p>
        </CardContent>
      </Card>
    );
  }

  const { automationPackage } = recording;
  const { scripts, analysis, documentation, configuration, metadata } = automationPackage;

  const copyToClipboard = async (text, scriptType) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedScript(scriptType);
      setTimeout(() => setCopiedScript(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadScript = (content, filename) => {
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

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
      {/* Analysis Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Automation Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Runtime: {metadata.estimatedRuntime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Actions: {metadata.interactionCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getComplexityColor(analysis.complexity)}>
                {analysis.complexity} complexity
              </Badge>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Workflow</h4>
              <p className="text-sm text-muted-foreground">{analysis.workflow}</p>
            </div>
            
            {analysis.issues && analysis.issues.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  Potential Issues
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {analysis.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.optimizations && analysis.optimizations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Optimizations Applied
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {analysis.optimizations.map((optimization, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {optimization}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Script Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5" />
            Generated Scripts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="playwright-enhanced" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="playwright-enhanced">Enhanced</TabsTrigger>
              <TabsTrigger value="playwright-basic">Basic</TabsTrigger>
              <TabsTrigger value="puppeteer">Puppeteer</TabsTrigger>
              <TabsTrigger value="cypress">Cypress</TabsTrigger>
            </TabsList>
            
            <TabsContent value="playwright-enhanced" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Playwright Enhanced</Badge>
                  <Badge variant="outline">AI Optimized</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(scripts.playwright.enhanced, 'playwright-enhanced')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copiedScript === 'playwright-enhanced' ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadScript(scripts.playwright.enhanced, 'automation-enhanced.js')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-sm">
                  {formatCode(scripts.playwright.enhanced)}
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="playwright-basic" className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Playwright Basic</Badge>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(scripts.playwright.basic, 'playwright-basic')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copiedScript === 'playwright-basic' ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadScript(scripts.playwright.basic, 'automation-basic.js')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-sm">
                  {formatCode(scripts.playwright.basic)}
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="puppeteer" className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Puppeteer</Badge>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(scripts.puppeteer, 'puppeteer')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copiedScript === 'puppeteer' ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadScript(scripts.puppeteer, 'automation-puppeteer.js')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-sm">
                  {formatCode(scripts.puppeteer)}
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="cypress" className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Cypress</Badge>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(scripts.cypress, 'cypress')}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copiedScript === 'cypress' ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadScript(scripts.cypress, 'automation.cy.js')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-sm">
                  {formatCode(scripts.cypress)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4">
            <pre className="text-sm">
              {formatCode(JSON.stringify(configuration, null, 2))}
            </pre>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(JSON.stringify(configuration, null, 2), 'config')}
            >
              <Copy className="w-4 h-4 mr-2" />
              {copiedScript === 'config' ? 'Copied!' : 'Copy Config'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadScript(JSON.stringify(configuration, null, 2), 'automation-config.json')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Config
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 max-h-64 overflow-auto">
            <pre className="text-sm whitespace-pre-wrap">
              {documentation}
            </pre>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(documentation, 'docs')}
            >
              <Copy className="w-4 h-4 mr-2" />
              {copiedScript === 'docs' ? 'Copied!' : 'Copy Docs'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadScript(documentation, 'automation-docs.md')}
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

export default ScriptViewer;

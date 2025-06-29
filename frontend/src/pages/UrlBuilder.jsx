import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Link2, Copy, Download, Check, X, Plus } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import BackgroundLogo from '@/components/BackgroundLogo';

const UrlBuilder = () => {
  const [patterns, setPatterns] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [customUrl, setCustomUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const { toast } = useToast();

  // Fetch all patterns to get available labels
  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const response = await fetch('/api/data');
        if (response.ok) {
          const data = await response.json();
          setPatterns(data);
        } else {
          throw new Error('Failed to fetch patterns');
        }
      } catch (error) {
        console.error('Error fetching patterns:', error);
        toast({
          title: "Error",
          description: "Failed to load patterns",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatterns();
  }, [toast]);

  // Get unique labels from all patterns
  const getAvailableLabels = () => {
    const labelSet = new Set();
    patterns.forEach(pattern => {
      if (pattern.label) {
        // Handle comma-separated labels
        pattern.label.split(',').forEach(label => {
          labelSet.add(label.trim());
        });
      }
    });
    return Array.from(labelSet).sort();
  };

  // Update custom URL when selected labels change
  useEffect(() => {
    if (selectedLabels.length > 0) {
      const baseUrl = window.location.origin;
      const labelsString = selectedLabels.join(',');
      setCustomUrl(`${baseUrl}/api/config-files/${labelsString}.cfg`);
    } else {
      setCustomUrl('');
    }
  }, [selectedLabels]);

  const toggleLabel = (label) => {
    setSelectedLabels(prev => {
      if (prev.includes(label)) {
        return prev.filter(l => l !== label);
      } else {
        return [...prev, label];
      }
    });
  };

  const clearSelection = () => {
    setSelectedLabels([]);
  };

  const copyToClipboard = async () => {
    if (customUrl) {
      try {
        await navigator.clipboard.writeText(customUrl);
        setCopiedUrl(true);
        toast({
          title: "Success",
          description: "URL copied to clipboard",
        });
        setTimeout(() => setCopiedUrl(false), 2000);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy URL",
          variant: "destructive",
        });
      }
    }
  };

  const downloadConfig = () => {
    if (customUrl) {
      window.open(customUrl, '_blank');
    }
  };

  const availableLabels = getAvailableLabels();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full py-8 relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950">
      <BackgroundLogo />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Link2 className="h-8 w-8" />
            URL Builder
          </h1>
          <p className="text-muted-foreground">
            Select multiple labels to create a custom configuration URL that combines patterns from different sources.
          </p>
        </div>

        <div className="grid gap-6">
        {/* Label Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Available Labels</CardTitle>
            <CardDescription>
              Click on labels to include them in your custom configuration. 
              Selected labels: {selectedLabels.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableLabels.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No labels available. Add some patterns first.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {availableLabels.map(label => (
                    <Badge
                      key={label}
                      variant={selectedLabels.includes(label) ? "default" : "secondary"}
                      className={`cursor-pointer transition-colors hover:bg-primary/80 ${
                        selectedLabels.includes(label) 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-secondary/80'
                      }`}
                      onClick={() => toggleLabel(label)}
                    >
                      {selectedLabels.includes(label) && (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      {label}
                    </Badge>
                  ))}
                </div>
                
                {selectedLabels.length > 0 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Selected: {selectedLabels.join(', ')}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearSelection}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated URL */}
        {customUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Generated URL</CardTitle>
              <CardDescription>
                Use this URL to download a configuration file containing patterns from all selected labels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Label htmlFor="custom-url">Custom Configuration URL</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="custom-url"
                      value={customUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="shrink-0"
                    >
                      {copiedUrl ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={downloadConfig} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download Configuration
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Filename:</strong> {selectedLabels.join(',')}.cfg</p>
                  <p><strong>Labels included:</strong> {selectedLabels.length}</p>
                  <p><strong>Usage in Cisco:</strong></p>
                  <code className="block bg-muted p-2 rounded text-xs font-mono mt-1">
                    voice class e164-pattern-map 11 url {customUrl}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                <p>Select one or more labels from the available options above.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                <p>A custom URL will be generated automatically combining all selected labels.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                <p>Use the "Download Configuration" button to test the URL or copy it for use in Cisco configuration.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
                <p>The generated .cfg file will contain all E164 patterns from the selected labels, with duplicates automatically removed.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default UrlBuilder;
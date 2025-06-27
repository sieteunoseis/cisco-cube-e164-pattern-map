import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Copy, Trash2, Edit, Search, AlertTriangle, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiCall } from "@/lib/api";

const SavedPatterns = ({ onPatternChange, showActions = true, title = "Saved E164 Patterns" }) => {
  const { toast } = useToast();
  const [patterns, setPatterns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [labelToDelete, setLabelToDelete] = useState(null);

  // Fetch patterns
  const fetchPatterns = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall('/data');
      const data = await response.json();
      setPatterns(data);
      setIsLoading(false);
      
      // Notify parent component of pattern changes
      if (onPatternChange) {
        onPatternChange(data);
      }
    } catch (error) {
      console.error('Error fetching patterns:', error);
      setIsLoading(false);
      toast({
        title: "Error fetching patterns",
        description: "Failed to load E164 patterns.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  // Handle pattern deletion
  const handleDelete = async (id) => {
    try {
      const response = await apiCall(`/data/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({
          title: "Pattern Deleted",
          description: "E164 pattern has been removed.",
          duration: 3000,
        });
        fetchPatterns();
      } else {
        throw new Error('Failed to delete pattern');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete pattern. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Handle .cfg file download
  const handleDownloadCfg = (label) => {
    const cfgUrl = `http://localhost:5001/config-files/${label}.cfg`;
    window.open(cfgUrl, '_blank');
  };

  // Handle copying .cfg URL to clipboard
  const handleCopyLink = async (label) => {
    const cfgUrl = `http://localhost:5001/config-files/${label}.cfg`;
    try {
      await navigator.clipboard.writeText(cfgUrl);
      toast({
        title: "Link Copied!",
        description: `URL copied to clipboard: ${cfgUrl}`,
        duration: 3000,
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = cfgUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Link Copied!",
        description: `URL copied to clipboard: ${cfgUrl}`,
        duration: 3000,
      });
    }
  };

  // Handle deleting all patterns for a specific label
  const handleDeleteLabel = (label, labelPatterns) => {
    setLabelToDelete({ label, patterns: labelPatterns });
    setShowDeleteDialog(true);
  };

  const confirmDeleteLabel = async () => {
    if (!labelToDelete) return;

    try {
      // Delete all patterns for this label
      for (const pattern of labelToDelete.patterns) {
        await apiCall(`/data/${pattern.id}`, { method: 'DELETE' });
      }

      toast({
        title: "Label Deleted",
        description: `All patterns for label "${labelToDelete.label}" have been removed.`,
        duration: 3000,
      });
      
      setShowDeleteDialog(false);
      setLabelToDelete(null);
      fetchPatterns();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete some patterns. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {patterns.length} pattern{patterns.length !== 1 ? 's' : ''} configured
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading patterns...</p>
          </div>
        ) : patterns.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No E164 patterns configured yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first pattern to get started.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
            {(() => {
              // Group patterns by label (handle comma-separated labels)
              const groupedPatterns = {};
              
              patterns.forEach(pattern => {
                const labels = pattern.label ? pattern.label.split(',').map(l => l.trim()).filter(Boolean) : [];
                labels.forEach(label => {
                  if (!groupedPatterns[label]) {
                    groupedPatterns[label] = [];
                  }
                  groupedPatterns[label].push(pattern);
                });
              });

              return Object.entries(groupedPatterns).map(([label, labelPatterns], index) => (
                <AccordionItem key={label} value={`item-${index}`} className="border rounded-lg mb-2">
                  <div className="flex items-center justify-between px-4 py-3">
                    <AccordionTrigger className="flex-1 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{label}</Badge>
                        <span className="text-sm text-muted-foreground">
                          ({labelPatterns.length} pattern{labelPatterns.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </AccordionTrigger>
                    {showActions && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLabel(label, labelPatterns);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          title={`Delete all patterns for ${label}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadCfg(label);
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                          title={`Download ${label}.cfg`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(label);
                          }}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                          title={`Copy URL for Cisco IOS: voice class e164-pattern-map XXX url ...`}
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {labelPatterns.map((pattern) => (
                        <div key={pattern.id} className="flex items-start justify-between py-2 border-l-2 border-blue-200 dark:border-blue-800 pl-3">
                          <div className="flex-1">
                            <div className="font-mono text-lg font-semibold text-blue-600 dark:text-blue-400 mb-1">
                              {pattern.pattern}
                            </div>
                            {pattern.description && (
                              <p className="text-sm text-muted-foreground mb-1">{pattern.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1">
                              {pattern.label.split(',').map(l => l.trim()).filter(Boolean).map((patternLabel) => (
                                <Badge key={patternLabel} variant="outline" className="text-xs">
                                  {patternLabel}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {showActions && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(pattern.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                title="Delete this pattern"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ));
            })()}
          </Accordion>
        )}
      </CardContent>

      {/* Delete Label Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Label
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all patterns for this label?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {labelToDelete && (
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="destructive">{labelToDelete.label}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {labelToDelete.patterns.length} pattern{labelToDelete.patterns.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  This will permanently delete:
                </p>
                <ul className="text-sm text-red-700 dark:text-red-300 mt-1 space-y-1">
                  {labelToDelete.patterns.map((pattern, index) => (
                    <li key={pattern.id} className="font-mono">
                      • {pattern.pattern}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-red-800 dark:text-red-200 mt-2 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteLabel}>
                Delete All Patterns
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SavedPatterns;
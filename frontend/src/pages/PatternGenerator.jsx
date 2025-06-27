import { useState, useEffect } from "react";
import BackgroundLogo from "@/components/BackgroundLogo";
import SavedPatterns from "@/components/SavedPatterns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Download, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { regexForRange } from "@/lib/pattern-generator";
import { apiCall } from "@/lib/api";
import CreatableSelect from 'react-select/creatable';

const PatternGenerator = () => {
  const { toast } = useToast();
  const [startNumber, setStartNumber] = useState("");
  const [endNumber, setEndNumber] = useState("");
  const [results, setResults] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uniqueLabels, setUniqueLabels] = useState([]);
  const [labelOptions, setLabelOptions] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddAllDialog, setShowAddAllDialog] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [patternToAdd, setPatternToAdd] = useState(null);
  const [bulkNumbers, setBulkNumbers] = useState("");

  // Fetch existing labels for dropdown
  const fetchLabels = async () => {
    try {
      const response = await apiCall('/data');
      const data = await response.json();
      
      // Extract unique labels for autocomplete (handle comma-separated labels)
      const allLabels = data.flatMap(pattern => 
        pattern.label ? pattern.label.split(',').map(label => label.trim()).filter(Boolean) : []
      );
      const labels = [...new Set(allLabels)];
      setUniqueLabels(labels);
      
      // Create options for react-select
      const options = labels.map(label => ({ value: label, label: label }));
      setLabelOptions(options);
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  };

  useEffect(() => {
    fetchLabels();
  }, []);

  const handleGenerate = () => {
    const start = parseInt(startNumber);
    const end = parseInt(endNumber);

    if (isNaN(start) || isNaN(end)) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid numbers for both start and end values.",
        variant: "destructive",
      });
      return;
    }

    if (start > end) {
      toast({
        title: "Invalid Range",
        description: "Start number must be less than or equal to end number.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const patternResult = regexForRange(start, end);
      setResults(patternResult.patterns);

      toast({
        title: "Patterns Generated",
        description: `Generated ${patternResult.patterns.length} pattern(s) for range ${start}-${end}`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error generating patterns:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate patterns. Please check your input.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPattern = (pattern) => {
    navigator.clipboard.writeText(pattern);
    toast({
      title: "Copied",
      description: "Pattern copied to clipboard",
      duration: 2000,
    });
  };

  const handleCopyAllPatterns = () => {
    const allPatterns = results.map((r) => r.pattern).join("\n");
    navigator.clipboard.writeText(allPatterns);
    toast({
      title: "Copied",
      description: `${results.length} patterns copied to clipboard`,
      duration: 2000,
    });
  };

  const handleDownloadPatterns = () => {
    const allPatterns = results.map((r) => r.pattern).join("\n");
    const blob = new Blob([allPatterns], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patterns_${startNumber}_${endNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Patterns downloaded as text file",
      duration: 3000,
    });
  };

  // Validate slug format (allow hyphens and underscores)
  const validateSlug = (slug) => {
    return /^[a-z0-9_-]+$/.test(slug) && slug.length > 0;
  };

  // Validate multiple labels (comma-separated)
  const validateLabels = (labelsString) => {
    if (!labelsString || labelsString.trim().length === 0) return false;
    const labels = labelsString.split(',').map(label => label.trim()).filter(Boolean);
    return labels.length > 0 && labels.every(label => validateSlug(label));
  };

  const handleAddToDatabase = async (pattern) => {
    setPatternToAdd(pattern);
    setSelectedLabels([]);
    setShowAddDialog(true);
  };

  const handleConfirmAddToDatabase = async () => {
    if (!patternToAdd || selectedLabels.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one label.",
        variant: "destructive",
      });
      return;
    }

    const labelString = selectedLabels.map(label => label.value).join(',');
    
    if (!validateLabels(labelString)) {
      toast({
        title: "Invalid Labels",
        description: "Each label must be in slug format (lowercase, alphanumeric, hyphens/underscores only).",
        variant: "destructive",
      });
      return;
    }

    try {
      const patternData = {
        label: labelString,
        pattern: patternToAdd.pattern,
        description: `Generated pattern for range ${patternToAdd.start}-${patternToAdd.end}`,
      };

      const response = await apiCall("/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patternData),
      });

      if (response.ok) {
        toast({
          title: "Pattern Added",
          description: `Pattern ${patternToAdd.pattern} added to database`,
          duration: 3000,
        });
        setShowAddDialog(false);
        setPatternToAdd(null);
        setSelectedLabels([]);
        fetchLabels(); // Refresh labels
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details ? errorData.details.join(', ') : 'Failed to add pattern';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error adding pattern:", error);
      toast({
        title: "Add Failed",
        description: error.message || "Failed to add pattern to database",
        variant: "destructive",
      });
    }
  };

  const handleAddAllToDatabase = async () => {
    setSelectedLabels([]);
    setShowAddAllDialog(true);
  };

  const handleConfirmAddAllToDatabase = async () => {
    if (selectedLabels.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one label.",
        variant: "destructive",
      });
      return;
    }

    const labelString = selectedLabels.map(label => label.value).join(',');
    
    if (!validateLabels(labelString)) {
      toast({
        title: "Invalid Labels",
        description: "Each label must be in slug format (lowercase, alphanumeric, hyphens/underscores only).",
        variant: "destructive",
      });
      return;
    }

    try {
      for (const pattern of results) {
        const patternData = {
          label: labelString,
          pattern: pattern.pattern,
          description: `Generated pattern for range ${pattern.start}-${pattern.end} (part of ${startNumber}-${endNumber})`,
        };

        await apiCall("/data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(patternData),
        });
      }

      toast({
        title: "All Patterns Added",
        description: `${results.length} patterns added to database`,
        duration: 3000,
      });
      setShowAddAllDialog(false);
      setSelectedLabels([]);
      fetchLabels(); // Refresh labels
    } catch (error) {
      console.error("Error adding patterns:", error);
      toast({
        title: "Add Failed",
        description: "Failed to add some patterns to database",
        variant: "destructive",
      });
    }
  };

  const handleBulkGenerate = () => {
    if (!bulkNumbers.trim()) {
      toast({
        title: "No Numbers Provided",
        description: "Please enter numbers in the bulk input field.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Parse numbers from the textarea - split by newlines, commas, or spaces
      const numberStrings = bulkNumbers
        .split(/[\n,\s]+/)
        .map(str => str.trim())
        .filter(str => str.length > 0);

      if (numberStrings.length === 0) {
        throw new Error("No valid numbers found");
      }

      // Convert to integers and validate
      const numbers = [];
      for (const str of numberStrings) {
        const num = parseInt(str, 10);
        if (isNaN(num)) {
          throw new Error(`"${str}" is not a valid number`);
        }
        numbers.push(num);
      }

      if (numbers.length === 0) {
        throw new Error("No valid numbers found");
      }

      // Sort numbers and group consecutive ranges
      const sortedNumbers = [...new Set(numbers)].sort((a, b) => a - b);
      const ranges = [];
      let currentRange = [sortedNumbers[0]];

      for (let i = 1; i < sortedNumbers.length; i++) {
        const current = sortedNumbers[i];
        const previous = sortedNumbers[i - 1];
        
        // If consecutive, add to current range
        if (current === previous + 1) {
          currentRange.push(current);
        } else {
          // Start new range
          ranges.push(currentRange);
          currentRange = [current];
        }
      }
      ranges.push(currentRange); // Add the last range

      // Generate patterns for each range
      const allPatterns = [];
      for (const range of ranges) {
        const rangeStart = range[0];
        const rangeEnd = range[range.length - 1];
        
        if (rangeStart === rangeEnd) {
          // Single number - create a simple pattern
          allPatterns.push({
            pattern: rangeStart.toString(),
            start: rangeStart,
            end: rangeEnd
          });
        } else {
          // Range - use regexForRange
          const patternResult = regexForRange(rangeStart, rangeEnd);
          allPatterns.push(...patternResult.patterns);
        }
      }

      setResults(allPatterns);

      const totalRange = `${Math.min(...numbers)}-${Math.max(...numbers)}`;
      toast({
        title: "Patterns Generated",
        description: `Generated ${allPatterns.length} pattern(s) for ${numbers.length} numbers (${ranges.length} range${ranges.length !== 1 ? 's' : ''}: ${totalRange})`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error generating patterns:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate patterns. Please check your input.",
        variant: "destructive",
      });
      setResults([]); // Clear any previous results
    } finally {
      setIsGenerating(false);
    }
  };

  // Custom styles for react-select to match design and support dark mode
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'hsl(var(--background))',
      border: state.isFocused ? '2px solid hsl(var(--ring))' : '1px solid hsl(var(--border))',
      borderRadius: '6px',
      minHeight: '40px',
      fontSize: '14px',
      boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--ring))' : 'none',
      '&:hover': {
        border: state.isFocused ? '2px solid hsl(var(--ring))' : '1px solid hsl(var(--border))'
      }
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'hsl(var(--popover))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '6px',
      fontSize: '14px'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'transparent',
      color: 'hsl(var(--foreground))',
      fontSize: '14px',
      '&:hover': {
        backgroundColor: 'hsl(var(--accent))'
      }
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'hsl(var(--secondary))',
      borderRadius: '4px',
      fontSize: '14px'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'hsl(var(--secondary-foreground))',
      fontSize: '14px'
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'hsl(var(--secondary-foreground))',
      fontSize: '14px',
      '&:hover': {
        backgroundColor: 'hsl(var(--destructive))',
        color: 'hsl(var(--destructive-foreground))'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'hsl(var(--muted-foreground))',
      fontSize: '14px'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
      fontSize: '14px'
    }),
    input: (provided) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
      fontSize: '14px'
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      backgroundColor: 'hsl(var(--border))'
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: 'hsl(var(--muted-foreground))',
      '&:hover': {
        color: 'hsl(var(--foreground))'
      }
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: 'hsl(var(--muted-foreground))',
      '&:hover': {
        color: 'hsl(var(--foreground))'
      }
    })
  };

  return (
    <div className="min-h-full w-full py-8 relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950">
      <BackgroundLogo />
      <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">E164 Pattern Generator</h1>
        <p className="text-muted-foreground">Generate Cisco CUBE E164 patterns from number ranges</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Number Range Input</CardTitle>
            <CardDescription>Enter the starting and ending numbers to generate E164 patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="start-number" className="text-sm font-medium">
                  Start Number
                </label>
                <Input id="start-number" type="number" placeholder="e.g., 5551000" value={startNumber} onChange={(e) => setStartNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label htmlFor="end-number" className="text-sm font-medium">
                  End Number
                </label>
                <Input id="end-number" type="number" placeholder="e.g., 5551999" value={endNumber} onChange={(e) => setEndNumber(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !startNumber || !endNumber} className="w-full">
              {isGenerating ? "Generating..." : "Generate Patterns"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulk Number Input</CardTitle>
            <CardDescription>Enter a list of numbers (one per line, or separated by commas/spaces)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="bulk-numbers" className="text-sm font-medium">
                Numbers
              </label>
              <Textarea
                id="bulk-numbers"
                placeholder={`1000\n1001\n1002\n2008\n2009\n\nOr: 1000, 1001, 1002, 2008, 2009`}
                value={bulkNumbers}
                onChange={(e) => setBulkNumbers(e.target.value)}
                rows={8}
                className="font-mono"
              />
            </div>
            <Button onClick={handleBulkGenerate} disabled={isGenerating || !bulkNumbers.trim()} className="w-full">
              {isGenerating ? "Generating..." : "Generate from List"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {results.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Generated Patterns</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyAllPatterns}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadPatterns}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAddAllToDatabase}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add All to DB
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {results.length} pattern(s) generated for range {startNumber}-{endNumber}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {result.start} - {result.end}
                        </Badge>
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{result.pattern}</code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Covers numbers from {result.start} to {result.end}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleCopyPattern(result.pattern)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleAddToDatabase(result)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Saved E164 Patterns */}
      <SavedPatterns onPatternChange={fetchLabels} />

      {/* Add Single Pattern Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Pattern to Database</DialogTitle>
            <DialogDescription>
              Select labels for this pattern before adding to the database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {patternToAdd && (
              <div>
                <label className="block text-sm font-medium mb-2">Pattern:</label>
                <div className="font-mono text-lg font-semibold text-blue-600 dark:text-blue-400 p-2 bg-muted rounded">
                  {patternToAdd.pattern}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Range: {patternToAdd.start} - {patternToAdd.end}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Labels *</label>
              <CreatableSelect
                isMulti
                value={selectedLabels}
                onChange={setSelectedLabels}
                options={labelOptions}
                styles={selectStyles}
                placeholder="Select or create labels..."
                className="react-select-container"
                classNamePrefix="react-select"
                formatCreateLabel={(inputValue) => `Create "${inputValue.toLowerCase().replace(/[^a-z0-9_-]/g, '')}"`}
                isValidNewOption={(inputValue) => {
                  const cleanValue = inputValue.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                  return cleanValue.length > 0 && validateSlug(cleanValue);
                }}
                getNewOptionData={(inputValue) => ({
                  value: inputValue.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                  label: inputValue.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                  __isNew__: true
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Select existing labels or type to create new ones. Each label creates a separate .cfg file.
              </p>
              {uniqueLabels.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  💡 Existing labels: {uniqueLabels.join(', ')}
                </p>
              )}
              {selectedLabels.length > 0 && !selectedLabels.every(label => validateSlug(label.value)) && (
                <p className="text-red-500 text-xs mt-1">Each label must be lowercase, alphanumeric with hyphens or underscores only</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmAddToDatabase} disabled={selectedLabels.length === 0}>
                Add to Database
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add All Patterns Dialog */}
      <Dialog open={showAddAllDialog} onOpenChange={setShowAddAllDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add All Patterns to Database</DialogTitle>
            <DialogDescription>
              Select labels for all {results.length} patterns before adding them to the database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Patterns to add:</label>
              <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-muted rounded">
                {results.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result.pattern} <span className="text-muted-foreground">({result.start}-{result.end})</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Labels *</label>
              <CreatableSelect
                isMulti
                value={selectedLabels}
                onChange={setSelectedLabels}
                options={labelOptions}
                styles={selectStyles}
                placeholder="Select or create labels..."
                className="react-select-container"
                classNamePrefix="react-select"
                formatCreateLabel={(inputValue) => `Create "${inputValue.toLowerCase().replace(/[^a-z0-9_-]/g, '')}"`}
                isValidNewOption={(inputValue) => {
                  const cleanValue = inputValue.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                  return cleanValue.length > 0 && validateSlug(cleanValue);
                }}
                getNewOptionData={(inputValue) => ({
                  value: inputValue.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                  label: inputValue.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                  __isNew__: true
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Select existing labels or type to create new ones. All patterns will be added with these labels.
              </p>
              {uniqueLabels.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  💡 Existing labels: {uniqueLabels.join(', ')}
                </p>
              )}
              {selectedLabels.length > 0 && !selectedLabels.every(label => validateSlug(label.value)) && (
                <p className="text-red-500 text-xs mt-1">Each label must be lowercase, alphanumeric with hyphens or underscores only</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddAllDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmAddAllToDatabase} disabled={selectedLabels.length === 0}>
                Add All to Database
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      </div>
    </div>
  );
};

export default PatternGenerator;

import React, { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import BackgroundLogo from "@/components/BackgroundLogo";
import SavedPatterns from "@/components/SavedPatterns";
import { apiCall, API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trash2, Plus, Info, Download, Copy, Edit, Search, FileInput } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreatableSelect from 'react-select/creatable';

const Home = () => {
  const { toast } = useToast();
  const savedPatternsRef = useRef(null);

  // Pattern state
  const [patterns, setPatterns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    label: '',
    pattern: '',
    description: ''
  });
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uniqueLabels, setUniqueLabels] = useState([]);
  const [labelOptions, setLabelOptions] = useState([]);
  const [editingPattern, setEditingPattern] = useState(null);
  const [editFormData, setEditFormData] = useState({
    label: '',
    pattern: '',
    description: ''
  });
  const [editSelectedLabels, setEditSelectedLabels] = useState([]);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [matchingPattern, setMatchingPattern] = useState(null);
  const [matchExamples, setMatchExamples] = useState([]);

  // Fetch patterns
  const fetchPatterns = async () => {
    try {
      const response = await apiCall('/data');
      const data = await response.json();
      setPatterns(data);
      
      // Extract unique labels for autocomplete (handle comma-separated labels)
      const allLabels = data.flatMap(pattern => 
        pattern.label ? pattern.label.split(',').map(label => label.trim()).filter(Boolean) : []
      );
      const labels = [...new Set(allLabels)];
      setUniqueLabels(labels);
      
      // Create options for react-select
      const options = labels.map(label => ({ value: label, label: label }));
      setLabelOptions(options);
      
      setIsLoading(false);
    } catch (error) {
      console.error(error);
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert selected labels to comma-separated string
    const labelString = selectedLabels.map(label => label.value).join(',');
    
    if (!labelString.trim() || !formData.pattern.trim()) {
      toast({
        title: "Validation Error",
        description: "Label and pattern are required.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (!validateLabels(labelString)) {
      toast({
        title: "Invalid Labels",
        description: "Each label must be in slug format (lowercase, alphanumeric, hyphens/underscores only).",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiCall('/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          label: labelString
        })
      });

      if (response.ok) {
        toast({
          title: "Pattern Added",
          description: "E164 pattern has been successfully added.",
          duration: 3000,
        });
        setFormData({ label: '', pattern: '', description: '' });
        setSelectedLabels([]);
        fetchPatterns();
        // Refresh SavedPatterns component
        if (savedPatternsRef.current) {
          savedPatternsRef.current.refresh();
        }
      } else {
        // Try to get detailed error from response
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details ? errorData.details.join(', ') : 'Failed to add pattern';
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add pattern. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
    const cfgUrl = `${window.location.origin}/api/config-files/${label}.cfg`;
    window.open(cfgUrl, '_blank');
  };

  // Handle copying .cfg URL to clipboard
  const handleCopyLink = async (label) => {
    const cfgUrl = `${window.location.origin}/api/config-files/${label}.cfg`;
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

  // Handle edit pattern
  const handleEdit = (pattern) => {
    setEditingPattern(pattern);
    setEditFormData({
      label: pattern.label || '',
      pattern: pattern.pattern || '',
      description: pattern.description || ''
    });
    
    // Convert comma-separated labels to react-select format
    const labels = pattern.label ? pattern.label.split(',').map(label => label.trim()).filter(Boolean) : [];
    const editOptions = labels.map(label => ({ value: label, label: label }));
    setEditSelectedLabels(editOptions);
  };

  // Handle edit form input changes (for non-label fields)
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Convert selected labels to comma-separated string
    const editLabelString = editSelectedLabels.map(label => label.value).join(',');
    
    if (!editLabelString.trim() || !editFormData.pattern.trim()) {
      toast({
        title: "Validation Error",
        description: "Labels and pattern are required.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (!validateLabels(editLabelString)) {
      toast({
        title: "Invalid Labels",
        description: "Each label must be in slug format (lowercase, alphanumeric, hyphens/underscores only).",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    setIsEditSubmitting(true);
    try {
      const response = await apiCall(`/data/${editingPattern.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          label: editLabelString
        })
      });

      if (response.ok) {
        toast({
          title: "Pattern Updated",
          description: "E164 pattern has been successfully updated.",
          duration: 3000,
        });
        setEditingPattern(null);
        setEditFormData({ label: '', pattern: '', description: '' });
        setEditSelectedLabels([]);
        fetchPatterns();
        // Refresh SavedPatterns component
        if (savedPatternsRef.current) {
          savedPatternsRef.current.refresh();
        }
      } else {
        // Try to get detailed error from response
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details ? errorData.details.join(', ') : 'Failed to update pattern';
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update pattern. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Handle showing pattern matches
  const handleShowMatches = (pattern) => {
    setMatchingPattern(pattern);
    const examples = generatePatternExamples(pattern.pattern);
    setMatchExamples(examples);
  };

  // Generate example numbers that match the E164 pattern
  const generatePatternExamples = (pattern) => {
    const examples = [];
    let workingPattern = pattern;

    try {
      // Handle simple patterns with dots
      if (workingPattern.includes('.')) {
        const basePattern = workingPattern.replace(/\./g, '0');
        examples.push(basePattern);
        
        // Add a few variations
        if (workingPattern.match(/\./g)?.length >= 3) {
          examples.push(workingPattern.replace(/\./g, () => Math.floor(Math.random() * 10).toString()));
          examples.push(workingPattern.replace(/\./g, () => Math.floor(Math.random() * 10).toString()));
        }
      }

      // Handle bracket ranges [2-9]
      const bracketMatches = workingPattern.match(/\[([^\]]+)\]/g);
      if (bracketMatches) {
        bracketMatches.forEach(bracket => {
          const content = bracket.slice(1, -1);
          let replacement;
          
          if (content.includes('-')) {
            // Range like [2-9]
            const [start, end] = content.split('-');
            const startCode = start.charCodeAt(0);
            const endCode = end.charCodeAt(0);
            replacement = String.fromCharCode(startCode + Math.floor(Math.random() * (endCode - startCode + 1)));
          } else if (content.includes(',')) {
            // List like [1,3,5]
            const options = content.split(',');
            replacement = options[Math.floor(Math.random() * options.length)];
          } else {
            replacement = content[0] || '0';
          }
          
          workingPattern = workingPattern.replace(bracket, replacement);
        });
        examples.push(workingPattern);
      }

      // Handle parentheses groups (optional)
      if (workingPattern.includes('(') && workingPattern.includes(')')) {
        // Add version with parentheses content
        examples.push(workingPattern.replace(/[()]/g, ''));
        // Add version without parentheses content
        examples.push(workingPattern.replace(/\([^)]*\)/g, ''));
      }

      // Handle T (variable length)
      if (workingPattern.includes('T')) {
        const baseWithoutT = workingPattern.replace('T', '');
        examples.push(baseWithoutT + '123456');
        examples.push(baseWithoutT + '1234567890');
        examples.push(baseWithoutT + '555');
      }

    } catch (error) {
      // Fallback for complex patterns
      examples.push('Pattern too complex to generate examples');
    }

    // If no examples generated, add a generic one
    if (examples.length === 0) {
      examples.push('Unable to generate examples for this pattern');
    }

    // Remove duplicates and limit to 5 examples
    return [...new Set(examples)].slice(0, 5);
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

  // Handle copying example patterns
  const handleCopyExample = (example) => {
    navigator.clipboard.writeText(example);
    toast({
      title: "Copied",
      description: "Example pattern copied to clipboard",
      duration: 2000,
    });
  };

  // Handle auto-filling pattern input
  const handleAutoFillPattern = (example) => {
    setFormData(prev => ({ ...prev, pattern: example }));
    // Focus the pattern input field
    setTimeout(() => {
      const patternInput = document.querySelector('input[name="pattern"]');
      if (patternInput) {
        patternInput.focus();
        patternInput.select();
      }
    }, 100);
    toast({
      title: "Pattern Added",
      description: "Example pattern added to form",
      duration: 2000,
    });
  };

  // Validate E164 pattern
  const validateE164Pattern = (pattern) => {
    // Cisco E164 pattern validation based on accepted characters
    const validPattern = /^[0-9A-F#*.?+%()-\[\]^$,T]+$/;
    return validPattern.test(pattern) && pattern.length > 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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


  const wildcardExamples = [
    { char: '.', desc: 'Matches any single digit (0-9, A-F, *, #, +)', example: '2....' },
    { char: 'T', desc: 'Variable length match up to 32 digits', example: '9011T' },
    { char: '[1-5]', desc: 'Range of characters for single position', example: '[1-5]0000' },
    { char: '+', desc: 'At start: E164 number indicator', example: '+1919...' },
    { char: '?', desc: 'Preceding digit occurs zero or one time', example: '(206)?501...' },
    { char: '*', desc: 'Literal * (star) on keypad', example: '12345*' },
    { char: '#', desc: 'Literal # (pound) on keypad', example: '8675309#' }
  ];

  return (
    <div className="min-h-full w-full py-8 relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950">
      <BackgroundLogo />
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Cisco Cube E164 Pattern Map</h1>
          <p className="text-lg text-muted-foreground">Manage E164 patterns with Cisco dial-peer wildcards</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Add Pattern Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add E164 Pattern
              </CardTitle>
              <CardDescription>
                Create a new E164 pattern using Cisco dial-peer wildcards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                <div>
                  <label className="block text-sm font-medium mb-1">E164 Pattern *</label>
                  <Input
                    name="pattern"
                    value={formData.pattern}
                    onChange={handleInputChange}
                    placeholder="e.g., +1[2-9]..[2-9]......"
                    className={!validateE164Pattern(formData.pattern) && formData.pattern ? 'border-red-500' : ''}
                    required
                  />
                  {!validateE164Pattern(formData.pattern) && formData.pattern && (
                    <p className="text-red-500 text-xs mt-1">Invalid characters in pattern. Only use: 0-9, A-F, #, *, ., ?, +, %, (, ), -, [, ], ^, $, comma, T</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Optional description of what this pattern matches"
                    rows={3}
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Adding...' : 'Add Pattern'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Wildcard Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Wildcard Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {wildcardExamples.slice(0, 5).map((item, index) => (
                  <div key={index} className="border-b pb-2 last:border-b-0">
                    <div className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {item.char}
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{item.desc}</div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1">{item.example}</div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyExample(item.example)}
                          className="h-6 w-6 p-0 hover:bg-blue-50 dark:hover:bg-blue-950"
                          title="Copy example"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAutoFillPattern(item.example)}
                          className="h-6 w-6 p-0 hover:bg-green-50 dark:hover:bg-green-950 text-green-600 hover:text-green-700"
                          title="Add to pattern form"
                        >
                          <FileInput className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    View All Wildcards
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Complete Wildcard Reference</DialogTitle>
                    <DialogDescription>
                      All available wildcards for Cisco dial-peer E164 patterns
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {[
                        { char: '.', desc: 'Matches any single digit (0-9, A-F, *, #, +). Up to 15 dots per dial-peer.', example: '2...., 91[2-9]..[2-9]......' },
                        { char: 'T', desc: 'Variable length match up to 32 digits. Waits on inter-digit timeout (default 10 seconds).', example: '9011T' },
                        { char: '[1-5]', desc: 'Range of characters for single position. Use commas to break continuous strings.', example: '[1-5]0000, [2,5-8]0000' },
                        { char: '()', desc: 'Group characters in a set for pattern matching.', example: '9(258)7777' },
                        { char: '+', desc: 'At start of string: indicates E164 number. Elsewhere: one or more of preceding digit.', example: '+19191112222' },
                        { char: '?', desc: 'Preceding digit occurs zero or one time (optional digit).', example: '(206)?5015111' },
                        { char: '%', desc: 'Preceding digit occurs zero or more times (repeating digit).', example: '1%23456' },
                        { char: '*', desc: 'Literal * (star) on keypad - not a wildcard.', example: '12345*' },
                        { char: '#', desc: 'Literal # (pound) on keypad - not a wildcard.', example: '8675309#' },
                        { char: ',', desc: 'Inserts 1-second pause between digits during dialing.', example: '9,,,,,55591' },
                        { char: '^', desc: 'Indicates start of string (anchor to beginning).', example: '^8675309' },
                        { char: '$', desc: 'Indicates end of string (anchor to end).', example: '8675309$' },
                        { char: '-', desc: 'Defines range within square brackets.', example: '[5-9]1234' }
                      ].map((item, index) => (
                        <div key={index} className="border rounded p-3">
                          <div className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
                            {item.char}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">{item.desc}</div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-mono bg-muted px-2 py-1 rounded flex-1">{item.example}</div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyExample(item.example)}
                                className="h-6 w-6 p-0 hover:bg-blue-50 dark:hover:bg-blue-950"
                                title="Copy example"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAutoFillPattern(item.example)}
                                className="h-6 w-6 p-0 hover:bg-green-50 dark:hover:bg-green-950 text-green-600 hover:text-green-700"
                                title="Add to pattern form"
                              >
                                <FileInput className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📚 For complete documentation, see: 
                        <a 
                          href="https://www.cisco.com/c/en/us/support/docs/voice/ip-telephony-voice-over-ip-voip/211306-In-Depth-Explanation-of-Cisco-IOS-and-IO.html#toc-hId--2107954344" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                        >
                          Cisco IOS Dial-Peer Wildcards
                        </a>
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Saved E164 Patterns */}
        <SavedPatterns ref={savedPatternsRef} onPatternChange={fetchPatterns} />

        {/* Edit Pattern Dialog */}
        {editingPattern && (
          <Dialog open={!!editingPattern} onOpenChange={() => setEditingPattern(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit E164 Pattern</DialogTitle>
                <DialogDescription>
                  Update the pattern details below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Labels *</label>
                  <CreatableSelect
                    isMulti
                    value={editSelectedLabels}
                    onChange={setEditSelectedLabels}
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
                  {editSelectedLabels.length > 0 && !editSelectedLabels.every(label => validateSlug(label.value)) && (
                    <p className="text-red-500 text-xs mt-1">Each label must be lowercase, alphanumeric with hyphens or underscores only</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">E164 Pattern *</label>
                  <Input
                    name="pattern"
                    value={editFormData.pattern}
                    onChange={handleEditInputChange}
                    placeholder="e.g., +1[2-9]..[2-9]......"
                    className={!validateE164Pattern(editFormData.pattern) && editFormData.pattern ? 'border-red-500' : ''}
                    required
                  />
                  {!validateE164Pattern(editFormData.pattern) && editFormData.pattern && (
                    <p className="text-red-500 text-xs mt-1">Invalid characters in pattern. Only use: 0-9, A-F, #, *, ., ?, +, %, (, ), -, [, ], ^, $, comma, T</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditInputChange}
                    placeholder="Optional description of what this pattern matches"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingPattern(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isEditSubmitting}>
                    {isEditSubmitting ? 'Updating...' : 'Update Pattern'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Pattern Match Examples Dialog */}
        {matchingPattern && (
          <Dialog open={!!matchingPattern} onOpenChange={() => setMatchingPattern(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Pattern Match Examples</DialogTitle>
                <DialogDescription>
                  Example numbers that would match this E164 pattern
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Pattern:</label>
                  <div className="font-mono text-lg font-semibold text-blue-600 dark:text-blue-400 p-2 bg-muted rounded">
                    {matchingPattern.pattern}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Example Matches:</label>
                  <div className="space-y-2">
                    {matchExamples.map((example, index) => (
                      <div key={index} className="p-2 bg-green-50 dark:bg-green-950 rounded border-l-2 border-green-500">
                        <div className="font-mono text-sm">{example}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>💡 These are example numbers that would match this pattern.</p>
                  <p>Actual matches depend on the specific wildcard implementation.</p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setMatchingPattern(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Home;

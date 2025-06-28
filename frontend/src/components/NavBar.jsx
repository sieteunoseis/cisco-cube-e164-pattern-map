import { Link } from "react-router-dom";
import { NavigationMenu, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { useConfig } from '@/config/ConfigContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Home, Code, FileText, Calculator, Copy, Activity, Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Component() {
  const config = useConfig();
  const { toast } = useToast();
  const [patternMapNumber, setPatternMapNumber] = useState("101");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get current host for dynamic examples
  const currentHost = window.location.host;
  const protocol = window.location.protocol;
  const fullHost = `${protocol}//${currentHost}`;

  const handleCopyCommand = (command) => {
    navigator.clipboard.writeText(command);
    toast({
      title: "Copied",
      description: "Command copied to clipboard",
      duration: 2000,
    });
  };

  return (
    <nav className="sticky inset-x-0 top-0 z-50 bg-white shadow-sm px-4 md:px-6 dark:bg-black">
      <div className="flex justify-between h-14 items-center">
        <Link to={ config.brandingUrl ? config.brandingUrl : 'http://automate.builders' } className="font-semibold" target="_blank" rel="noopener noreferrer">
        <h1 className="scroll-m-20 text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl xl:text-4xl truncate max-w-[200px] sm:max-w-none">{ config.brandingName ? config.brandingName : 'Automate Builders' }</h1>
        </Link>
        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:block">
          <NavigationMenuList className="flex items-center gap-6">
            <NavigationMenuLink asChild>
              <Link to="/" className="flex items-center gap-2 hover:text-blue-600 transition-colors text-sm font-medium">
                <Home className="h-4 w-4" />
                E164 Pattern Map
              </Link>
            </NavigationMenuLink>
            
            <NavigationMenuLink asChild>
              <Link to="/pattern-generator" className="flex items-center gap-2 hover:text-blue-600 transition-colors text-sm font-medium">
                <Calculator className="h-4 w-4" />
                Pattern Generator
              </Link>
            </NavigationMenuLink>
            
            <NavigationMenuLink asChild>
              <Link to="/logs" className="flex items-center gap-2 hover:text-blue-600 transition-colors text-sm font-medium">
                <Activity className="h-4 w-4" />
                Download Logs
              </Link>
            </NavigationMenuLink>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-foreground hover:text-blue-600 text-sm font-medium h-auto p-2">
                  <Code className="h-4 w-4" />
                  Configuration Guide
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Cisco Router Configuration Guide</DialogTitle>
                  <DialogDescription>
                    How to configure E164 pattern maps on your Cisco router
                  </DialogDescription>
                </DialogHeader>
                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Label htmlFor="pattern-map-number" className="text-sm font-medium">
                    Pattern Map Number
                  </Label>
                  <Input
                    id="pattern-map-number"
                    type="text"
                    value={patternMapNumber}
                    onChange={(e) => setPatternMapNumber(e.target.value)}
                    placeholder="101"
                    className="mt-1 w-32"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    This number will be used in all configuration examples below
                  </p>
                </div>
                <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Basic Configuration</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand(`voice class e164-pattern-map ${patternMapNumber}\n url ${fullHost}/api/config-files/destination-pattern-map.cfg`)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Configure E164 pattern map</div>
                      <div>voice class e164-pattern-map <span className="text-yellow-400">{patternMapNumber}</span></div>
                      <div className="ml-2">url <span className="text-yellow-400">{fullHost}</span>/api/config-files/<span className="text-yellow-400">destination-pattern-map</span>.cfg</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Example</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand(`voice class e164-pattern-map ${patternMapNumber}\n url ${fullHost}/api/config-files/us-local.cfg`)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Example with your server</div>
                      <div>voice class e164-pattern-map <span className="text-yellow-400">{patternMapNumber}</span></div>
                      <div className="ml-2">url <span className="text-yellow-400">{fullHost}</span>/api/config-files/<span className="text-yellow-400">us-local</span>.cfg</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Apply to Dial Peer</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand(`dial-peer voice 1 voip\n voice-class e164-pattern-map ${patternMapNumber}\n session target ipv4:10.1.1.1`)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Apply pattern map to dial peer</div>
                      <div>dial-peer voice <span className="text-yellow-400">1</span> voip</div>
                      <div className="ml-2">voice-class e164-pattern-map <span className="text-yellow-400">{patternMapNumber}</span></div>
                      <div className="ml-2">session target ipv4:<span className="text-yellow-400">10.1.1.1</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Reload Pattern Map</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand(`voice class e164-pattern-map load ${patternMapNumber}`)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Manually reload patterns from URL</div>
                      <div>voice class e164-pattern-map load <span className="text-yellow-400">{patternMapNumber}</span></div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <strong>Example output:</strong>
                    </div>
                    <div className="bg-slate-800 text-gray-300 p-4 rounded-lg font-mono text-sm overflow-x-auto mt-1">
                      <div>url http://&lt;http-host&gt;/config-files/us-local-numbers.cfg loaded successfully</div>
                      <br />
                      <div>All e164 patterns are valid</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Automatic Reload (Kron Scheduler)</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand(`!\nkron occurrence ReloadE164PatternMaps in 15 recurring\n policy-list ReloadE164PatternMaps\n!\nkron policy-list ReloadE164PatternMaps\n cli voice class e164-pattern-map load ${patternMapNumber}\n!`)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Schedule automatic reload every 15 minutes</div>
                      <div>!</div>
                      <div>kron occurrence ReloadE164PatternMaps in <span className="text-yellow-400">15</span> recurring</div>
                      <div> policy-list ReloadE164PatternMaps</div>
                      <div>!</div>
                      <div>kron policy-list ReloadE164PatternMaps</div>
                      <div> cli voice class e164-pattern-map load <span className="text-yellow-400">{patternMapNumber}</span></div>
                      <div>!</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Verify Configuration</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand(`show voice class e164-pattern-map ${patternMapNumber}`)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Check pattern map status</div>
                      <div>show voice class e164-pattern-map <span className="text-yellow-400">{patternMapNumber}</span></div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <strong>Example output:</strong>
                    </div>
                    <div className="bg-slate-800 text-gray-300 p-4 rounded-lg font-mono text-sm overflow-x-auto mt-1">
                      <div>e164-pattern-map 101</div>
                      <div>-----------------------------------------</div>
                      <div>  It has 2 entries</div>
                      <div>  It is populated from url http://&lt;http-host&gt;/config-files/us-local-numbers.cfg.</div>
                      <div>  Map is valid.</div>
                      <br />
                      <div>E164 pattern</div>
                      <div>-------------------</div>
                      <div className="text-white">+1503808[2-5]...</div>
                      <div className="text-white">9(258)7777</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Verify Kron Schedule</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand("show kron schedule")}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Check kron scheduler status</div>
                      <div>show kron schedule</div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <strong>Example output:</strong>
                    </div>
                    <div className="bg-slate-800 text-gray-300 p-4 rounded-lg font-mono text-sm overflow-x-auto mt-1">
                      <div>Kron Occurrence Schedule</div>
                      <div className="text-white">ReloadE164PatternMaps inactive, will run again in 0 days 00:14:09</div>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Tips:</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Replace <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">101</code> with your desired pattern map number</li>
                      <li>• Replace <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">&lt;http-host&gt;</code> with your server's IP or hostname (including port if needed)</li>
                      <li>• Replace <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">destination-pattern-map</code> with your label name</li>
                      <li>• Use the copy button next to each label to get the exact URL</li>
                      <li>• Use <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">show voice class e164-pattern-map 101</code> to verify your configuration</li>
                      <li>• Use <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">voice class e164-pattern-map load 101</code> to manually reload patterns</li>
                      <li>• Use Kron scheduler for automatic reloads every 15 minutes</li>
                      <li>• Use <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">show kron schedule</code> to check when the next reload will occur</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </NavigationMenuList>
        </NavigationMenu>
        
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      
      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-black border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-2 space-y-2">
            <Link 
              to="/" 
              className="flex items-center gap-2 hover:text-blue-600 transition-colors text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="h-4 w-4" />
              E164 Pattern Map
            </Link>
            
            <Link 
              to="/pattern-generator" 
              className="flex items-center gap-2 hover:text-blue-600 transition-colors text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calculator className="h-4 w-4" />
              Pattern Generator
            </Link>
            
            <Link 
              to="/logs" 
              className="flex items-center gap-2 hover:text-blue-600 transition-colors text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Activity className="h-4 w-4" />
              Download Logs
            </Link>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-2 text-foreground hover:text-blue-600 text-sm font-medium h-auto p-2 w-full justify-start"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Code className="h-4 w-4" />
                  Configuration Guide
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Cisco Router Configuration Guide</DialogTitle>
                  <DialogDescription>
                    How to configure E164 pattern maps on your Cisco router
                  </DialogDescription>
                </DialogHeader>
                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Label htmlFor="pattern-map-number" className="text-sm font-medium">
                    Pattern Map Number
                  </Label>
                  <Input
                    id="pattern-map-number"
                    type="text"
                    value={patternMapNumber}
                    onChange={(e) => setPatternMapNumber(e.target.value)}
                    placeholder="101"
                    className="mt-1 w-32"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    This number will be used in all configuration examples below
                  </p>
                </div>
                <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Basic Configuration</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand(`voice class e164-pattern-map ${patternMapNumber}\n url ${fullHost}/api/config-files/destination-pattern-map.cfg`)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Configure E164 pattern map</div>
                      <div>voice class e164-pattern-map <span className="text-yellow-400">{patternMapNumber}</span></div>
                      <div className="ml-2">url <span className="text-yellow-400">{fullHost}</span>/api/config-files/<span className="text-yellow-400">destination-pattern-map</span>.cfg</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Example</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand(`voice class e164-pattern-map ${patternMapNumber}\n url ${fullHost}/api/config-files/us-local.cfg`)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Example with your server</div>
                      <div>voice class e164-pattern-map <span className="text-yellow-400">{patternMapNumber}</span></div>
                      <div className="ml-2">url <span className="text-yellow-400">{fullHost}</span>/api/config-files/<span className="text-yellow-400">us-local</span>.cfg</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Apply to Dial Peer</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand(`dial-peer voice 1 voip\n voice-class e164-pattern-map ${patternMapNumber}\n session target ipv4:10.1.1.1`)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Apply pattern map to dial peer</div>
                      <div>dial-peer voice <span className="text-yellow-400">1</span> voip</div>
                      <div className="ml-2">voice-class e164-pattern-map <span className="text-yellow-400">{patternMapNumber}</span></div>
                      <div className="ml-2">session target ipv4:<span className="text-yellow-400">10.1.1.1</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Reload Pattern Map</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand(`voice class e164-pattern-map load ${patternMapNumber}`)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Manually reload patterns from URL</div>
                      <div>voice class e164-pattern-map load <span className="text-yellow-400">{patternMapNumber}</span></div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <strong>Example output:</strong>
                    </div>
                    <div className="bg-slate-800 text-gray-300 p-4 rounded-lg font-mono text-sm overflow-x-auto mt-1">
                      <div>url http://&lt;http-host&gt;/config-files/us-local-numbers.cfg loaded successfully</div>
                      <br />
                      <div>All e164 patterns are valid</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Automatic Reload (Kron Scheduler)</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand(`!\nkron occurrence ReloadE164PatternMaps in 15 recurring\n policy-list ReloadE164PatternMaps\n!\nkron policy-list ReloadE164PatternMaps\n cli voice class e164-pattern-map load ${patternMapNumber}\n!`)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Schedule automatic reload every 15 minutes</div>
                      <div>!</div>
                      <div>kron occurrence ReloadE164PatternMaps in <span className="text-yellow-400">15</span> recurring</div>
                      <div> policy-list ReloadE164PatternMaps</div>
                      <div>!</div>
                      <div>kron policy-list ReloadE164PatternMaps</div>
                      <div> cli voice class e164-pattern-map load <span className="text-yellow-400">{patternMapNumber}</span></div>
                      <div>!</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Verify Configuration</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand(`show voice class e164-pattern-map ${patternMapNumber}`)}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Check pattern map status</div>
                      <div>show voice class e164-pattern-map <span className="text-yellow-400">{patternMapNumber}</span></div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <strong>Example output:</strong>
                    </div>
                    <div className="bg-slate-800 text-gray-300 p-4 rounded-lg font-mono text-sm overflow-x-auto mt-1">
                      <div>e164-pattern-map 101</div>
                      <div>-----------------------------------------</div>
                      <div>  It has 2 entries</div>
                      <div>  It is populated from url http://&lt;http-host&gt;/config-files/us-local-numbers.cfg.</div>
                      <div>  Map is valid.</div>
                      <br />
                      <div>E164 pattern</div>
                      <div>-------------------</div>
                      <div className="text-white">+1503808[2-5]...</div>
                      <div className="text-white">9(258)7777</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Verify Kron Schedule</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand("show kron schedule")}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Check kron scheduler status</div>
                      <div>show kron schedule</div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <strong>Example output:</strong>
                    </div>
                    <div className="bg-slate-800 text-gray-300 p-4 rounded-lg font-mono text-sm overflow-x-auto mt-1">
                      <div>Kron Occurrence Schedule</div>
                      <div className="text-white">ReloadE164PatternMaps inactive, will run again in 0 days 00:14:09</div>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Tips:</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Replace <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">101</code> with your desired pattern map number</li>
                      <li>• Replace <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">&lt;http-host&gt;</code> with your server's IP or hostname (including port if needed)</li>
                      <li>• Replace <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">destination-pattern-map</code> with your label name</li>
                      <li>• Use the copy button next to each label to get the exact URL</li>
                      <li>• Use <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">show voice class e164-pattern-map 101</code> to verify your configuration</li>
                      <li>• Use <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">voice class e164-pattern-map load 101</code> to manually reload patterns</li>
                      <li>• Use Kron scheduler for automatic reloads every 15 minutes</li>
                      <li>• Use <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">show kron schedule</code> to check when the next reload will occur</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </nav>
  );
}

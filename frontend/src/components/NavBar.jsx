import { Link } from "react-router-dom";
import { NavigationMenu, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { useConfig } from '@/config/ConfigContext';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Home, Code, FileText, Calculator, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Component() {
  const config = useConfig();
  const { toast } = useToast();

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
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-2xl">{ config.brandingName ? config.brandingName : 'Automate Builders' }</h1>
        </Link>
        <NavigationMenu>
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
                <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Basic Configuration</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand("voice class e164-pattern-map XXX\n url http://http-host/config-files/destination-pattern-map.cfg")}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Configure E164 pattern map</div>
                      <div>voice class e164-pattern-map <span className="text-yellow-400">XXX</span></div>
                      <div className="ml-2">url http://<span className="text-yellow-400">http-host</span>/config-files/<span className="text-yellow-400">destination-pattern-map</span>.cfg</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Example</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand("voice class e164-pattern-map 101\n url http://<http-host>/config-files/us-local.cfg")}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Example with your server</div>
                      <div>voice class e164-pattern-map <span className="text-yellow-400">101</span></div>
                      <div className="ml-2">url http://<span className="text-yellow-400">&lt;http-host&gt;</span>/config-files/<span className="text-yellow-400">us-local</span>.cfg</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Apply to Dial Peer</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand("dial-peer voice 1 voip\n voice-class e164-pattern-map 101\n session target ipv4:10.1.1.1")}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Apply pattern map to dial peer</div>
                      <div>dial-peer voice <span className="text-yellow-400">1</span> voip</div>
                      <div className="ml-2">voice-class e164-pattern-map <span className="text-yellow-400">101</span></div>
                      <div className="ml-2">session target ipv4:<span className="text-yellow-400">10.1.1.1</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Reload Pattern Map</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand("voice class e164-pattern-map load 101")}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Manually reload patterns from URL</div>
                      <div>voice class e164-pattern-map load <span className="text-yellow-400">101</span></div>
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
                        onClick={() => handleCopyCommand("kron occurrence ReloadE164PatternMaps at 6:00 recurring\n!\n\nkron policy-list ReloadE164PatternMaps\n cli voice class e164-pattern-map load 101\n!")}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Schedule automatic reload at 6:00 AM daily</div>
                      <div>kron occurrence ReloadE164PatternMaps at <span className="text-yellow-400">6:00</span> recurring</div>
                      <div>!</div>
                      <br />
                      <div>kron policy-list ReloadE164PatternMaps</div>
                      <div> cli voice class e164-pattern-map load <span className="text-yellow-400">101</span></div>
                      <div>!</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Verify Configuration</h3>
                    <div className="relative bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCommand("show voice class e164-pattern-map 101")}
                        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-slate-700 text-gray-400 hover:text-white"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <div className="text-gray-400"># Check pattern map status</div>
                      <div>show voice class e164-pattern-map <span className="text-yellow-400">101</span></div>
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
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Tips:</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Replace <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">101</code> with your desired pattern map number</li>
                      <li>• Replace <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">&lt;http-host&gt;</code> with your server's IP or hostname (including port if needed)</li>
                      <li>• Replace <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">destination-pattern-map</code> with your label name</li>
                      <li>• Use the copy button next to each label to get the exact URL</li>
                      <li>• Use <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">show voice class e164-pattern-map 101</code> to verify your configuration</li>
                      <li>• Use <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">voice class e164-pattern-map load 101</code> to manually reload patterns</li>
                      <li>• Use Kron scheduler for automatic daily reloads at a specific time</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
}

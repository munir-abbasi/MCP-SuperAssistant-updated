import React from 'react';
import { useUserPreferences } from '@src/hooks';
import { Card, CardContent } from '@src/components/ui/card';
import { Typography } from '../ui';
import { AutomationService } from '@src/services/automation.service';
import { cn } from '@src/lib/utils';
import { createLogger } from '@extension/shared/lib/logger';

const logger = createLogger('Settings');

const DEFAULT_DELAYS = {
  autoInsertDelay: 2,
  autoSubmitDelay: 2,
  autoExecuteDelay: 2,
  mcpTimeout: 60000,
} as const;

const Settings: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();

  // Handle number input changes
  const handleNumberChange = (
    key: 'autoInsertDelay' | 'autoSubmitDelay' | 'autoExecuteDelay' | 'mcpTimeout',
    value: string,
  ) => {
    const num = Math.max(0, parseInt(value) || 0); // Ensure non-negative integer
    logger.debug(`${key} changed to: ${num}`);

    // Update user preferences store
    updatePreferences({ [key]: num });

    // Store in localStorage for backward compatibility if needed
    try {
      const stored = JSON.parse(localStorage.getItem('mcpDelaySettings') || '{}');
      localStorage.setItem(
        'mcpDelaySettings',
        JSON.stringify({
          ...stored,
          [key]: num,
        }),
      );
    } catch (error) {
      logger.error('[Settings] Error storing settings:', error);
    }

    // Update automation state on window
    AutomationService.getInstance().updateAutomationStateOnWindow().catch(console.error);
  };

  // Handle boolean toggles
  const handleToggle = (key: 'autoInsert' | 'autoSubmit' | 'autoExecute', checked: boolean) => {
    logger.debug(`${key} toggled to: ${checked}`);
    updatePreferences({ [key]: checked });
    AutomationService.getInstance().updateAutomationStateOnWindow().catch(console.error);
  };

  // Load stored settings on component mount
  React.useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mcpDelaySettings') || '{}');
      if (Object.keys(stored).length === 0) {
        updatePreferences(DEFAULT_DELAYS);
        localStorage.setItem('mcpDelaySettings', JSON.stringify(DEFAULT_DELAYS));
      } else {
        updatePreferences(stored);
      }
    } catch (error) {
      logger.error('[Settings] Error loading stored settings:', error);
    }
  }, [updatePreferences]);

  return (
    <div className="p-4 space-y-4">
      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 mb-4">
        <CardContent className="p-4">
          <Typography variant="h4" className="mb-4 text-slate-700 dark:text-slate-300">
            Automation Features
          </Typography>

          <div className="space-y-4">
            {/* Auto Insert */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Auto Insert</label>
                <p className="text-xs text-slate-500 dark:text-slate-400">Automatically insert suggested content</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.autoInsert || false}
                onChange={e => handleToggle('autoInsert', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Auto Submit */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Auto Submit</label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Automatically submit the form after insertion
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.autoSubmit || false}
                onChange={e => handleToggle('autoSubmit', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            {/* Auto Execute */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Auto Execute</label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Automatically execute functions without asking
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.autoExecute || false}
                onChange={e => handleToggle('autoExecute', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <CardContent className="p-4">
          <Typography variant="h4" className="mb-4 text-slate-700 dark:text-slate-300">
            Delays & Timeouts
          </Typography>

          <div className="space-y-4">
            {/* Auto Insert Delay */}
            <div>
              <label
                htmlFor="auto-insert-delay"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Auto Insert Delay (seconds)
              </label>
              <input
                id="auto-insert-delay"
                type="number"
                min="0"
                value={preferences.autoInsertDelay || 0}
                onChange={e => handleNumberChange('autoInsertDelay', e.target.value)}
                className={cn(
                  'w-full p-2 text-sm border rounded-md',
                  'bg-white dark:bg-slate-900',
                  'border-slate-300 dark:border-slate-600',
                  'text-slate-900 dark:text-slate-100',
                )}
              />
            </div>

            {/* Auto Submit Delay */}
            <div>
              <label
                htmlFor="auto-submit-delay"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Auto Submit Delay (seconds)
              </label>
              <input
                id="auto-submit-delay"
                type="number"
                min="0"
                value={preferences.autoSubmitDelay || 0}
                onChange={e => handleNumberChange('autoSubmitDelay', e.target.value)}
                className={cn(
                  'w-full p-2 text-sm border rounded-md',
                  'bg-white dark:bg-slate-900',
                  'border-slate-300 dark:border-slate-600',
                  'text-slate-900 dark:text-slate-100',
                )}
              />
            </div>

            {/* Auto Execute Delay */}
            <div>
              <label
                htmlFor="auto-execute-delay"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Auto Execute Delay (seconds)
              </label>
              <input
                id="auto-execute-delay"
                type="number"
                min="0"
                value={preferences.autoExecuteDelay || 0}
                onChange={e => handleNumberChange('autoExecuteDelay', e.target.value)}
                className={cn(
                  'w-full p-2 text-sm border rounded-md',
                  'bg-white dark:bg-slate-900',
                  'border-slate-300 dark:border-slate-600',
                  'text-slate-900 dark:text-slate-100',
                )}
              />
            </div>

            {/* MCP Timeout */}
            <div>
              <label
                htmlFor="mcp-timeout"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                MCP Timeout (milliseconds)
              </label>
              <input
                id="mcp-timeout"
                type="number"
                min="1000"
                step="1000"
                value={preferences.mcpTimeout ?? 60000}
                onChange={e => handleNumberChange('mcpTimeout', e.target.value)}
                className={cn(
                  'w-full p-2 text-sm border rounded-md',
                  'bg-white dark:bg-slate-900',
                  'border-slate-300 dark:border-slate-600',
                  'text-slate-900 dark:text-slate-100',
                )}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Max time to wait for a tool call (default 60000ms)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

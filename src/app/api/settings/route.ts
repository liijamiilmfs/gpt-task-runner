import * as fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';

// Settings file path
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

// Default settings
const DEFAULT_SETTINGS = {
  apiKeys: {
    openai: '',
    anthropic: '',
  },
  database: {
    path: 'data/gpt-task-runner.db',
    backupEnabled: true,
    backupInterval: 'daily',
  },
  notifications: {
    email: '',
    webhook: '',
    enabled: true,
  },
  general: {
    timezone: 'UTC',
    language: 'en',
    theme: 'light',
  },
  security: {
    sessionTimeout: 30,
    requireAuth: false,
    logLevel: 'info',
  },
};

// Helper function to ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Helper function to read settings from file
function readSettings() {
  try {
    ensureDataDirectory();
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error reading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Helper function to write settings to file
function writeSettings(settings: typeof DEFAULT_SETTINGS) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing settings:', error);
    return false;
  }
}

// GET /api/settings - Get current settings
export async function GET() {
  try {
    const settings = readSettings();

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'E_FETCH_SETTINGS',
          message: 'Failed to fetch settings',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/settings - Update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate settings structure
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'E_VALIDATION',
            message: 'Invalid settings data',
            details: 'Settings must be a valid object',
          },
        },
        { status: 400 }
      );
    }

    // Merge with existing settings to preserve any missing fields
    const currentSettings = readSettings();
    const updatedSettings = { ...currentSettings, ...body };

    // Write settings to file
    const success = writeSettings(updatedSettings);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'E_SAVE_SETTINGS',
            message: 'Failed to save settings',
            details: 'Could not write settings to file',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'E_SAVE_SETTINGS',
          message: 'Failed to save settings',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

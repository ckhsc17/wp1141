import { NextRequest, NextResponse } from 'next/server';
import { SystemSettingsRepository } from '@/repositories/systemSettingsRepository';

const settingsRepo = new SystemSettingsRepository();

// GET /api/admin/settings - Get token limit settings
export async function GET() {
  try {
    const settings = await settingsRepo.getSettings();

    return NextResponse.json({
      regularTokenLimit: settings.regularTokenLimit,
      vipTokenLimit: settings.vipTokenLimit,
    });
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings - Update token limit settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regularTokenLimit, vipTokenLimit } = body;

    const updates: { regularTokenLimit?: number; vipTokenLimit?: number } = {};

    if (regularTokenLimit !== undefined) {
      const regularLimit = parseInt(String(regularTokenLimit), 10);
      if (isNaN(regularLimit) || regularLimit <= 0) {
        return NextResponse.json(
          { error: 'Regular token limit must be a positive number' },
          { status: 400 }
        );
      }
      updates.regularTokenLimit = regularLimit;
    }

    if (vipTokenLimit !== undefined) {
      const vipLimit = parseInt(String(vipTokenLimit), 10);
      if (isNaN(vipLimit) || vipLimit <= 0) {
        return NextResponse.json(
          { error: 'VIP token limit must be a positive number' },
          { status: 400 }
        );
      }
      updates.vipTokenLimit = vipLimit;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid settings to update' },
        { status: 400 }
      );
    }

    const updated = await settingsRepo.updateSettings(updates);

    return NextResponse.json({
      regularTokenLimit: updated.regularTokenLimit,
      vipTokenLimit: updated.vipTokenLimit,
    });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

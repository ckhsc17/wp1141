import { prisma } from '@/repositories/prismaClient';

export interface SystemSettings {
  regularTokenLimit: number;
  vipTokenLimit: number;
}

export class SystemSettingsRepository {
  private readonly SINGLETON_ID = 'singleton';

  /**
   * Get system settings (creates default if not exists)
   * Falls back to env vars or defaults if table doesn't exist yet
   */
  async getSettings(): Promise<SystemSettings> {
    const DEFAULT_REGULAR_TOKEN_LIMIT = 10;
    const DEFAULT_VIP_TOKEN_LIMIT = 200;

    const regularLimit = parseInt(
      process.env.DEFAULT_REGULAR_TOKEN_LIMIT || String(DEFAULT_REGULAR_TOKEN_LIMIT),
      10
    );
    const vipLimit = parseInt(
      process.env.DEFAULT_VIP_TOKEN_LIMIT || String(DEFAULT_VIP_TOKEN_LIMIT),
      10
    );

    try {
      // Try to get from database
      const settings = await prisma.systemSettings.findUnique({
        where: { id: this.SINGLETON_ID },
      });

      if (settings) {
        return {
          regularTokenLimit: settings.regularTokenLimit,
          vipTokenLimit: settings.vipTokenLimit,
        };
      }

      // If not exists, try to create with defaults
      try {
        const created = await prisma.systemSettings.create({
          data: {
            id: this.SINGLETON_ID,
            regularTokenLimit: regularLimit,
            vipTokenLimit: vipLimit,
          },
        });

        return {
          regularTokenLimit: created.regularTokenLimit,
          vipTokenLimit: created.vipTokenLimit,
        };
      } catch (createError: any) {
        // If create fails (e.g., table doesn't exist), fallback to defaults
        // This can happen if migration hasn't been run yet
        if (createError.code === 'P2021' || createError.code === 'P2001') {
          // Table doesn't exist, return defaults
          return {
            regularTokenLimit: regularLimit,
            vipTokenLimit: vipLimit,
          };
        }
        throw createError;
      }
    } catch (error: any) {
      // If table doesn't exist (P2021), fallback to defaults
      if (error.code === 'P2021' || error.code === 'P2001') {
        return {
          regularTokenLimit: regularLimit,
          vipTokenLimit: vipLimit,
        };
      }
      // For other errors, still fallback to defaults but log the error
      console.warn('Failed to get system settings from database, using defaults:', error.message);
      return {
        regularTokenLimit: regularLimit,
        vipTokenLimit: vipLimit,
      };
    }
  }

  /**
   * Update system settings
   * Falls back to returning defaults if table doesn't exist yet
   */
  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const DEFAULT_REGULAR_TOKEN_LIMIT = 10;
    const DEFAULT_VIP_TOKEN_LIMIT = 200;

    try {
      const updated = await prisma.systemSettings.upsert({
        where: { id: this.SINGLETON_ID },
        update: {
          ...(settings.regularTokenLimit !== undefined && {
            regularTokenLimit: settings.regularTokenLimit,
          }),
          ...(settings.vipTokenLimit !== undefined && {
            vipTokenLimit: settings.vipTokenLimit,
          }),
        },
        create: {
          id: this.SINGLETON_ID,
          regularTokenLimit: settings.regularTokenLimit || DEFAULT_REGULAR_TOKEN_LIMIT,
          vipTokenLimit: settings.vipTokenLimit || DEFAULT_VIP_TOKEN_LIMIT,
        },
      });

      return {
        regularTokenLimit: updated.regularTokenLimit,
        vipTokenLimit: updated.vipTokenLimit,
      };
    } catch (error: any) {
      // If table doesn't exist, return the settings that were attempted to be saved
      if (error.code === 'P2021' || error.code === 'P2001') {
        const regularLimit = parseInt(
          process.env.DEFAULT_REGULAR_TOKEN_LIMIT || String(DEFAULT_REGULAR_TOKEN_LIMIT),
          10
        );
        const vipLimit = parseInt(
          process.env.DEFAULT_VIP_TOKEN_LIMIT || String(DEFAULT_VIP_TOKEN_LIMIT),
          10
        );

        // Return attempted values or defaults
        return {
          regularTokenLimit: settings.regularTokenLimit ?? regularLimit,
          vipTokenLimit: settings.vipTokenLimit ?? vipLimit,
        };
      }
      throw error;
    }
  }
}

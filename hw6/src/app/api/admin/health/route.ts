import { NextRequest, NextResponse } from 'next/server';
import { HealthService } from '@/admin/services/healthService';
import { logger } from '@/utils/logger';

const healthService = new HealthService();

// Simple in-memory metrics store (in production, use a proper metrics database)
const metricsStore = {
  requests: [] as Array<{ timestamp: number; duration: number; success: boolean }>,
  maxSize: 1000, // Keep last 1000 requests
};

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  let success = true;

  try {
    const [healthStatus, performanceMetrics] = await Promise.all([
      healthService.checkHealth(),
      healthService.getPerformanceMetrics(),
    ]);

    const duration = Date.now() - startTime;

    // Record metrics
    metricsStore.requests.push({
      timestamp: Date.now(),
      duration,
      success: true,
    });

    // Keep only last maxSize requests
    if (metricsStore.requests.length > metricsStore.maxSize) {
      metricsStore.requests = metricsStore.requests.slice(-metricsStore.maxSize);
    }

    logger.info('Health check completed', { duration, status: healthStatus.status });

    return NextResponse.json({
      health: healthStatus,
      performance: {
        ...performanceMetrics,
        // Calculate real-time metrics from store
        averageResponseTime: calculateAverageResponseTime(),
        errorRate: calculateErrorRate(),
        totalRequests: metricsStore.requests.length,
        successfulRequests: metricsStore.requests.filter((r) => r.success).length,
        failedRequests: metricsStore.requests.filter((r) => !r.success).length,
      },
    });
  } catch (error) {
    success = false;
    const duration = Date.now() - startTime;

    // Record failed request
    metricsStore.requests.push({
      timestamp: Date.now(),
      duration,
      success: false,
    });

    if (metricsStore.requests.length > metricsStore.maxSize) {
      metricsStore.requests = metricsStore.requests.slice(-metricsStore.maxSize);
    }

    logger.error('Health check failed', {
      duration,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to check health' },
      { status: 500 }
    );
  }
}

function calculateAverageResponseTime(): number {
  if (metricsStore.requests.length === 0) return 0;
  const sum = metricsStore.requests.reduce((acc, r) => acc + r.duration, 0);
  return sum / metricsStore.requests.length;
}

function calculateErrorRate(): number {
  if (metricsStore.requests.length === 0) return 0;
  const failed = metricsStore.requests.filter((r) => !r.success).length;
  return failed / metricsStore.requests.length;
}


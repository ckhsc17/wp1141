import { prisma } from '@/repositories/prismaClient';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: {
    connected: boolean;
    responseTime?: number;
  };
  timestamp: string;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  errorRate: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

export class HealthService {
  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    let connected = false;
    let responseTime: number | undefined;

    try {
      await prisma.$queryRaw`SELECT 1`;
      connected = true;
      responseTime = Date.now() - startTime;
    } catch (error) {
      connected = false;
      responseTime = Date.now() - startTime;
    }

    const status: HealthStatus['status'] = connected
      ? responseTime && responseTime < 1000
        ? 'healthy'
        : 'degraded'
      : 'unhealthy';

    return {
      status,
      database: {
        connected,
        responseTime,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    // For now, return placeholder metrics
    // In production, this would query from a metrics database or log aggregation service
    return {
      averageResponseTime: 0,
      errorRate: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
    };
  }
}


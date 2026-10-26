// Scheduler Worker - BullMQ-based cron job processor for stream scheduling

import { Queue, Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { renderMetadata, StreamContext, MetadataTemplate, RenderedMetadata } from '@stream-engine/shared/utils/metadata-renderer';
import { StreamService } from '../services/stream.service.js';
import { config } from '../config/index.js';

export interface ScheduledStreamJob {
  streamId: string;
  scheduleId: string;
  userId: string;
}

export interface ScheduleJobData {
  streamId: string;
  scheduleId: string;
  titleTemplate: string;
  descriptionTemplate: string;
  tagsTemplate: string;
  genre?: string;
  mood?: string;
  maxDurationHours: number;
}

export interface AutoStopJobData {
  streamId: string;
}

type JobData = ScheduleJobData | AutoStopJobData;

const SCHEDULE_QUEUE_NAME = 'stream-schedule';
const MAX_CONCURRENT_JOBS = 3;

let scheduleQueue: Queue | null = null;
let scheduleWorker: Worker | null = null;
let redisClient: Redis | null = null;

/**
 * Get or create Redis client
 */
function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null as any,
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
      lazyConnect: true,
    });
    redisClient.connect().catch(() => {});
  }
  return redisClient;
}

/**
 * Initialize the schedule queue
 */
export function getScheduleQueue(): Queue {
  if (!scheduleQueue) {
    const redis = getRedisClient();
    scheduleQueue = new Queue(SCHEDULE_QUEUE_NAME, {
      connection: redis,
    });
  }
  return scheduleQueue;
}

/**
 * Build stream context for template rendering
 */
function buildStreamContext(stream: any, schedule: any): StreamContext {
  const now = new Date();
  return {
    date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: schedule.timezone }),
    playlistName: stream.name,
    currentVideo: stream.videoFiles?.[0] || stream.name,
    videoIndex: 0,
    totalVideos: stream.videoFiles?.length || 1,
    streamNumber: 1,
    currentViewers: 0,
    genre: stream.genre ?? undefined,
    mood: stream.mood ?? undefined,
    channelName: 'Channel',
    channelHandle: 'channel',
    startTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: schedule.timezone }),
  };
}

/**
 * Process a scheduled stream job
 */
async function processScheduleJob(
  job: { data: ScheduleJobData; id: string | number; name: string },
  prisma: PrismaClient,
  streamService: StreamService
): Promise<void> {
  const { streamId, scheduleId, titleTemplate, descriptionTemplate, tagsTemplate, genre, mood, maxDurationHours } = job.data;

  console.log(`[Scheduler] Processing job for stream ${streamId}, schedule ${scheduleId}`);

  // Get stream and schedule details
  const stream = await prisma.stream.findUnique({
    where: { id: streamId },
    include: { schedule: true, fxPreset: true, visualizer: true },
  });

  if (!stream) {
    throw new Error(`Stream ${streamId} not found`);
  }

  if (stream.status !== 'STOPPED') {
    console.log(`[Scheduler] Stream ${streamId} is not stopped (status: ${stream.status}), skipping`);
    return;
  }

  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule || !schedule.isActive) {
    console.log(`[Scheduler] Schedule ${scheduleId} not found or inactive`);
    return;
  }

  // Build context for template rendering
  const context = buildStreamContext(stream, schedule);

  // Render smart metadata
  const template: MetadataTemplate = {
    title: titleTemplate || stream.titleTemplate || stream.name,
    description: descriptionTemplate || stream.descriptionTemplate || '',
    tags: tagsTemplate || stream.tagsTemplate || '',
  };

  const metadata = renderMetadata(template, {
    ...context,
    genre: genre ?? stream.genre ?? undefined,
    mood: mood ?? stream.mood ?? undefined,
  });

  console.log(`[Scheduler] Rendered metadata:`, { title: metadata.title, tagsCount: metadata.tags.length });

  try {
    // Update stream with rendered metadata
    await prisma.stream.update({
      where: { id: streamId },
      data: {
        titleTemplate: metadata.title,
        descriptionTemplate: metadata.description,
        tagsTemplate: metadata.tags.join(','),
      },
    });

    // Start FFmpeg stream (no YouTube broadcast needed)
    const ffmpegResult = await streamService.start(streamId);
    if (!ffmpegResult.ok) {
      await prisma.stream.update({ where: { id: streamId }, data: { status: 'ERROR' } });
      throw new Error(ffmpegResult.error.message);
    }

    // Schedule auto-stop if maxDuration is set
    if (maxDurationHours && maxDurationHours > 0) {
      const stopDelay = maxDurationHours * 60 * 60 * 1000;
      console.log(`[Scheduler] Scheduling auto-stop in ${maxDurationHours} hours for stream ${streamId}`);
      
      // Use a delayed job for auto-stop
      const queue = getScheduleQueue();
      await queue.add(
        'auto-stop',
        { streamId },
        { delay: stopDelay, jobId: `autostop-${streamId}-${Date.now()}` }
      );
    }

    console.log(`[Scheduler] Stream ${streamId} started successfully`);

    // Log success
    await prisma.streamLog.create({
      data: {
        streamId,
        level: 'INFO',
        message: `Scheduled stream started: ${metadata.title}`,
        metadata: JSON.stringify({ scheduleId, metadata }),
      },
    });

  } catch (error) {
    console.error(`[Scheduler] Failed to start stream ${streamId}:`, error);
    
    await prisma.stream.update({
      where: { id: streamId },
      data: { status: 'ERROR', stoppedAt: new Date() },
    });

    await prisma.streamLog.create({
      data: {
        streamId,
        level: 'ERROR',
        message: `Failed to start scheduled stream: ${error instanceof Error ? error.message : String(error)}`,
        metadata: JSON.stringify({ scheduleId, error: String(error) }),
      },
    });

    throw error;
  }
}

/**
 * Process auto-stop job
 */
async function processAutoStopJob(
  job: { data: AutoStopJobData; id: string | number },
  prisma: PrismaClient,
  streamService: StreamService
): Promise<void> {
  const { streamId } = job.data;

  console.log(`[Scheduler] Auto-stop triggered for stream ${streamId}`);

  const stream = await prisma.stream.findUnique({ where: { id: streamId } });
  if (!stream || stream.status !== 'LIVE') {
    console.log(`[Scheduler] Stream ${streamId} not live, skipping auto-stop`);
    return;
  }

  try {
    // Stop the FFmpeg stream
    await streamService.stop(streamId);

    await prisma.streamLog.create({
      data: {
        streamId,
        level: 'INFO',
        message: `Scheduled stream auto-stopped after max duration`,
        metadata: JSON.stringify({ maxDurationHours: stream.maxDuration }),
      },
    });

    console.log(`[Scheduler] Stream ${streamId} auto-stopped successfully`);
  } catch (error) {
    console.error(`[Scheduler] Auto-stop failed for stream ${streamId}:`, error);
    throw error;
  }
}

/**
 * Initialize the scheduler worker
 */
export function initSchedulerWorker(
  prisma: PrismaClient,
  streamService: StreamService
): Worker {
  if (scheduleWorker) return scheduleWorker;

  scheduleWorker = new Worker(
    SCHEDULE_QUEUE_NAME,
    async (job: any) => {
      if (job.name === 'auto-stop') {
        return processAutoStopJob(job, prisma, streamService);
      }
      return processScheduleJob(job, prisma, streamService);
    },
    {
      connection: getRedisClient(),
    }
  );

  return scheduleWorker;
}

/**
 * Add recurring schedule jobs for active schedules
 * Uses upsertJobScheduler for BullMQ v5
 */
export async function scheduleRecurringJobs(prisma: PrismaClient): Promise<void> {
  const queue = getScheduleQueue();

  // Get all active schedules with their streams
  const schedules = await prisma.schedule.findMany({
    where: { isActive: true },
    include: {
      streams: {
        where: { status: 'STOPPED' },
        include: { fxPreset: true, visualizer: true },
      },
    },
  });

  for (const schedule of schedules) {
    for (const stream of schedule.streams) {
      const jobId = `schedule-${schedule.id}-stream-${stream.id}`;

      try {
        await (queue as any).upsertJobScheduler(
          jobId,
          {
            pattern: schedule.cronExpression,
            tz: schedule.timezone,
            startDate: schedule.startDate ? new Date(schedule.startDate) : new Date(),
            endDate: schedule.endDate ? new Date(schedule.endDate) : undefined,
          },
          {
            name: 'scheduled-stream',
            data: {
              streamId: stream.id,
              scheduleId: schedule.id,
              titleTemplate: stream.titleTemplate,
              descriptionTemplate: stream.descriptionTemplate,
              tagsTemplate: stream.tagsTemplate,
              genre: stream.genre,
              mood: stream.mood,
              maxDurationHours: stream.maxDuration || schedule.maxDuration || 0,
            },
            opts: {
              removeOnComplete: 50,
              removeOnFail: 20,
            },
          }
        );
        console.log(`[Scheduler] Added recurring job for stream ${stream.id} with cron: ${schedule.cronExpression}`);
      } catch (error) {
        console.error(`[Scheduler] Failed to add recurring job for stream ${stream.id}:`, error);
      }
    }
  }
}

/**
 * Remove a schedule's recurring jobs
 */
export async function removeScheduleJobs(scheduleId: string): Promise<void> {
  if (!scheduleQueue) return;

  try {
    const jobs = await (scheduleQueue as any).getJobSchedulers();
    for (const job of jobs) {
      if (job.id?.startsWith(`schedule-${scheduleId}-`)) {
        await (scheduleQueue as any).removeJobScheduler(job.id);
        console.log(`[Scheduler] Removed recurring job: ${job.id}`);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error removing jobs:', error);
  }
}

/**
 * Get scheduled jobs status
 */
export async function getScheduledJobsStatus(): Promise<{
  recurring: number;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}> {
  if (!scheduleQueue) {
    return { recurring: 0, waiting: 0, active: 0, completed: 0, failed: 0 };
  }

  try {
    const queue = scheduleQueue;
    const recurring = await (queue as any).getJobSchedulers();
    
    return {
      recurring: recurring?.length || 0,
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    };
  } catch (error) {
    console.error('[Scheduler] Error getting status:', error);
    return { recurring: 0, waiting: 0, active: 0, completed: 0, failed: 0 };
  }
}

/**
 * Shutdown scheduler
 */
export async function shutdownScheduler(): Promise<void> {
  if (scheduleWorker) {
    await scheduleWorker.close();
    scheduleWorker = null;
  }
  if (scheduleQueue) {
    await scheduleQueue.close();
    scheduleQueue = null;
  }
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

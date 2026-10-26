// Schedule Service

import { BaseService } from './base.service.js';
import { Prisma } from '@prisma/client';

export class ScheduleService extends BaseService {
  async list(query: { page: number; limit: number; isActive?: boolean; userId?: string }) {
    this.logger.info('ScheduleService.list called', { query });
    try {
      const where = {
        userId: query.userId || 'default-user',
        ...(query.isActive !== undefined && { isActive: query.isActive })
      };

      const [schedules, total] = await Promise.all([
        this.prisma.schedule.findMany({
          where,
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy: { createdAt: 'desc' },
          include: { streams: true }
        }),
        this.prisma.schedule.count({ where })
      ]);

      return { data: schedules, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
    } catch (error) {
      this.logger.error('Error in ScheduleService.list', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async create(userId: string, data: any) {
    this.logger.info('Creating schedule', { userId, name: data.name });
    const { streamIds, ...scheduleData } = data;
    return this.prisma.schedule.create({
      data: {
        ...scheduleData,
        userId,
        streams: { connect: streamIds?.map((id: string) => ({ id })) || [] }
      },
      include: { streams: true }
    });
  }

  async getById(id: string) {
    this.logger.info('Getting schedule by ID', { id });
    return this.prisma.schedule.findUnique({
      where: { id },
      include: { streams: true }
    });
  }

  async update(id: string, data: any) {
    this.logger.info('Updating schedule', { id });
    const { streamIds, ...scheduleData } = data;
    return this.prisma.schedule.update({
      where: { id },
      data: {
        ...scheduleData,
        ...(streamIds && { streams: { set: streamIds.map((id: string) => ({ id })) } })
      },
      include: { streams: true }
    });
  }

  async delete(id: string) {
    this.logger.info('Deleting schedule', { id });
    await this.prisma.schedule.delete({ where: { id } });
  }

  async toggle(id: string) {
    this.logger.info('Toggling schedule', { id });
    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) throw new Error('Schedule not found');
    return this.prisma.schedule.update({ where: { id }, data: { isActive: !schedule.isActive } });
  }

  async getDueSchedules() {
    return this.prisma.schedule.findMany({
      where: { isActive: true },
      include: { streams: { where: { status: 'STOPPED' } } }
    });
  }
}
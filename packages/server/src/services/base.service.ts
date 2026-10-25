// Base Service Class

import { FastifyInstance } from 'fastify';

export abstract class BaseService {
  constructor(protected app: FastifyInstance) {}

  protected get prisma() { return this.app.prisma; }
  protected get io() { return this.app.io; }
  protected get redis() { return this.app.redis; }
  protected get queues() { return this.app.queues; }
  protected get logger(): any { return this.app.log; }
  protected get config() { return this.app.config; }
  protected get encryption() { return this.app.encryption; }
}
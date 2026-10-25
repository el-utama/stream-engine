// Base Service Class
export class BaseService {
    app;
    constructor(app) {
        this.app = app;
    }
    get prisma() { return this.app.prisma; }
    get io() { return this.app.io; }
    get redis() { return this.app.redis; }
    get queues() { return this.app.queues; }
    get logger() { return this.app.log; }
    get config() { return this.app.config; }
    get encryption() { return this.app.encryption; }
}
//# sourceMappingURL=base.service.js.map
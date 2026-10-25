"use strict";
// Prisma Seed - Built-in FX Presets & Visualizers
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const constants_1 = require("@stream-engine/shared/constants");
const constants_2 = require("@stream-engine/shared/constants");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    // Create or get system user
    const systemUser = await prisma.user.upsert({
        where: { email: 'system@stream-engine.local' },
        update: {},
        create: {
            email: 'system@stream-engine.local',
            name: 'System',
        },
    });
    console.log(`  ✅ System user: ${systemUser.id}`);
    // Seed built-in FX presets
    for (const [key, preset] of Object.entries(constants_1.BUILTIN_FX_PRESETS)) {
        await prisma.fxPreset.upsert({
            where: { id: `builtin-${key}` },
            update: {
                name: preset.name,
                description: preset.description,
                filterGraph: '',
                videoFilters: JSON.stringify(preset.videoFilters),
                audioFilters: JSON.stringify(preset.audioFilters),
                intensity: preset.intensity,
                isBuiltIn: true,
            },
            create: {
                id: `builtin-${key}`,
                userId: systemUser.id,
                name: preset.name,
                description: preset.description,
                filterGraph: '',
                videoFilters: JSON.stringify(preset.videoFilters),
                audioFilters: JSON.stringify(preset.audioFilters),
                intensity: preset.intensity,
                isBuiltIn: true,
            },
        });
        console.log(`  ✅ FX Preset: ${preset.name}`);
    }
    // Seed built-in visualizers
    for (const [key, viz] of Object.entries(constants_2.BUILTIN_VISUALIZERS)) {
        await prisma.visualizer.upsert({
            where: { id: `builtin-${key}` },
            update: {
                name: viz.name,
                type: String(viz.type),
                config: JSON.stringify(viz.config),
                backgroundType: String(viz.backgroundType),
                backgroundConfig: JSON.stringify(viz.backgroundConfig),
                width: viz.width,
                height: viz.height,
                fps: viz.fps,
                isBuiltIn: true,
            },
            create: {
                id: `builtin-${key}`,
                userId: systemUser.id,
                name: viz.name,
                type: String(viz.type),
                config: JSON.stringify(viz.config),
                backgroundType: String(viz.backgroundType),
                backgroundConfig: JSON.stringify(viz.backgroundConfig),
                width: viz.width,
                height: viz.height,
                fps: viz.fps,
                isBuiltIn: true,
            },
        });
        console.log(`  ✅ Visualizer: ${viz.name}`);
    }
    console.log('🌱 Seeding completed!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map
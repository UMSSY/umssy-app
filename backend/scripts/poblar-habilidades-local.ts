import { PrismaClient } from '../src/prisma/index.js';

const prisma: PrismaClient = new PrismaClient();

const TECH_SKILLS: string[] = [
  'Java', 'Python', 'TypeScript', 'JavaScript', 'C++', 'C#', 'PHP', 'Go', 'Rust', 'Ruby',
  'Spring Boot', 'NestJS', 'Express.js', 'React', 'Next.js', 'Angular', 'Vue.js', 'Tailwind CSS',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server',
  'Scrum', 'Kanban', 'Agile', 'Cascada (Waterfall)', 'Liderazgo Técnico', 'Scrum Master', 'Product Owner',
  'Linux', 'Docker', 'Kubernetes', 'Ansible', 'AWS', 'Google Cloud', 'Azure', 'CI/CD', 'Git',
  'Ciberseguridad', 'Ethical Hacking', 'REST API', 'GraphQL', 'gRPC', 'WebSockets'
];

async function main(): Promise<void> {
  console.log('Insertando habilidades en la base de datos...');
  for (const name of TECH_SKILLS) {
    await prisma.skill.upsert({
      where: { name },
      update: {},
      create: {
        name,
        isCustom: false,
      },
    });
  }
  console.log('¡Proceso completado con éxito!');
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
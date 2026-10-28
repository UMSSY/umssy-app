import type { Prisma } from '../../../prisma/client.js';
import type { RadarAreaId } from '../../profile/types/radar-area-id.type.js';

export const SEED_SKILLS_CATALOG: readonly { name: string; areaId: RadarAreaId }[] = [
  { name: 'JavaScript', areaId: 'desarrollo' },
  { name: 'TypeScript', areaId: 'desarrollo' },
  { name: 'Java', areaId: 'desarrollo' },
  { name: 'C++', areaId: 'desarrollo' },
  { name: 'C#', areaId: 'desarrollo' },
  { name: 'Go', areaId: 'desarrollo' },
  { name: 'Rust', areaId: 'desarrollo' },
  { name: 'PHP', areaId: 'desarrollo' },
  { name: 'Ruby', areaId: 'desarrollo' },
  { name: 'Kotlin', areaId: 'desarrollo' },
  { name: 'Swift', areaId: 'desarrollo' },
  { name: 'Dart', areaId: 'desarrollo' },
  { name: 'Scala', areaId: 'desarrollo' },
  { name: 'Assembly', areaId: 'desarrollo' },
  { name: 'HTML5', areaId: 'desarrollo' },
  { name: 'CSS3', areaId: 'desarrollo' },
  { name: 'React', areaId: 'desarrollo' },
  { name: 'React Native', areaId: 'desarrollo' },
  { name: 'Angular', areaId: 'desarrollo' },
  { name: 'Vue.js', areaId: 'desarrollo' },
  { name: 'Next.js', areaId: 'desarrollo' },
  { name: 'Node.js', areaId: 'desarrollo' },
  { name: 'NestJS', areaId: 'desarrollo' },
  { name: 'Express', areaId: 'desarrollo' },
  { name: 'Django', areaId: 'desarrollo' },
  { name: 'FastAPI', areaId: 'desarrollo' },
  { name: 'Flask', areaId: 'desarrollo' },
  { name: 'Spring Boot', areaId: 'desarrollo' },
  { name: '.NET', areaId: 'desarrollo' },
  { name: 'Laravel', areaId: 'desarrollo' },
  { name: 'Tailwind CSS', areaId: 'desarrollo' },
  { name: 'Bootstrap', areaId: 'desarrollo' },
  { name: 'jQuery', areaId: 'desarrollo' },
  { name: 'Flutter', areaId: 'desarrollo' },

  { name: 'Docker', areaId: 'cloud-devops' },
  { name: 'Kubernetes', areaId: 'cloud-devops' },
  { name: 'Git', areaId: 'cloud-devops' },
  { name: 'GitHub', areaId: 'cloud-devops' },
  { name: 'GitLab', areaId: 'cloud-devops' },
  { name: 'Linux', areaId: 'cloud-devops' },
  { name: 'AWS', areaId: 'cloud-devops' },
  { name: 'Azure', areaId: 'cloud-devops' },
  { name: 'Google Cloud', areaId: 'cloud-devops' },
  { name: 'Terraform', areaId: 'cloud-devops' },
  { name: 'Jenkins', areaId: 'cloud-devops' },
  { name: 'CI/CD', areaId: 'cloud-devops' },
  { name: 'Ansible', areaId: 'cloud-devops' },
  { name: 'Nginx', areaId: 'cloud-devops' },
  { name: 'Bash', areaId: 'cloud-devops' },

  { name: 'Python', areaId: 'data-ai' },
  { name: 'R', areaId: 'data-ai' },
  { name: 'MATLAB', areaId: 'data-ai' },
  { name: 'SQL', areaId: 'data-ai' },
  { name: 'PostgreSQL', areaId: 'data-ai' },
  { name: 'MySQL', areaId: 'data-ai' },
  { name: 'MongoDB', areaId: 'data-ai' },
  { name: 'Redis', areaId: 'data-ai' },
  { name: 'SQLite', areaId: 'data-ai' },
  { name: 'SQL Server', areaId: 'data-ai' },
  { name: 'Oracle Database', areaId: 'data-ai' },
  { name: 'Firebase', areaId: 'data-ai' },
  { name: 'Elasticsearch', areaId: 'data-ai' },
  { name: 'Machine Learning', areaId: 'data-ai' },
  { name: 'Deep Learning', areaId: 'data-ai' },
  { name: 'TensorFlow', areaId: 'data-ai' },
  { name: 'PyTorch', areaId: 'data-ai' },
  { name: 'Pandas', areaId: 'data-ai' },
  { name: 'NumPy', areaId: 'data-ai' },
  { name: 'Power BI', areaId: 'data-ai' },
  { name: 'Tableau', areaId: 'data-ai' },

  { name: 'Selenium', areaId: 'qa' },
  { name: 'Cypress', areaId: 'qa' },
  { name: 'Jest', areaId: 'qa' },
  { name: 'JUnit', areaId: 'qa' },
  { name: 'Postman', areaId: 'qa' },

  { name: 'OWASP', areaId: 'ciberseguridad' },
  { name: 'Pentesting', areaId: 'ciberseguridad' },

  { name: 'Scrum', areaId: 'gobernanza-ti' },
  { name: 'Kanban', areaId: 'gobernanza-ti' },
  { name: 'ITIL', areaId: 'gobernanza-ti' },
  { name: 'Jira', areaId: 'gobernanza-ti' },
] as const;

export async function seedSkillsCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.skill.createMany({
    data: SEED_SKILLS_CATALOG.map((skill) => ({
      name: skill.name,
      isCustom: false,
      areaId: skill.areaId,
    })),
    skipDuplicates: true,
  });

  const skillsByArea = new Map<RadarAreaId, string[]>();
  for (const item of SEED_SKILLS_CATALOG) {
    const list = skillsByArea.get(item.areaId) ?? [];
    list.push(item.name);
    skillsByArea.set(item.areaId, list);
  }

  for (const [areaId, names] of skillsByArea.entries()) {
    await tx.skill.updateMany({
      where: { name: { in: names }, areaId: null },
      data: { areaId },
    });
  }
}

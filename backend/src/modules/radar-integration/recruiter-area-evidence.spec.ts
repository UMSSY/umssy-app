import { ProfileSkillsEvents } from '../../common/profile-skills/profile-skills-events.service.js';
import { describe, expect, it, vi } from 'vitest';
import { RadarIntegrationService } from './radar-integration.service.js';
import type { PrismaService } from '../../common/prisma/prisma.service.js';
import type { ProfileSkillsAnalysisService } from '../nlp/services/profile-skills-analysis.service.js';

const UUID = 'a0000000-0000-4000-8000-000000000001';
function build(rawResults:unknown[][]){
  const db={
    $queryRaw:vi.fn(),
    userRole:{findFirst:vi.fn().mockResolvedValue({id:'role'})},
    userSkill:{findMany:vi.fn().mockResolvedValue([])},
    education:{findMany:vi.fn().mockResolvedValue([])},
    certification:{findMany:vi.fn().mockResolvedValue([])},
    workExperience:{findMany:vi.fn().mockResolvedValue([])},
  };
  for(const result of rawResults)db.$queryRaw.mockResolvedValueOnce(result);
  return {db,service:new RadarIntegrationService(db as unknown as PrismaService,{} as ProfileSkillsAnalysisService,new ProfileSkillsEvents())};
}

describe('Detalle documental autorizado para HU4',()=>{
  it('rechaza áreas inexistentes antes de consultar datos',async()=>{
    const {service,db}=build([]);
    await expect(service.recruiterAreaEvidence(UUID,UUID,'inexistente')).rejects.toThrow('Área de afinidad desconocida');
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });
  it('no permite consultar otra postulación sin consentimiento',async()=>{
    const {service,db}=build([[]]);
    await expect(service.recruiterAreaEvidence(UUID,UUID,'qa')).rejects.toThrow('Postulación no disponible');
    expect(db.userSkill.findMany).not.toHaveBeenCalled();
  });
  it('filtra referencias ajenas a las habilidades aprobadas y solo muestra metadatos permitidos',async()=>{
    const {service,db}=build([
      [{user_id:UUID,company_id:UUID}],
      [{company_id:UUID}],
      [{evidence:{qa:[{id:'valid',name:'Cypress'},{id:'revoked',name:'Otra'}]}}],
    ]);
    db.userSkill.findMany.mockResolvedValue([{skillId:'valid',evidenceRefs:[{type:'education',id:'edu1'},{type:'cv',id:'cv-privado'}]}]);
    db.education.findMany.mockResolvedValue([{id:'edu1',degree:'Ingeniería',institution:'UMSS',startDate:new Date('2021-01-01T00:00:00Z'),description:null}]);
    const result=await service.recruiterAreaEvidence(UUID,UUID,'qa');
    expect(result.tags).toEqual(['Cypress']);
    expect(result.education).toHaveLength(1);
    expect(result.certifications).toEqual([]);
    expect(result.experiences).toEqual([]);
    expect(JSON.stringify(result)).not.toContain('cv-privado');
    expect(JSON.stringify(result)).not.toContain('Otra');
  });
});

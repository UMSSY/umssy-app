import {describe,expect,it} from 'vitest';
import {scoreVerifiedSkills,emptyScores,matchRadar,AREA_IDS} from './radar-scoring.js';

describe('Épica 3 / trazabilidad de evidencias',()=>{
  const base={id:'skill-1',name:'TypeScript',areaId:'desarrollo',isHighRelevance:true};
  it('cambia la huella ante un cambio de documento que respalda la misma habilidad',()=>{
    const a=scoreVerifiedSkills([{...base,evidenceRefs:[{type:'cv',id:'a'}]}]);
    const b=scoreVerifiedSkills([{...base,evidenceRefs:[{type:'cv',id:'b'}]}]);
    expect(a.scores).toEqual(b.scores);
    expect(a.fingerprint).not.toEqual(b.fingerprint);
  });
  it('huella idempotente si se reordenan las referencias',()=>{
    const refs=[{type:'cv',id:'a'},{type:'education',id:'b'}];
    const a=scoreVerifiedSkills([{...base,evidenceRefs:refs}]);
    const b=scoreVerifiedSkills([{...base,evidenceRefs:[...refs].reverse()}]);
    expect(a.fingerprint).toEqual(b.fingerprint);
  });
  it('no almacena referencias de documento privadas dentro del resumen publicado',()=>{
    const r=scoreVerifiedSkills([{...base,evidenceRefs:[{type:'cv',id:'cv-privado'}]}]);
    expect(JSON.stringify(r.evidence)).not.toContain('cv-privado');
  });
  it('mantiene seis ejes y porcentaje dentro de rango',()=>{
    const zero=emptyScores();
    expect(Object.keys(zero)).toEqual([...AREA_IDS]);
    const high={...zero,qa:10};
    expect(matchRadar(high,zero).match).toBeGreaterThanOrEqual(0);
    expect(matchRadar(high,zero).match).toBeLessThanOrEqual(100);
  });
});

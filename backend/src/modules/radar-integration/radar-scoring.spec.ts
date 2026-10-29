import { describe, expect, it } from 'vitest';
import { AREA_IDS, emptyScores, matchRadar, scoreVerifiedSkills } from './radar-scoring.js';

describe('Épica 3 · rúbrica determinista provisional',()=>{
  it('crea seis ejes vacíos',()=>{const v=scoreVerifiedSkills([]);expect(Object.keys(v.scores)).toEqual([...AREA_IDS]);expect(v.average).toBe(0);});
  it('pondera habilidades verificadas por área',()=>{const v=scoreVerifiedSkills([{id:'1',name:'Node',areaId:'desarrollo',isHighRelevance:true}]);expect(v.scores.desarrollo).toBe(1.5);});
  it('no cuenta una misma habilidad repetida',()=>{const skill={id:'1',name:'Node',areaId:'desarrollo',isHighRelevance:false};expect(scoreVerifiedSkills([skill,skill]).scores.desarrollo).toBe(1);});
  it('preserva fingerprint con entrada reordenada',()=>{const a={id:'1',name:'Node',areaId:'desarrollo',isHighRelevance:false};const b={id:'2',name:'Docker',areaId:'cloud-devops',isHighRelevance:false};expect(scoreVerifiedSkills([a,b]).fingerprint).toBe(scoreVerifiedSkills([b,a]).fingerprint);});
  it('limita todos los ejes a diez',()=>{const skills=Array.from({length:30},(_,i)=>({id:`s-${i}`,name:`Tecnología ${i}`,areaId:'qa',isHighRelevance:true}));expect(scoreVerifiedSkills(skills).scores.qa).toBe(10);});
  it('ignora skills sin área catalogada',()=>{const v=scoreVerifiedSkills([{id:'x',name:'X',areaId:'no-existe',isHighRelevance:true}]);expect(v.average).toBe(0);});
  it('devuelve cero brecha para puntajes iguales',()=>{const scores=emptyScores();expect(matchRadar(scores,scores).match).toBe(100);expect(matchRadar(scores,scores).gaps.qa).toBe(0);});
  it('calcula la brecha como candidato menos objetivo',()=>{const a=emptyScores();const b=emptyScores();b.qa=10;expect(matchRadar(a,b).gaps.qa).toBe(-10);expect(matchRadar(a,b).match).toBeGreaterThanOrEqual(0);});
});

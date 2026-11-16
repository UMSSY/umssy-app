import { describe, expect, it } from 'vitest';
import {
  apiArray,
  apiEnum,
  apiExampleOf,
  apiInteger,
  apiNullable,
  apiObject,
  apiString,
  apiUuid,
} from '../utils/api-schema.js';

const ID = '3f1c9a58-2b7e-4c4d-8e61-9d0a5b7c2e14';

describe('api-schema', () => {
  it('marca como requeridas todas las propiedades menos las opcionales', () => {
    const schema = apiObject({ id: apiUuid(ID), nickname: apiString('Ana') }, [
      'nickname',
    ]);

    expect(schema.required).toEqual(['id']);
    expect(schema.type).toBe('object');
  });

  it('arma el ejemplo de un objeto con los ejemplos de sus propiedades', () => {
    const schema = apiObject({
      id: apiUuid(ID),
      score: apiInteger(82, { minimum: 0, maximum: 100 }),
      status: apiEnum(['Cumple', 'Pendiente'], 'Cumple'),
    });

    expect(apiExampleOf(schema)).toEqual({
      id: ID,
      score: 82,
      status: 'Cumple',
    });
  });

  it('arma el ejemplo de un arreglo con un elemento', () => {
    const schema = apiArray(apiObject({ name: apiString('NestJS') }));

    expect(apiExampleOf(schema)).toEqual([{ name: 'NestJS' }]);
  });

  it('hereda el ejemplo del esquema al hacerlo nullable', () => {
    const schema = apiNullable(apiString('Ingeniera de Sistemas'));

    expect(schema.nullable).toBe(true);
    expect(apiExampleOf(schema)).toBe('Ingeniera de Sistemas');
  });

  it('usa null como ejemplo cuando el esquema no trae uno', () => {
    expect(apiExampleOf(apiNullable({ type: 'object' }))).toBeNull();
  });

  it('permite pedir null como ejemplo de un esquema con ejemplo propio', () => {
    expect(apiExampleOf(apiNullable(apiString('x'), null))).toBeNull();
  });

  it('copia los valores permitidos de un enum sin compartir el arreglo', () => {
    const values = ['manual', 'cv'];
    const schema = apiEnum(values, 'cv');

    values.push('experience');

    expect(schema.enum).toEqual(['manual', 'cv']);
  });
});

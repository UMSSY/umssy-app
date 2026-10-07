import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useJobOfferForm } from './use-job-offer-form';

describe('useJobOfferForm', () => {
  it('inicializa con el paso 1 y condiciones vacías', () => {
    const { result } = renderHook(() => useJobOfferForm());
    expect(result.current.currentStep).toBe(1);
    expect(result.current.conditions.title).toBe("");
    expect(result.current.conditions.description).toBe("");
  });

  it('actualiza un campo de texto correctamente', () => {
    const { result } = renderHook(() => useJobOfferForm());
    act(() => {
      result.current.updateField('title', 'Desarrollador React');
    });
    expect(result.current.conditions.title).toBe('Desarrollador React');
  });

  it('actualiza la descripción correctamente', () => {
    const { result } = renderHook(() => useJobOfferForm());
    act(() => {
      result.current.updateField('description', 'Descripción del puesto');
    });
    expect(result.current.conditions.description).toBe('Descripción del puesto');
  });

  it('selecciona la modalidad correctamente', () => {
    const { result } = renderHook(() => useJobOfferForm());
    act(() => {
      result.current.selectModality('Remoto');
    });
    expect(result.current.conditions.modality).toBe('Remoto');
  });

  it('avanza de paso sin superar el límite de 3', () => {
    const { result } = renderHook(() => useJobOfferForm());
    
    act(() => { result.current.goNext(); });
    expect(result.current.currentStep).toBe(2);
    
    act(() => { result.current.goNext(); });
    expect(result.current.currentStep).toBe(3);

    act(() => { result.current.goNext(); });
    expect(result.current.currentStep).toBe(3);
  });

  it('vuelve al paso 2 sin modificar los datos ingresados', () => {
    const { result } = renderHook(() => useJobOfferForm());

    act(() => {
      result.current.goNext();
      result.current.goNext();
      result.current.updateField('title', 'Desarrollador React');
      result.current.updateField('description', 'Experiencia en React');
      result.current.updateField('skills', ['React', 'TypeScript']);
      result.current.goBack();
    });

    expect(result.current.currentStep).toBe(2);
    expect(result.current.conditions.title).toBe('Desarrollador React');
    expect(result.current.conditions.description).toBe('Experiencia en React');
    expect(result.current.conditions.skills).toEqual(['React', 'TypeScript']);
  });
});

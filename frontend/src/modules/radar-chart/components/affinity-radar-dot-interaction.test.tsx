import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AffinityRadarDot } from './affinity-radar-dot';

const area = {id:'qa' as const,name:'QA',score:4.5};
afterEach(cleanup);

describe('Radar: puntos interactivos reales',()=>{
  it('selecciona el área haciendo clic en el punto, no en un área fija',()=>{
    const onAreaClick=vi.fn();
    render(<svg><AffinityRadarDot area={area} cx={150} cy={90} onAreaClick={onAreaClick}/></svg>);
    const point=screen.getByTestId('radar-dot-qa');
    const hit=point.querySelector('circle');
    expect(hit?.getAttribute('cx')).toBe('150');
    expect(hit?.getAttribute('cy')).toBe('90');
    fireEvent.click(hit!);
    expect(onAreaClick).toHaveBeenCalledWith('qa');
  });
  it('reubica el clic cuando el puntaje produce nuevas coordenadas y admite teclado',()=>{
    const onAreaClick=vi.fn();
    const {rerender}=render(<svg><AffinityRadarDot area={area} cx={150} cy={90} onAreaClick={onAreaClick}/></svg>);
    rerender(<svg><AffinityRadarDot area={area} cx={210} cy={140} onAreaClick={onAreaClick}/></svg>);
    const point=screen.getByTestId('radar-dot-qa');
    expect(point.querySelector('circle')?.getAttribute('cx')).toBe('210');
    expect(point.querySelector('circle')?.getAttribute('cy')).toBe('140');
    fireEvent.keyDown(point,{key:'Enter'});
    fireEvent.keyDown(point,{key:' '});
    expect(onAreaClick).toHaveBeenCalledTimes(2);
  });
});

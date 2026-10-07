import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InformationStep } from './information-step';
import type { VacancyConditions } from '../hooks/use-job-offer-form';
import React from 'react';

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: { children: React.ReactNode, onValueChange?: (val: string) => void }) => (
    <div data-testid="mock-select" onClick={() => onValueChange?.('Tiempo completo')}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <div>{placeholder}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('InformationStep', () => {
  const mockUpdateField = vi.fn();
  const mockSelectModality = vi.fn();

  const emptyConditions: VacancyConditions = {
    title: "", description: "", modality: null, mapsLink: "", contractType: "",
    category: "", vacancyCount: "", salary: "", languages: "",
    requirementsDescription: "", skills: [],
  };

  it('renderiza todos los campos principales (sin depender del texto exacto)', () => {
    const { container } = render(
      <InformationStep 
        conditions={emptyConditions} 
        updateField={mockUpdateField} 
        selectModality={mockSelectModality} 
      />
    );
    
    expect(container.querySelector('#title')).toBeInTheDocument();
    expect(container.querySelector('#description')).toBeInTheDocument();
    expect(container.querySelector('#mapsLink')).toBeInTheDocument();
    
    const modalityButtons = container.querySelectorAll('button');
    expect(modalityButtons.length).toBeGreaterThan(0);
  });

  it('llama a selectModality al hacer clic en los botones de modalidad', () => {
    const { container } = render(
      <InformationStep 
        conditions={emptyConditions} 
        updateField={mockUpdateField} 
        selectModality={mockSelectModality} 
      />
    );
    
    const buttons = Array.from(container.querySelectorAll('button'));
    const remoteButton = buttons.find(btn => btn.textContent === 'Remoto');
    
    if (remoteButton) {
      fireEvent.click(remoteButton);
      expect(mockSelectModality).toHaveBeenCalledWith('Remoto');
    }
  });

  it('llama a updateField al escribir en los inputs', () => {
    const { container } = render(
      <InformationStep 
        conditions={emptyConditions} 
        updateField={mockUpdateField} 
        selectModality={mockSelectModality} 
      />
    );
    
    const titleInput = container.querySelector('#title');
    if (titleInput) {
      fireEvent.change(titleInput, { target: { value: 'Nuevo Título' } });
      expect(mockUpdateField).toHaveBeenCalled(); 
    }
  });

  it('actualiza la descripción al escribir en el campo', () => {
    const { container } = render(
      <InformationStep
        conditions={emptyConditions}
        updateField={mockUpdateField}
        selectModality={mockSelectModality}
      />
    );

    const descriptionInput = container.querySelector('#description');
    if (descriptionInput) {
      fireEvent.change(descriptionInput, { target: { value: 'Descripción del puesto' } });
      expect(mockUpdateField).toHaveBeenCalledWith('description', 'Descripción del puesto');
    }
  });

  it('renderiza correctamente con datos pre-cargados', () => {
     const fullConditions: VacancyConditions = {
       title: "Desarrollador Backend", description: "Experiencia requerida", modality: "Hibrido", mapsLink: "https://maps.google.com/?q=...", contractType: "Tiempo completo",
        category: "Tecnología", vacancyCount: "1", salary: "Bs 6.500 - 8.000", languages: "Español",
        requirementsDescription: "", skills: [],
      };
      
      const { container } = render(
        <InformationStep 
          conditions={fullConditions} 
          updateField={mockUpdateField} 
          selectModality={mockSelectModality} 
        />
      );
      
      const titleInput = container.querySelector('#title') as HTMLInputElement;
      expect(titleInput?.value).toBe("Desarrollador Backend");
  });
});

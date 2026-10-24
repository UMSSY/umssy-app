'use client';

/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useContactSearch } from '../hooks/use-contact-search';
import { getInitials } from '../utils/date-formatter';
import { User } from '../types/user.types';

interface ContactSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (user: User) => void;
}

export function ContactSearchModal({ isOpen, onClose, onSelectContact }: ContactSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const { results, isSearching } = useContactSearch(searchTerm);
  
  // Referencias para hacer auto-scroll a los elementos seleccionados por teclado
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (selectedIndex >= 0 && optionRefs.current[selectedIndex]) {
      optionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  const handleClose = () => {
    setSearchTerm('');
    setSelectedIndex(-1);
    onClose();
  };

  const handleSelectUser = (user: User) => {
    onSelectContact(user);
    handleClose();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelectUser(results[selectedIndex]);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-base font-medium text-ink">
            Nueva conversación
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <Input
            autoFocus
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            className="w-full"
            aria-label="Buscar contactos"
          />
        </div>

        <div 
          className="mt-2 flex max-h-[320px] flex-col gap-1 overflow-y-auto pr-1 pb-4"
          role="listbox"
          aria-label="Lista de contactos"
        >
          {isSearching ? (
            <div className="py-6 text-center text-sm text-text-secondary" role="status">
              Buscando...
            </div>
          ) : results.length > 0 ? (
            results.map((user, index) => {
              const isSelected = index === selectedIndex;
              return (
                <Button variant="ghost"
                  key={user.id}
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectUser(user)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex h-auto w-full min-w-0 cursor-pointer items-center justify-start gap-3 rounded-lg p-2.5 text-left whitespace-normal transition-colors outline-none ${
                    isSelected
                      ? 'bg-surface-soft ring-2 ring-ring/20'
                      : 'hover:bg-surface-soft focus-visible:bg-surface-soft focus-visible:ring-2 focus-visible:ring-ring'
                  }`}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="size-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-border text-sm font-bold text-ink-soft">
                      {getInitials(user.fullName)}
                    </div>
                  )}
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium text-ink">
                      {user.fullName}
                    </span>
                    {user.headline && (
                      <span className="truncate text-xs text-text-secondary">
                        {user.headline}
                      </span>
                    )}
                  </div>
                </Button>
              );
            })
          ) : (
            searchTerm.trim().length >= 2 && (
              <div className="py-6 text-center text-sm text-text-secondary">
                No se encontraron usuarios
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
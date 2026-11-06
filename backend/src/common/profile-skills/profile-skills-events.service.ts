import { Injectable, Logger } from '@nestjs/common';

export interface ProfileSkillsPublished {
  userId: string;
  inputRevision: number;
  resultVersion: number;
}

type PublicationListener = (publication: ProfileSkillsPublished) => Promise<void>;

@Injectable()
export class ProfileSkillsEvents {
  private readonly listeners = new Set<PublicationListener>();
  private readonly logger = new Logger(ProfileSkillsEvents.name);

  subscribe(listener: PublicationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Se espera a los consumidores dentro de la petición para evitar tareas sueltas en serverless.
  // Un fallo del consumidor no debe invalidar un resultado de NLP ya confirmado.
  async published(publication: ProfileSkillsPublished): Promise<void> {
    const results = await Promise.allSettled([...this.listeners].map(listener => Promise.resolve().then(() => listener(publication))));
    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.error(JSON.stringify({ event: 'profile.skills.consumer_failed', ...publication }));
      }
    }
  }
}

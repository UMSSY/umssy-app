import type { PortfolioProjectEntity } from './portfolio-project-entity.type.js';

export type PortfolioProjectMetadataUpdate = Pick<
  PortfolioProjectEntity,
  | 'id'
  | 'repoName'
  | 'repoUrl'
  | 'description'
  | 'language'
  | 'starsCount'
  | 'isOwner'
>;

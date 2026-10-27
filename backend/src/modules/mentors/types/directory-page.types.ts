import type { MentorMapper } from '../mappers/mentor.mapper.js';
import type { MentorDirectoryQuery } from '../requests/mentor-directory-query.schema.js';
export type DirectoryPage = {
  items: Array<
    ReturnType<MentorMapper['toDirectoryResponse']> & {
      sharedInterestsCount?: number;
    }
  >;
  page: number;
  pageSize: 6;
  totalItems: number;
  totalPages: number;
  effectiveSort: MentorDirectoryQuery['sort'];
  affinityStatus?: 'ready' | 'no_skills' | 'unmapped_skills';
};

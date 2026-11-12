import { WorkspacePage } from '@/shared/components/layout/workspace-page';
import { ProposalForm } from '../components/proposal-form';

export function ProposeWorkshopView() {
  return <WorkspacePage headingClassName="border-b-0 pb-0" title="Proponer taller" description="Comparte tu conocimiento con la comunidad de titulados."><ProposalForm /></WorkspacePage>;
}

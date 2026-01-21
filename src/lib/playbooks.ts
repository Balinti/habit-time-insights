import { Playbook } from './types';

export const PLAYBOOKS: Playbook[] = [
  {
    id: 'morning-block',
    title: 'Morning Focus Block',
    description: 'Start your day with a dedicated 2-hour focus block before checking email or messages.',
    hypothesis: 'By starting each day with a dedicated focus block before any communication, I will increase my total daily focus blocks.',
    metric: 'Uninterrupted focus blocks per day (25+ minutes each)',
    defaultConstraint: 'No email or Slack before 10am',
    category: 'Schedule',
  },
  {
    id: 'notification-fast',
    title: 'Notification Fast',
    description: 'Disable all non-essential notifications during work hours to reduce context switching.',
    hypothesis: 'By eliminating non-essential notifications during work hours, I will complete more uninterrupted focus blocks.',
    metric: 'Uninterrupted focus blocks per day (25+ minutes each)',
    defaultConstraint: 'Phone on DND, Slack notifications off 9am-5pm',
    category: 'Environment',
  },
  {
    id: 'meeting-batching',
    title: 'Meeting Batching',
    description: 'Consolidate all meetings to specific days or time blocks to protect focus time.',
    hypothesis: 'By batching meetings into designated slots, I will have more contiguous time for deep work.',
    metric: 'Uninterrupted focus blocks per day (25+ minutes each)',
    defaultConstraint: 'Meetings only on Tue/Thu or after 2pm daily',
    category: 'Schedule',
  },
  {
    id: 'energy-mapping',
    title: 'Energy-Aligned Work',
    description: 'Schedule your most demanding tasks during your peak energy hours.',
    hypothesis: 'By aligning deep work with my natural energy peaks, I will complete more high-quality focus blocks.',
    metric: 'Uninterrupted focus blocks per day (25+ minutes each)',
    defaultConstraint: 'Deep work only during my peak hours (identify yours)',
    category: 'Energy',
  },
  {
    id: 'workspace-ritual',
    title: 'Focus Workspace Ritual',
    description: 'Create a dedicated focus ritual: specific location, startup routine, and end-of-session signal.',
    hypothesis: 'By establishing a consistent focus ritual, I will enter deep work states more reliably.',
    metric: 'Uninterrupted focus blocks per day (25+ minutes each)',
    defaultConstraint: 'Same desk setup, same startup routine, timer for blocks',
    category: 'Environment',
  },
];

export function getPlaybookById(id: string): Playbook | undefined {
  return PLAYBOOKS.find(p => p.id === id);
}

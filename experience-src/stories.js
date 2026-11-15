// STORIES — one entry per published story. Add a new object here (and a new
// environment file) to add a new location. Nothing here is invented: only
// stories that are actually published belong in this list.
import { greenhouseLibrary } from './environments/greenhouse-library.js';

export const STORIES = [
  {
    id: '001',
    label: 'Story 001 — The student',
    name: 'Christina',
    description:
      "A fourth-year psychology major on the pre-med track at UC Riverside, on pressure, doubt, and what she wishes someone had told her sooner.",
    cta: 'View her story',
    href: 'story-christina.html',
    environment: greenhouseLibrary,
  },
];

// Rooms planned for future stories. Shown only as "in production".
export const UPCOMING_ENVIRONMENTS = ['Café', 'Restaurant', 'Recording studio', 'Workspace'];

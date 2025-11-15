// Landing page progression state machine
export type ProgressionState =
  | 'WAITING_FOR_LOADER'      // Universal loader running (triangles + percentage)
  | 'WAITING_FOR_CONSENT'     // Audio consent lightbox visible (over dimmed background)
  | 'CONSENT_CLOSING'         // User made choice, lightbox fading out (500ms)
  | 'MAIN_CONTENT'            // Logo + stars fading in, background full brightness
  | 'CONTENT_COMPLETE';       // Logo video loaded, phase cards can appear

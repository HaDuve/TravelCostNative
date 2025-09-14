export type OnboardingFlags = {
  /** Whether the user was freshly created and hasn't completed initial setup */
  freshlyCreated: boolean;
  /** Whether the user needs to complete the guided tour */
  needsTour: boolean;
};

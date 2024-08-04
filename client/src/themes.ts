export const themes: Record<string, StyleState> = {
  Dark: {
    activeSentenceBackgroundColor: "#FFFF00",
    loadingSentenceBackgroundColor: "#333333",
    inactiveSentenceColor: "#888888",
    readySentenceColor: "#FFFFFF",
    background: "#111111",
  },
  Light: {
    activeSentenceBackgroundColor: "#FFFF00",
    loadingSentenceBackgroundColor: "#CCCCCC",
    inactiveSentenceColor: "#888888",
    readySentenceColor: "#111111",
    background: "#DDDDDD",
  },
};

type StyleState = {
  activeSentenceBackgroundColor: string;
  loadingSentenceBackgroundColor: string;
  inactiveSentenceColor: string;
  readySentenceColor: string;
  background: string;
};
